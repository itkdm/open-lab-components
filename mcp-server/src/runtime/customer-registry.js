import fs from "node:fs";
import path from "node:path";
import { createToken, hashToken, secureEqual } from "./auth.js";
import { resolveConfigPath } from "./config.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAllowedTools(value) {
  if (!Array.isArray(value) || value.length === 0) return ["*"];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeRateLimit(value) {
  const requestsPerMinute = Number(value && value.requestsPerMinute);
  const burst = Number(value && value.burst);
  return {
    requestsPerMinute: Number.isFinite(requestsPerMinute) && requestsPerMinute > 0 ? Math.floor(requestsPerMinute) : 60,
    burst: Number.isFinite(burst) && burst >= 0 ? Math.floor(burst) : 0
  };
}

function normalizeCustomerRecord(customer) {
  return {
    customerId: normalizeText(customer.customerId),
    label: normalizeText(customer.label || customer.customerId),
    tokenHash: normalizeText(customer.tokenHash),
    status: normalizeText(customer.status || "active"),
    rateLimit: normalizeRateLimit(customer.rateLimit),
    allowedTools: normalizeAllowedTools(customer.allowedTools),
    expiresAt: customer.expiresAt ? String(customer.expiresAt) : null
  };
}

function serializeCustomerRecord(customer) {
  return {
    customerId: customer.customerId,
    label: customer.label,
    tokenHash: customer.tokenHash,
    status: customer.status,
    rateLimit: customer.rateLimit,
    allowedTools: customer.allowedTools,
    expiresAt: customer.expiresAt
  };
}

function createCustomerRegistry({ configPath, customers = [] } = {}) {
  const resolvedPath = resolveConfigPath(configPath);
  let records = customers.map(normalizeCustomerRecord);

  function registryError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function ensureFileDir() {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  function rebuildIndexes() {
    const byHash = new Map();
    const byId = new Map();
    for (const customer of records) {
      byId.set(customer.customerId, customer);
      byHash.set(customer.tokenHash, customer);
    }
    return { byHash, byId };
  }

  function loadFromDisk() {
    if (!fs.existsSync(resolvedPath)) return records;
    const raw = fs.readFileSync(resolvedPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Customer registry file must contain an array");
    }
    records = parsed.map(normalizeCustomerRecord);
    return records;
  }

  function saveToDisk() {
    persistRecords(records);
  }

  function persistRecords(nextRecords) {
    ensureFileDir();
    const tempPath = `${resolvedPath}.tmp`;
    const payload = JSON.stringify(nextRecords.map(serializeCustomerRecord), null, 2);
    try {
      fs.writeFileSync(tempPath, payload, "utf8");
      fs.renameSync(tempPath, resolvedPath);
      records = nextRecords;
    } catch (error) {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch {}
      throw error;
    }
  }

  function snapshot() {
    const { byId } = rebuildIndexes();
    return Array.from(byId.values()).map((customer) => ({
      customerId: customer.customerId,
      label: customer.label,
      status: customer.status,
      rateLimit: customer.rateLimit,
      allowedTools: customer.allowedTools,
      expiresAt: customer.expiresAt
    }));
  }

  function findCustomer(customerId) {
    const normalizedCustomerId = normalizeText(customerId);
    const { byId } = rebuildIndexes();
    return byId.get(normalizedCustomerId) || null;
  }

  function authenticateToken(rawToken) {
    if (!rawToken) return { ok: false, status: 401, code: "missing_token", message: "Missing bearer token" };
    const tokenHash = hashToken(rawToken);
    const { byHash } = rebuildIndexes();
    let customer = null;

    for (const [expectedHash, candidate] of byHash.entries()) {
      if (secureEqual(expectedHash, tokenHash)) {
        customer = candidate;
        break;
      }
    }

    if (!customer) return { ok: false, status: 401, code: "invalid_token", message: "Invalid bearer token" };
    if (customer.status !== "active") return { ok: false, status: 403, code: "inactive_customer", message: "Customer token is disabled" };
    if (customer.expiresAt && Date.now() > Date.parse(customer.expiresAt)) {
      return { ok: false, status: 403, code: "expired_token", message: "Customer token has expired" };
    }

    return { ok: true, customer, tokenHash };
  }

  function upsertCustomer(input = {}) {
    const customerId = normalizeText(input.customerId);
    if (!customerId) throw new Error("customerId is required");

    const existing = findCustomer(customerId);
    const nextRecord = normalizeCustomerRecord({
      customerId,
      label: input.label || existing?.label || customerId,
      tokenHash: input.tokenHash || existing?.tokenHash || hashToken(createToken()),
      status: input.status || existing?.status || "active",
      rateLimit: input.rateLimit || existing?.rateLimit,
      allowedTools: input.allowedTools || existing?.allowedTools,
      expiresAt: Object.prototype.hasOwnProperty.call(input, "expiresAt") ? input.expiresAt : existing?.expiresAt
    });

    if (existing) {
      persistRecords(records.map((customer) => (customer.customerId === customerId ? nextRecord : customer)));
    } else {
      persistRecords([...records, nextRecord]);
    }
    return nextRecord;
  }

  function createCustomer(input = {}) {
    const customerId = normalizeText(input.customerId);
    if (!customerId) throw registryError("invalid_customer", "customerId is required");
    if (findCustomer(customerId)) {
      throw registryError("customer_exists", `Customer already exists: ${customerId}`);
    }
    const rawToken = createToken();
    const tokenHash = hashToken(rawToken);
    const record = upsertCustomer({
      ...input,
      customerId,
      tokenHash
    });
    return { customer: record, rawToken };
  }

  function rotateCustomerToken(customerId) {
    const existing = findCustomer(customerId);
    if (!existing) throw registryError("customer_not_found", `Customer not found: ${customerId}`);
    const rawToken = createToken();
    const next = normalizeCustomerRecord({
      ...existing,
      tokenHash: hashToken(rawToken)
    });
    persistRecords(records.map((customer) => (customer.customerId === existing.customerId ? next : customer)));
    return { customer: next, rawToken };
  }

  function updateCustomer(customerId, patch = {}) {
    const existing = findCustomer(customerId);
    if (!existing) throw registryError("customer_not_found", `Customer not found: ${customerId}`);
    const next = normalizeCustomerRecord({
      ...existing,
      ...patch,
      customerId: existing.customerId,
      tokenHash: existing.tokenHash
    });
    persistRecords(records.map((customer) => (customer.customerId === existing.customerId ? next : customer)));
    return next;
  }

  function removeCustomer(customerId) {
    const existing = findCustomer(customerId);
    if (!existing) return false;
    persistRecords(records.filter((customer) => customer.customerId !== existing.customerId));
    return true;
  }

  function summary() {
    const list = snapshot();
    const activeCustomers = list.filter((customer) => customer.status === "active").length;
    return {
      totalCustomers: list.length,
      activeCustomers,
      disabledCustomers: list.filter((customer) => customer.status !== "active").length
    };
  }

  return {
    configPath: resolvedPath,
    loadFromDisk,
    saveToDisk,
    snapshot,
    summary,
    findCustomer,
    authenticateToken,
    upsertCustomer,
    createCustomer,
    rotateCustomerToken,
    updateCustomer,
    removeCustomer
  };
}

export { createCustomerRegistry };
