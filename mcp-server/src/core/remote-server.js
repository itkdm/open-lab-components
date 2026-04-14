import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "node:http";
import { createServer as createMcpServer, initializeFeedbackRuntime } from "./server.js";
import { loadCustomers, loadRuntimeConfig } from "../runtime/config.js";
import { readBearerToken, secureEqual, toolAllowed } from "../runtime/auth.js";
import { createRateLimiter } from "../runtime/rate-limit.js";
import { createLogger } from "../runtime/logger.js";
import { createMetricsStore } from "../runtime/metrics.js";
import { createSessionStore } from "../runtime/session-store.js";
import { createCorsMiddleware } from "../runtime/cors.js";
import { createCustomerRegistry } from "../runtime/customer-registry.js";
import { feedbackStore } from "../feedback/feedback-store.js";

function isInitializeRequest(body) {
  return !!body && typeof body === "object" && !Array.isArray(body) && body.method === "initialize";
}

function extractToolName(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (body.method !== "tools/call") return null;
  return body.params && typeof body.params.name === "string" ? body.params.name : null;
}

function injectCustomerId(body, customerId) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return;
  if (body.method !== "tools/call") return;
  if (!body.params || typeof body.params !== "object") return;
  if (!body.params.arguments || typeof body.params.arguments !== "object") {
    body.params.arguments = {};
  }
  if (!body.params.arguments.customerId) {
    body.params.arguments.customerId = customerId;
  }
}

function unauthorized(res, status, payload, headers = {}) {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.status(status).json(payload);
}

function tokenMatches(candidate, expected) {
  if (!candidate || !expected) return false;
  return secureEqual(candidate, expected);
}

function customerRegistryFailure(error, fallback) {
  if (error && error.code === "customer_exists") {
    return { status: 409, error: "customer_exists", category: "conflict" };
  }
  if (error && error.code === "customer_not_found") {
    return { status: 404, error: "customer_not_found", category: "not_found" };
  }
  if (error && error.code === "invalid_customer") {
    return { status: 400, error: "invalid_customer", category: "validation" };
  }
  if (error && error.code === "persist_failed") {
    return { status: 500, error: "customer_persist_failed", category: "infrastructure" };
  }
  return fallback;
}

function createRemoteMcpError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function ensureRemoteMcpError(error, fallbackCode) {
  if (error && typeof error.code === "string") return error;
  const wrapped = new Error(error && error.message ? error.message : String(error));
  wrapped.code = fallbackCode;
  return wrapped;
}

function classifyRemoteMcpError(error) {
  if (error && typeof error.code === "string") {
    if (error.code.startsWith("session_")) {
      return "session";
    }
    return "runtime";
  }
  const message = error && error.message ? String(error.message).toLowerCase() : String(error || "").toLowerCase();
  if (message.includes("session")) {
    return "session";
  }
  return "runtime";
}

function remoteRejectionCategory(code) {
  if (!code) return "runtime";
  if (String(code).startsWith("session_") || code === "invalid_session") {
    return "session";
  }
  if (code === "tool_not_allowed" || code === "rate_limited") {
    return "policy";
  }
  if (code === "missing_token" || code === "invalid_token" || code === "inactive_customer" || code === "expired_token") {
    return "auth";
  }
  return "runtime";
}

function recordRemoteMcpRejection(metrics, code, toolName = null) {
  metrics.recordRemoteMcpError({
    category: remoteRejectionCategory(code),
    code,
    toolName
  });
}

