import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCustomerRegistry } from "../src/runtime/customer-registry.js";
import { hashToken } from "../src/runtime/auth.js";

function createTempConfigPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "olc-customer-registry-")), "customers.json");
}

test("customer registry authenticates active tokens and rejects invalid ones", () => {
  const configPath = createTempConfigPath();
  const registry = createCustomerRegistry({
    configPath,
    customers: [
      {
        customerId: "tenant-a",
        label: "Tenant A",
        tokenHash: hashToken("tenant-a-token"),
        status: "active",
        rateLimit: { requestsPerMinute: 10, burst: 1 },
        allowedTools: ["get_categories"]
      }
    ]
  });

  const ok = registry.authenticateToken("tenant-a-token");
  assert.equal(ok.ok, true);
  assert.equal(ok.customer.customerId, "tenant-a");

  const invalid = registry.authenticateToken("wrong-token");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 401);
  assert.equal(invalid.code, "invalid_token");
});

test("customer registry create, rotate, update, and remove persist to disk", () => {
  const configPath = createTempConfigPath();
  const registry = createCustomerRegistry({ configPath, customers: [] });

  const created = registry.createCustomer({
    customerId: "tenant-b",
    label: "Tenant B",
    allowedTools: ["get_categories"],
    rateLimit: { requestsPerMinute: 15, burst: 2 }
  });
  assert.equal(created.customer.customerId, "tenant-b");
  assert.equal(typeof created.rawToken, "string");
  assert.equal(fs.existsSync(configPath), true);

  const rotated = registry.rotateCustomerToken("tenant-b");
  assert.equal(rotated.customer.customerId, "tenant-b");
  assert.notEqual(rotated.rawToken, created.rawToken);

  const updated = registry.updateCustomer("tenant-b", {
    status: "disabled",
    allowedTools: ["list_components"]
  });
  assert.equal(updated.status, "disabled");
  assert.deepEqual(updated.allowedTools, ["list_components"]);

  const reloaded = createCustomerRegistry({ configPath, customers: [] });
  reloaded.loadFromDisk();
  const snapshot = reloaded.snapshot();
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].customerId, "tenant-b");
  assert.equal(snapshot[0].status, "disabled");

  const removed = reloaded.removeCustomer("tenant-b");
  assert.equal(removed, true);
  assert.equal(reloaded.snapshot().length, 0);
});
