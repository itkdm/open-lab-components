const MCP_ENV_KEYS = {
  adminBearerToken: "ADMIN_BEARER_TOKEN",
  allowedHosts: "ALLOWED_HOSTS",
  allowedOrigins: "ALLOWED_ORIGINS",
  configPath: "CUSTOMERS_CONFIG_PATH",
  feedbackHalfLifeDays: "FEEDBACK_HALF_LIFE_DAYS",
  feedbackStorePath: "FEEDBACK_STORE_PATH",
  host: "HOST",
  logLevel: "LOG_LEVEL",
  maxSessionsPerCustomer: "MAX_SESSIONS_PER_CUSTOMER",
  metricsBearerToken: "METRICS_BEARER_TOKEN",
  port: "PORT",
  runtimeHome: "MCP_RUNTIME_HOME",
  sessionTtlMs: "SESSION_TTL_MS",
  trustProxy: "TRUST_PROXY"
};

const MCP_DEFAULTS = {
  configRelativePath: ["config", "customers.json"],
  feedbackHalfLifeDays: 30,
  feedbackStoreRelativePath: ["data", "feedback-store.json"],
  host: "127.0.0.1",
  logLevel: "info",
  maxSessionsPerCustomer: 5,
  port: 3000,
  sessionTtlMs: 30 * 60 * 1000,
  trustProxy: false
};

export { MCP_DEFAULTS, MCP_ENV_KEYS };
