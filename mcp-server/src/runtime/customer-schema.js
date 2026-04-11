const validCustomerStatuses = new Set(["active", "disabled"]);
const defaultRateLimit = {
  requestsPerMinute: 60,
  burst: 0
};

function createValidationError(message, errorFactory) {
  if (typeof errorFactory === "function") {
    return errorFactory(message);
  }
  return new Error(message);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function parseLabel(value, fallback, errorFactory) {
  if (value === undefined) return fallback;
  const label = normalizeText(value);
  if (!label) throw createValidationError("label must be a non-empty string", errorFactory);
  return label;
}

function parseTokenHash(value, fallback, errorFactory) {
  const tokenHash = normalizeText(value === undefined ? fallback : value);
  if (tokenHash.length < 32) {
    throw createValidationError("tokenHash must be a non-empty hash string", errorFactory);
  }
  return tokenHash;
}

function parseStatus(value, fallback, errorFactory) {
  if (value === undefined) return fallback;
  const status = normalizeText(value).toLowerCase();
  if (!validCustomerStatuses.has(status)) {
    throw createValidationError("status must be one of: active, disabled", errorFactory);
  }
  return status;
}

function parseAllowedTools(value, fallback, errorFactory) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError("allowedTools must be a non-empty array of tool names", errorFactory);
  }
  const allowedTools = value.map((item) => normalizeText(item));
  if (allowedTools.some((toolName) => !toolName)) {
    throw createValidationError("allowedTools must only contain non-empty tool names", errorFactory);
  }
  return allowedTools;
}

function parseRateLimit(value, fallback, errorFactory) {
  if (value === undefined) return fallback;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("rateLimit must be an object", errorFactory);
  }
  const base = fallback || defaultRateLimit;
  const requestsPerMinuteSource =
    Object.prototype.hasOwnProperty.call(value, "requestsPerMinute") ? value.requestsPerMinute : base.requestsPerMinute;
  const burstSource = Object.prototype.hasOwnProperty.call(value, "burst") ? value.burst : base.burst;
  const requestsPerMinute = Number(requestsPerMinuteSource);
  const burst = Number(burstSource);

  if (!Number.isInteger(requestsPerMinute) || requestsPerMinute <= 0) {
    throw createValidationError("rateLimit.requestsPerMinute must be a positive integer", errorFactory);
  }
  if (!Number.isInteger(burst) || burst < 0) {
    throw createValidationError("rateLimit.burst must be a non-negative integer", errorFactory);
  }

  return { requestsPerMinute, burst };
}

function parseExpiresAt(value, fallback, errorFactory) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  const expiresAt = String(value);
  if (Number.isNaN(Date.parse(expiresAt))) {
    throw createValidationError("expiresAt must be a valid datetime string", errorFactory);
  }
  return expiresAt;
}

function parseCustomerRecord(input = {}, { existing = null, errorFactory } = {}) {
  const customerId = normalizeText(
    Object.prototype.hasOwnProperty.call(input, "customerId") ? input.customerId : existing?.customerId
  );
  if (!customerId) throw createValidationError("customerId is required", errorFactory);

  const fallbackLabel = existing?.label || customerId;
  const fallbackStatus = existing?.status || "active";
  const fallbackRateLimit = existing?.rateLimit || defaultRateLimit;
  const fallbackAllowedTools = existing?.allowedTools || ["*"];
  const fallbackExpiresAt = existing?.expiresAt || null;

  return {
    customerId,
    label: parseLabel(input.label, fallbackLabel, errorFactory),
    tokenHash: parseTokenHash(input.tokenHash, existing?.tokenHash, errorFactory),
    status: parseStatus(input.status, fallbackStatus, errorFactory),
    rateLimit: parseRateLimit(input.rateLimit, fallbackRateLimit, errorFactory),
    allowedTools: parseAllowedTools(input.allowedTools, fallbackAllowedTools, errorFactory),
    expiresAt: parseExpiresAt(
      Object.prototype.hasOwnProperty.call(input, "expiresAt") ? input.expiresAt : undefined,
      fallbackExpiresAt,
      errorFactory
    )
  };
}

export { defaultRateLimit, normalizeText, parseCustomerRecord };
