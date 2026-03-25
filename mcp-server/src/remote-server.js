import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "node:http";
import { createServer as createMcpServer } from "./server.js";
import { loadCustomers, loadRuntimeConfig } from "./config.js";
import { createCustomerStore, readBearerToken, toolAllowed } from "./auth.js";
import { createRateLimiter } from "./rate-limit.js";
import { createLogger } from "./logger.js";

function isInitializeRequest(body) {
  return !!body && typeof body === "object" && !Array.isArray(body) && body.method === "initialize";
}

function extractToolName(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (body.method !== "tools/call") return null;
  return body.params && typeof body.params.name === "string" ? body.params.name : null;
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
  const customerConfig = loadCustomers(runtime.configPath);
  const customerStore = createCustomerStore(customerConfig.customers);
  const limiter = createRateLimiter();
  const logger = createLogger(runtime.logLevel);
  const transports = new Map();

  const app = createMcpExpressApp({
    host: runtime.host,
    allowedHosts: runtime.allowedHosts.length ? runtime.allowedHosts : undefined
  });

  if (runtime.trustProxy && typeof app.set === "function") {
    app.set("trust proxy", true);
  }

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/mcp", (req, res, next) => {
    const startedAt = Date.now();
    const token = readBearerToken(req);
    const authResult = customerStore.authenticateToken(token);
    const sessionId = req.headers["mcp-session-id"];

    res.on("finish", () => {
      const contentLength = Number(res.getHeader("content-length")) || 0;
      logger.info({
        event: "remote_mcp_request",
        customerId: req.customer ? req.customer.customerId : null,
        method: req.method,
        path: req.path,
        tool: req.mcpToolName || null,
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
    req.mcpToolName = extractToolName(req.body);

    if (sessionId && transports.has(sessionId)) {
      const session = transports.get(sessionId);
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
      let session = sessionId ? transports.get(sessionId) : null;

      if (!session && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            transports.set(newSessionId, {
              customerId: req.customer.customerId,
              transport,
              server
            });
          }
        });
        const server = createMcpServer();

        transport.onclose = () => {
          const activeSessionId = transport.sessionId;
          if (activeSessionId) transports.delete(activeSessionId);
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
    const session = sessionId ? transports.get(sessionId) : null;

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
    const session = sessionId ? transports.get(sessionId) : null;

    if (!session) {
      unauthorized(res, 400, {
        error: "invalid_session",
        message: "Invalid or missing session ID"
      });
      return;
    }

    await session.transport.handleRequest(req, res);
    transports.delete(sessionId);
  };

  app.post("/mcp", mcpPostHandler);
  app.get("/mcp", mcpGetHandler);
  app.delete("/mcp", mcpDeleteHandler);

  return {
    app,
    runtime,
    logger,
    transports,
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
      for (const session of remote.transports.values()) {
        await session.transport.close();
      }
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

export { createRemoteApp, startHttpServer };
