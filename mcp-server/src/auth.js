import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function createToken() {
  return randomBytes(24).toString("base64url");
}

function readBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function createCustomerStore(customers) {
  const byHash = new Map();
  for (const customer of customers) {
    byHash.set(customer.tokenHash, customer);
  }

  function authenticateToken(rawToken) {
    if (!rawToken) return { ok: false, status: 401, code: "missing_token", message: "Missing bearer token" };
    const tokenHash = hashToken(rawToken);
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

  return { authenticateToken };
}

function toolAllowed(customer, toolName) {
  if (!toolName) return true;
  if (!Array.isArray(customer.allowedTools) || customer.allowedTools.length === 0) return true;
  if (customer.allowedTools.includes("*")) return true;
  return customer.allowedTools.includes(toolName);
}

export { hashToken, createToken, readBearerToken, createCustomerStore, toolAllowed };
