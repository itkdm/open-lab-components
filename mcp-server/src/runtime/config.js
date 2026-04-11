import fs from "node:fs";
import path from "node:path";
import { parseCustomerRecord } from "./customer-schema.js";

function resolveConfigPath(configPath) {
  if (!configPath) return path.resolve(process.cwd(), "config", "customers.json");
  return path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
}

function resolveFeedbackStorePath(storePath) {
  if (!storePath) return path.resolve(process.cwd(), "data", "feedback-store.json");
  return path.isAbsolute(storePath) ? storePath : path.resolve(process.cwd(), storePath);
}

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
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT || 3000);
  const logLevel = (env.LOG_LEVEL || "info").toLowerCase();
  const configPath = resolveConfigPath(env.CUSTOMERS_CONFIG_PATH);
  const allowedHosts = (env.ALLOWED_HOSTS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const trustProxy = String(env.TRUST_PROXY || "false").toLowerCase() === "true";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const adminBearerToken = env.ADMIN_BEARER_TOKEN ? String(env.ADMIN_BEARER_TOKEN) : null;
  const sessionTtlMs = Number(env.SESSION_TTL_MS || 30 * 60 * 1000);
  const maxSessionsPerCustomer = Number(env.MAX_SESSIONS_PER_CUSTOMER || 5);
  const metricsBearerToken = env.METRICS_BEARER_TOKEN ? String(env.METRICS_BEARER_TOKEN) : null;
  const feedbackStorePath = resolveFeedbackStorePath(env.FEEDBACK_STORE_PATH);
  const feedbackHalfLifeDays = Number(env.FEEDBACK_HALF_LIFE_DAYS || 30);

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 3000,
    configPath,
    logLevel,
    allowedHosts,
    allowedOrigins,
    trustProxy,
    adminBearerToken,
    sessionTtlMs: Number.isFinite(sessionTtlMs) && sessionTtlMs >= 60_000 ? Math.floor(sessionTtlMs) : 30 * 60 * 1000,
    maxSessionsPerCustomer:
      Number.isFinite(maxSessionsPerCustomer) && maxSessionsPerCustomer > 0
        ? Math.floor(maxSessionsPerCustomer)
        : 5,
    metricsBearerToken,
    feedbackStorePath,
    feedbackHalfLifeDays:
      Number.isFinite(feedbackHalfLifeDays) && feedbackHalfLifeDays > 0 ? feedbackHalfLifeDays : 30
  };
}

export { loadCustomers, loadRuntimeConfig, resolveConfigPath, resolveFeedbackStorePath };