async function createRemoteApp(options = {}) {
  const runtime = {
    ...loadRuntimeConfig(options.env),
    ...options.runtime
  };
  await initializeFeedbackRuntime({ runtime });
  const customerConfig = loadCustomers(runtime.configPath);
  const customerRegistry = createCustomerRegistry({
    configPath: customerConfig.path,
    customers: customerConfig.customers
  });
  customerRegistry.loadFromDisk();
  const limiter = createRateLimiter();
  const logger = options.logger || createLogger(runtime.logLevel);
  const mcpServerFactory = options.createMcpServer || createMcpServer;
  const metrics = createMetricsStore();
  const sessions = createSessionStore({
    ttlMs: runtime.sessionTtlMs,
    maxSessionsPerCustomer: runtime.maxSessionsPerCustomer,
    onExpired: (_session, reason) => {
      metrics.recordSessionClosed();
      logger.info({
        event: "remote_mcp_session_closed",
        reason
      });
    }
  });

  const app = createMcpExpressApp({
    host: runtime.host,
    allowedHosts: runtime.allowedHosts.length ? runtime.allowedHosts : undefined
  });

  if (runtime.trustProxy && typeof app.set === "function") {
    app.set("trust proxy", true);
  }

  app.use(createCorsMiddleware(runtime.allowedOrigins));

  function getCustomerSnapshot() {
    return customerRegistry.snapshot();
  }

  function getCustomerCount() {
    return getCustomerSnapshot().length;
  }

  function ensureAdminRequestId(req, res) {
    const requestId =
      typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"].trim()
        ? req.headers["x-request-id"].trim()
        : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    return requestId;
  }

  function requireAdmin(req, res) {
    if (runtime.adminBearerToken) {
      const token = readBearerToken(req);
      if (!tokenMatches(token, runtime.adminBearerToken)) {
        unauthorized(res, 401, { error: "missing_admin_token", message: "Missing or invalid admin token" }, {
          "WWW-Authenticate": "Bearer"
        });
        return false;
      }
    }
    return true;
  }

  function handleAdminWriteError(req, res, action, error, fallback) {
    const failure = customerRegistryFailure(error, fallback);
    metrics.recordAdminWrite({
      action,
      outcome: "failure",
      category: failure.category || "unknown"
    });
    logger.error({
      event: "admin_customer_write_failed",
      action,
      route: req.path,
      method: req.method,
      requestId: req.requestId || null,
      customerId: req.params && typeof req.params.customerId === "string" ? req.params.customerId : null,
      status: failure.status,
      error: failure.error,
      category: failure.category || "unknown",
      message: error && error.message ? error.message : String(error)
    });
    res.status(failure.status).json({
      error: failure.error,
      category: failure.category || "unknown",
      message: error.message || String(error)
    });
  }

  function logAdminWriteSuccess(req, action, details = {}) {
    metrics.recordAdminWrite({
      action,
      outcome: "success",
      category: details.category || "none"
    });
    logger.info({
      event: "admin_customer_write_succeeded",
      action,
      route: req.path,
      method: req.method,
      requestId: req.requestId || null,
      customerId: req.params && typeof req.params.customerId === "string" ? req.params.customerId : details.customerId || null,
      status: details.status,
      outcome: details.outcome || "success"
    });
  }

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, status: "ok" });
  });

  app.get("/readyz", async (_req, res) => {
    const feedback = await feedbackStore.healthCheck();
    const ok = feedback.ok;

    res.status(ok ? 200 : 503).json({
      ok,
      status: ok ? "ok" : "degraded",
      customers: getCustomerCount(),
      sessionTtlMs: runtime.sessionTtlMs,
      maxSessionsPerCustomer: runtime.maxSessionsPerCustomer,
      feedback
    });
  });

  app.get("/metrics", async (req, res) => {
    if (runtime.metricsBearerToken || runtime.adminBearerToken) {
      const token = readBearerToken(req);
      const validTokens = [runtime.metricsBearerToken, runtime.adminBearerToken].filter(Boolean);
      if (!validTokens.some((expectedToken) => tokenMatches(token, expectedToken))) {
        unauthorized(res, 401, { error: "missing_metrics_token", message: "Missing or invalid metrics token" }, {
          "WWW-Authenticate": "Bearer"
        });
        return;
      }
    }

    const feedbackHealth = await feedbackStore.healthCheck();
    const feedbackSnapshot = feedbackStore.snapshot();

    res.status(200).json(
      metrics.snapshot({
        customerCount: getCustomerCount(),
        sessions: sessions.snapshot(),
        feedbackStoreSummary: {
          backend: feedbackSnapshot.backend,
          tenantCount: feedbackSnapshot.tenantCount,
          trackedComponents: feedbackSnapshot.trackedComponents,
          halfLifeDays: feedbackSnapshot.halfLifeDays,
          persistencePath: feedbackSnapshot.persistencePath || null
        },
        feedbackStore: {
          backend: feedbackSnapshot.backend,
          ok: feedbackHealth.ok,
          tenantCount: feedbackSnapshot.tenantCount,
          trackedComponents: feedbackSnapshot.trackedComponents,
          halfLifeDays: feedbackSnapshot.halfLifeDays,
          persistencePath: feedbackSnapshot.persistencePath || null,
          backendMeta: feedbackSnapshot.backendMeta || null,
          detail: feedbackHealth.detail || null,
          error: feedbackHealth.error || null
        },
        feedbackBackend: {
          kind: feedbackHealth.backend,
          ok: feedbackHealth.ok,
          detail: feedbackHealth.detail || null,
          error: feedbackHealth.error || null
        }
      })
    );
  });

  app.get("/admin/overview", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    const customerSummary = customerRegistry.summary();
    const feedbackSnapshot = feedbackStore.snapshot();
    const rateLimitSnapshot = limiter.snapshot(
      Object.fromEntries(
        getCustomerSnapshot().map((customer) => [customer.customerId, customer.rateLimit])
      )
    );
    const metricsSnapshot = metrics.snapshot({
      customerCount: getCustomerCount(),
      sessions: sessions.snapshot(),
      feedbackStoreSummary: {
        backend: feedbackSnapshot.backend,
        tenantCount: feedbackSnapshot.tenantCount,
        trackedComponents: feedbackSnapshot.trackedComponents,
        halfLifeDays: feedbackSnapshot.halfLifeDays,
        persistencePath: feedbackSnapshot.persistencePath || null
      }
    });

    res.status(200).json({
      ...customerSummary,
      feedbackBackend: feedbackSnapshot.backend,
      feedbackTenants: feedbackSnapshot.tenantCount,
      feedbackTrackedComponents: feedbackSnapshot.trackedComponents,
      rateLimitSnapshot,
      activeSessions: metricsSnapshot.activeSessions,
      totalSessionsCreated: metricsSnapshot.totalSessionsCreated,
      adminWrites: metricsSnapshot.adminWrites,
      adminWriteSummary: metricsSnapshot.adminWriteSummary,
      remoteMcpErrors: metricsSnapshot.remoteMcpErrors,
      remoteMcpErrorSummary: metricsSnapshot.remoteMcpErrorSummary,
      remoteMcpErrorCodes: metricsSnapshot.remoteMcpErrorCodes,
      requestsByCustomer: metricsSnapshot.requestsByCustomer,
      feedbackEvents: metricsSnapshot.feedbackEvents
    });
  });

  app.get("/admin/customers", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    const metricsSnapshot = metrics.snapshot();
    const customersSnapshot = getCustomerSnapshot();
    const rateLimitSnapshot = limiter.snapshot(
      Object.fromEntries(
        customersSnapshot.map((customer) => [customer.customerId, customer.rateLimit])
      )
    );
    const customers = customersSnapshot.map((customer) => ({
      ...customer,
      usageCount: metricsSnapshot.requestsByCustomer[customer.customerId] || 0,
      quota: rateLimitSnapshot[customer.customerId] || {
        limit: customer.rateLimit.requestsPerMinute + customer.rateLimit.burst,
        used: 0,
        remaining: customer.rateLimit.requestsPerMinute + customer.rateLimit.burst,
        retryAfterSeconds: 0
      }
    }));

    res.status(200).json({ customers });
  });

  app.post("/admin/customers", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    try {
      const created = customerRegistry.createCustomer(req.body || {});
      logAdminWriteSuccess(req, "create", {
        customerId: created.customer.customerId,
        status: 201
      });
      res.status(201).json({
        customer: created.customer,
        rawToken: created.rawToken
      });
    } catch (error) {
      handleAdminWriteError(req, res, "create", error, {
        status: 500,
        error: "customer_create_failed",
        category: "unknown"
      });
    }
  });

  app.patch("/admin/customers/:customerId", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    try {
      const updated = customerRegistry.updateCustomer(req.params.customerId, req.body || {});
      logAdminWriteSuccess(req, "update", {
        customerId: updated.customerId,
        status: 200
      });
      res.status(200).json({ customer: updated });
    } catch (error) {
      handleAdminWriteError(req, res, "update", error, {
        status: 500,
        error: "customer_update_failed",
        category: "unknown"
      });
    }
  });

  app.post("/admin/customers/:customerId/rotate-token", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    try {
      const rotated = customerRegistry.rotateCustomerToken(req.params.customerId);
      logAdminWriteSuccess(req, "rotate_token", {
        customerId: rotated.customer.customerId,
        status: 200
      });
      res.status(200).json({
        customer: rotated.customer,
        rawToken: rotated.rawToken
      });
    } catch (error) {
      handleAdminWriteError(req, res, "rotate_token", error, {
        status: 500,
        error: "customer_rotate_failed",
        category: "unknown"
      });
    }
  });

  app.delete("/admin/customers/:customerId", (req, res) => {
    ensureAdminRequestId(req, res);
    if (!requireAdmin(req, res)) return;
    try {
      const removed = customerRegistry.removeCustomer(req.params.customerId);
      if (!removed) {
        res.status(404).json({ error: "customer_not_found", category: "not_found", message: "Customer not found" });
        return;
      }
      logAdminWriteSuccess(req, "delete", {
        customerId: req.params.customerId,
        status: 204
      });
      res.status(204).end();
    } catch (error) {
      handleAdminWriteError(req, res, "delete", error, {
        status: 500,
        error: "customer_delete_failed",
        category: "unknown"
      });
    }
  });

  app.use("/mcp", (req, res, next) => {
    const startedAt = Date.now();
    const requestId =
      typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"].trim()
        ? req.headers["x-request-id"].trim()
        : randomUUID();
    res.setHeader("x-request-id", requestId);

    const token = readBearerToken(req);
    const authResult = customerRegistry.authenticateToken(token);
    const sessionId = req.headers["mcp-session-id"];
    const rawToolName = extractToolName(req.body);
    req.requestId = requestId;
    req.mcpToolName = rawToolName;
    if (rawToolName === "submit_recommendation_feedback") {
      const feedbackType =
        req.body &&
        req.body.params &&
        req.body.params.arguments &&
        typeof req.body.params.arguments.feedbackType === "string"
          ? req.body.params.arguments.feedbackType
          : null;
      metrics.recordFeedbackEvent(feedbackType);
    }

    res.on("finish", () => {
      const contentLength = Number(res.getHeader("content-length")) || 0;
      metrics.recordHttpRequest({
        route: req.path,
        customerId: req.customer ? req.customer.customerId : null,
        status: res.statusCode,
        toolName: req.mcpToolName || null,
        durationMs: Date.now() - startedAt
      });
      logger.info({
        event: "remote_mcp_request",
        requestId,
        customerId: req.customer ? req.customer.customerId : null,
        method: req.method,
        path: req.path,
        tool: req.mcpToolName || null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        responseSizeBucket: logger.sizeBucket(contentLength)
      });
    });

    if (!authResult.ok) {
      recordRemoteMcpRejection(metrics, authResult.code, req.mcpToolName || null);
      unauthorized(
        res,
        authResult.status,
        { error: authResult.code, message: authResult.message },
        { "WWW-Authenticate": "Bearer" }
      );
      return;
    }

    req.customer = authResult.customer;
    req.tokenHash = authResult.tokenHash;
    injectCustomerId(req.body, req.customer.customerId);

    if (sessionId) {
      const session = sessions.touch(sessionId);
      if (!session) {
        recordRemoteMcpRejection(metrics, "invalid_session");
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "No valid session ID provided"
        });
        return;
      }

      if (session.customerId !== req.customer.customerId) {
        recordRemoteMcpRejection(metrics, "session_customer_mismatch");
        unauthorized(res, 403, {
          error: "session_customer_mismatch",
          message: "Session does not belong to the authenticated customer"
        });
        return;
      }
    }

    if (req.method === "POST" && req.mcpToolName) {
      if (!toolAllowed(req.customer, req.mcpToolName)) {
        recordRemoteMcpRejection(metrics, "tool_not_allowed", req.mcpToolName);
        unauthorized(res, 403, {
          error: "tool_not_allowed",
          message: `Tool not allowed: ${req.mcpToolName}`
        });
        return;
      }

      const limit = limiter.check(req.customer.customerId, req.customer.rateLimit);
      res.setHeader("x-ratelimit-limit", String(limit.limit));
      res.setHeader("x-ratelimit-remaining", String(limit.remaining));
      if (!limit.allowed) {
        recordRemoteMcpRejection(metrics, "rate_limited", req.mcpToolName);
        unauthorized(
          res,
          429,
          { error: "rate_limited", message: "Rate limit exceeded" },
          { "Retry-After": String(limit.retryAfterSeconds) }
        );
        return;
      }
    }

    next();
  });

  const mcpPostHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];

    try {
      try {
        await sessions.cleanupExpiredSessions();
      } catch (error) {
        throw ensureRemoteMcpError(error, "session_cleanup_failed");
      }
      let session = sessionId ? sessions.getSession(sessionId) : null;

      if (!session && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            const created = sessions.createSession(newSessionId, {
              customerId: req.customer.customerId,
              transport,
              server
            });
            if (!created.ok) {
              const code = created.code || "session_create_failed";
              metrics.recordRemoteMcpError({
                category: classifyRemoteMcpError({ code }),
                code,
                toolName: req.mcpToolName || null
              });
              throw createRemoteMcpError(code, "Session limit exceeded for customer");
            }
            metrics.recordSessionCreated();
            logger.info({
              event: "remote_mcp_session_created",
              requestId: req.requestId,
              customerId: req.customer.customerId,
              sessionId: newSessionId
            });
          }
        });
        const server = mcpServerFactory();

        transport.onclose = () => {
          const activeSessionId = transport.sessionId;
          if (activeSessionId) {
            sessions.deleteSession(activeSessionId, "transport_closed").catch(() => {});
          }
        };

        try {
          await server.connect(transport);
        } catch (error) {
          throw ensureRemoteMcpError(error, "transport_connect_failed");
        }
        try {
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          throw ensureRemoteMcpError(error, "transport_request_failed");
        }
        return;
      }

      if (!session) {
        recordRemoteMcpRejection(metrics, "invalid_session", req.mcpToolName || null);
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "No valid session ID provided"
        });
        return;
      }

      try {
        await session.transport.handleRequest(req, res, req.body);
      } catch (error) {
        throw ensureRemoteMcpError(error, "transport_request_failed");
      }
    } catch (error) {
      const normalizedError = ensureRemoteMcpError(error, "remote_mcp_runtime_error");
      const category = classifyRemoteMcpError(normalizedError);
      metrics.recordRemoteMcpError({
        category,
        code: normalizedError.code,
        toolName: req.mcpToolName || null
      });
      logger.error({
        event: "remote_mcp_error",
        requestId: req.requestId || null,
        customerId: req.customer ? req.customer.customerId : null,
        method: req.method,
        path: req.path,
        tool: req.mcpToolName || null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        category,
        message: normalizedError.message,
        code: normalizedError.code
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "internal_error",
          message: "Internal server error"
        });
      }
    }
  };

  const mcpGetHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    try {
      const session = sessionId ? sessions.touch(sessionId) : null;

      if (!session) {
        recordRemoteMcpRejection(metrics, "invalid_session");
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "Invalid or missing session ID"
        });
        return;
      }

      try {
        await session.transport.handleRequest(req, res);
      } catch (error) {
        throw ensureRemoteMcpError(error, "transport_stream_failed");
      }
    } catch (error) {
      const normalizedError = ensureRemoteMcpError(error, "remote_mcp_runtime_error");
      const category = classifyRemoteMcpError(normalizedError);
      metrics.recordRemoteMcpError({ category, code: normalizedError.code });
      logger.error({
        event: "remote_mcp_error",
        requestId: req.requestId || null,
        customerId: req.customer ? req.customer.customerId : null,
        method: req.method,
        path: req.path,
        tool: null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        category,
        message: normalizedError.message,
        code: normalizedError.code
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "internal_error",
          message: "Internal server error"
        });
      }
    }
  };

  const mcpDeleteHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    try {
      const session = sessionId ? sessions.touch(sessionId) : null;

      if (!session) {
        recordRemoteMcpRejection(metrics, "invalid_session");
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "Invalid or missing session ID"
        });
        return;
      }

      try {
        await session.transport.handleRequest(req, res);
      } catch (error) {
        throw ensureRemoteMcpError(error, "transport_stream_failed");
      }
      await sessions.deleteSession(sessionId, "client_disconnect");
    } catch (error) {
      const normalizedError = ensureRemoteMcpError(error, "remote_mcp_runtime_error");
      const category = classifyRemoteMcpError(normalizedError);
      metrics.recordRemoteMcpError({ category, code: normalizedError.code });
      logger.error({
        event: "remote_mcp_error",
        requestId: req.requestId || null,
        customerId: req.customer ? req.customer.customerId : null,
        method: req.method,
        path: req.path,
        tool: null,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        category,
        message: normalizedError.message,
        code: normalizedError.code
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "internal_error",
          message: "Internal server error"
        });
      }
    }
  };

  app.post("/mcp", mcpPostHandler);
  app.get("/mcp", mcpGetHandler);
  app.delete("/mcp", mcpDeleteHandler);

  return {
    app,
    runtime,
    logger,
    sessions,
    metrics,
    customerConfig
  };
}

async function startHttpServer(options = {}) {
  const remote = await createRemoteApp(options);
  const server = createHttpServer(remote.app);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(remote.runtime.port, remote.runtime.host, resolve);
  });

  const address = server.address();
  return {
    ...remote,
    server,
    address,
    async close() {
      await remote.sessions.closeAll();
      await feedbackStore.close();
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

export { createRemoteApp, startHttpServer };
