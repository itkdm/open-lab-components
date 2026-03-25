import fs from "node:fs";
import path from "node:path";

function resolveConfigPath(configPath) {
  if (!configPath) return path.resolve(process.cwd(), "config", "customers.json");
  return path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
}

function normalizeAllowedTools(value) {
  if (!Array.isArray(value) || value.length === 0) return ["*"];
  return value.map((item) => String(item));
}

function normalizeRateLimit(value) {
  const requestsPerMinute = Number(value && value.requestsPerMinute);
  const burst = Number(value && value.burst);
  return {
    requestsPerMinute: Number.isFinite(requestsPerMinute) && requestsPerMinute > 0 ? Math.floor(requestsPerMinute) : 60,
    burst: Number.isFinite(burst) && burst >= 0 ? Math.floor(burst) : 0
  };
}

function loadCustomers(configPath) {
  const resolvedPath = resolveConfigPath(configPath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("customers config must be an array");

  return {
    path: resolvedPath,
    customers: parsed.map((customer) => ({
      customerId: String(customer.customerId),
      label: String(customer.label || customer.customerId),
      tokenHash: String(customer.tokenHash),
      status: String(customer.status || "active"),
      rateLimit: normalizeRateLimit(customer.rateLimit),
      allowedTools: normalizeAllowedTools(customer.allowedTools),
      expiresAt: customer.expiresAt ? String(customer.expiresAt) : null
    }))
  };
}

function loadRuntimeConfig(env = process.env) {
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT || 3000);
  const logLevel = (env.LOG_LEVEL || "info").toLowerCase();
  const configPath = resolveConfigPath(env.CUSTOMERS_CONFIG_PATH);
  const allowedHosts = (env.ALLOWED_HOSTS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const trustProxy = String(env.TRUST_PROXY || "false").toLowerCase() === "true";

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 3000,
    configPath,
    logLevel,
    allowedHosts,
    trustProxy
  };
}

export { loadCustomers, loadRuntimeConfig, resolveConfigPath };
