import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "node:http";
import { createServer as createMcpServer, initializeFeedbackRuntime } from "./server.js";
import { loadCustomers, loadRuntimeConfig } from "../runtime/config.js";
import { readBearerToken, toolAllowed } from "../runtime/auth.js";
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
  const logger = createLogger(runtime.logLevel);
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

  function requireAdmin(req, res) {
    if (runtime.adminBearerToken) {
      const token = readBearerToken(req);
      if (token !== runtime.adminBearerToken) {
        unauthorized(res, 401, { error: "missing_admin_token", message: "Missing or invalid admin token" }, {
          "WWW-Authenticate": "Bearer"
        });
        return false;
      }
    }
    return true;
  }

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/readyz", async (_req, res) => {
    const feedback = await feedbackStore.healthCheck();
    const ok = feedback.ok;

    res.status(ok ? 200 : 503).json({
      ok,
      customers: customerConfig.customers.length,
      sessionTtlMs: runtime.sessionTtlMs,
      maxSessionsPerCustomer: runtime.maxSessionsPerCustomer,
      feedback
    });
  });

  app.get("/metrics", async (req, res) => {
    if (runtime.metricsBearerToken || runtime.adminBearerToken) {
      const token = readBearerToken(req);
      const validTokens = [runtime.metricsBearerToken, runtime.adminBearerToken].filter(Boolean);
      if (!validTokens.includes(token)) {
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
        customerCount: customerConfig.customers.length,
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
    if (!requireAdmin(req, res)) return;
    const customerSummary = customerRegistry.summary();
    const feedbackSnapshot = feedbackStore.snapshot();
    const rateLimitSnapshot = limiter.snapshot(
      Object.fromEntries(
        customerRegistry.snapshot().map((customer) => [customer.customerId, customer.rateLimit])
      )
    );
    const metricsSnapshot = metrics.snapshot({
      customerCount: customerConfig.customers.length,
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
      requestsByCustomer: metricsSnapshot.requestsByCustomer,
      feedbackEvents: metricsSnapshot.feedbackEvents
    });
  });

  app.get("/admin/customers", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const metricsSnapshot = metrics.snapshot();
    const rateLimitSnapshot = limiter.snapshot(
      Object.fromEntries(
        customerRegistry.snapshot().map((customer) => [customer.customerId, customer.rateLimit])
      )
    );
    const customers = customerRegistry.snapshot().map((customer) => ({
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
    if (!requireAdmin(req, res)) return;
    try {
      const created = customerRegistry.createCustomer(req.body || {});
      res.status(201).json({
        customer: created.customer,
        rawToken: created.rawToken
      });
    } catch (error) {
      res.status(400).json({ error: "customer_create_failed", message: error.message || String(error) });
    }
  });

  app.patch("/admin/customers/:customerId", (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const updated = customerRegistry.updateCustomer(req.params.customerId, req.body || {});
      res.status(200).json({ customer: updated });
    } catch (error) {
      res.status(404).json({ error: "customer_not_found", message: error.message || String(error) });
    }
  });

  app.post("/admin/customers/:customerId/rotate-token", (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const rotated = customerRegistry.rotateCustomerToken(req.params.customerId);
      res.status(200).json({
        customer: rotated.customer,
        rawToken: rotated.rawToken
      });
    } catch (error) {
      res.status(404).json({ error: "customer_not_found", message: error.message || String(error) });
    }
  });

  app.delete("/admin/customers/:customerId", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const removed = customerRegistry.removeCustomer(req.params.customerId);
    if (!removed) {
      res.status(404).json({ error: "customer_not_found", message: "Customer not found" });
      return;
    }
    res.status(204).end();
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
        toolName: req.mcpToolName || null
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
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "No valid session ID provided"
        });
        return;
      }

      if (session.customerId !== req.customer.customerId) {
        unauthorized(res, 403, {
          error: "session_customer_mismatch",
          message: "Session does not belong to the authenticated customer"
        });
        return;
      }
    }

    if (req.method === "POST" && req.mcpToolName) {
      if (!toolAllowed(req.customer, req.mcpToolName)) {
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
      await sessions.cleanupExpiredSessions();
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
              throw new Error("Session limit exceeded for customer");
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
        const server = createMcpServer();

        transport.onclose = () => {
          const activeSessionId = transport.sessionId;
          if (activeSessionId) {
            sessions.deleteSession(activeSessionId, "transport_closed").catch(() => {});
          }
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!session) {
        unauthorized(res, 400, {
          error: "invalid_session",
          message: "No valid session ID provided"
        });
        return;
      }

      await session.transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error({
        event: "remote_mcp_error",
        message: error && error.message ? error.message : String(error)
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
    const session = sessionId ? sessions.touch(sessionId) : null;

    if (!session) {
      unauthorized(res, 400, {
        error: "invalid_session",
        message: "Invalid or missing session ID"
      });
      return;
    }

    await session.transport.handleRequest(req, res);
  };

  const mcpDeleteHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    const session = sessionId ? sessions.touch(sessionId) : null;

    if (!session) {
      unauthorized(res, 400, {
        error: "invalid_session",
        message: "Invalid or missing session ID"
      });
      return;
    }

    await session.transport.handleRequest(req, res);
    await sessions.deleteSession(sessionId, "client_disconnect");
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
