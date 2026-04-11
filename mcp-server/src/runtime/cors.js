function normalizeOrigins(value = []) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];
}

function getCorsOrigin(origin, allowedOrigins = []) {
  const normalizedOrigins = normalizeOrigins(allowedOrigins);
  if (!origin || normalizedOrigins.length === 0) return null;
  if (normalizedOrigins.includes("*")) return "*";
  return normalizedOrigins.includes(origin) ? origin : null;
}

function applyCorsHeaders(req, res, allowedOrigins = []) {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : null;
  const matchedOrigin = getCorsOrigin(origin, allowedOrigins);
  if (!matchedOrigin) return false;

  res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, MCP-Session-Id, X-Request-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id, X-Request-Id, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining");
  return true;
}

function createCorsMiddleware(allowedOrigins = []) {
  const normalizedOrigins = normalizeOrigins(allowedOrigins);

  return function corsMiddleware(req, res, next) {
    if (!req.headers.origin || normalizedOrigins.length === 0) {
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      next();
      return;
    }

    const allowed = applyCorsHeaders(req, res, normalizedOrigins);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    if (!allowed) {
      next();
      return;
    }

    next();
  };
}

export { applyCorsHeaders, createCorsMiddleware, getCorsOrigin, normalizeOrigins };
