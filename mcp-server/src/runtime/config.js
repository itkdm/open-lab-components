import fs from "node:fs";
import { parseCustomerRecord } from "./customer-schema.js";
import { MCP_DEFAULTS, MCP_ENV_KEYS } from "./config-manifest.js";
import {
  resolveConfigPath,
  resolveFeedbackStorePath,
  resolveRuntimeHome
} from "./paths.js";

function loadCustomers(configPath) {
  const resolvedPath = resolveConfigPath(configPath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Customer registry file must contain an array");
  }

  return {
    path: resolvedPath,
    customers: parsed.map((customer) => parseCustomerRecord(customer))
  };
}

function loadRuntimeConfig(env = process.env) {
  const runtimeHome = resolveRuntimeHome(env);
  const host = env[MCP_ENV_KEYS.host] || MCP_DEFAULTS.host;
  const port = Number(env[MCP_ENV_KEYS.port] || MCP_DEFAULTS.port);
  const logLevel = (env[MCP_ENV_KEYS.logLevel] || MCP_DEFAULTS.logLevel).toLowerCase();
  const configPath = resolveConfigPath(env[MCP_ENV_KEYS.configPath], { env });
  const allowedHosts = (env[MCP_ENV_KEYS.allowedHosts] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const trustProxy = String(env[MCP_ENV_KEYS.trustProxy] || String(MCP_DEFAULTS.trustProxy)).toLowerCase() === "true";
  const allowedOrigins = (env[MCP_ENV_KEYS.allowedOrigins] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const adminBearerToken = env[MCP_ENV_KEYS.adminBearerToken] ? String(env[MCP_ENV_KEYS.adminBearerToken]) : null;
  const sessionTtlMs = Number(env[MCP_ENV_KEYS.sessionTtlMs] || MCP_DEFAULTS.sessionTtlMs);
  const maxSessionsPerCustomer = Number(env[MCP_ENV_KEYS.maxSessionsPerCustomer] || MCP_DEFAULTS.maxSessionsPerCustomer);
  const metricsBearerToken = env[MCP_ENV_KEYS.metricsBearerToken] ? String(env[MCP_ENV_KEYS.metricsBearerToken]) : null;
  const feedbackStorePath = resolveFeedbackStorePath(env[MCP_ENV_KEYS.feedbackStorePath], { env });
  const feedbackHalfLifeDays = Number(env[MCP_ENV_KEYS.feedbackHalfLifeDays] || MCP_DEFAULTS.feedbackHalfLifeDays);

  return {
    runtimeHome,
    host,
    port: Number.isFinite(port) && port > 0 ? port : MCP_DEFAULTS.port,
    configPath,
    logLevel,
    allowedHosts,
    allowedOrigins,
    trustProxy,
    adminBearerToken,
    sessionTtlMs:
      Number.isFinite(sessionTtlMs) && sessionTtlMs >= 60_000
        ? Math.floor(sessionTtlMs)
        : MCP_DEFAULTS.sessionTtlMs,
    maxSessionsPerCustomer:
      Number.isFinite(maxSessionsPerCustomer) && maxSessionsPerCustomer > 0
        ? Math.floor(maxSessionsPerCustomer)
        : MCP_DEFAULTS.maxSessionsPerCustomer,
    metricsBearerToken,
    feedbackStorePath,
    feedbackHalfLifeDays:
      Number.isFinite(feedbackHalfLifeDays) && feedbackHalfLifeDays > 0
        ? feedbackHalfLifeDays
        : MCP_DEFAULTS.feedbackHalfLifeDays
  };
}

export { loadCustomers, loadRuntimeConfig, resolveConfigPath, resolveFeedbackStorePath };
