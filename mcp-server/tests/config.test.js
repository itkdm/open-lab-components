import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadCustomers } from "../src/runtime/config.js";

function writeCustomersFixture(customers) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "olc-config-test-"));
  const filePath = path.join(dir, "customers.json");
  fs.writeFileSync(filePath, JSON.stringify(customers, null, 2), "utf8");
  return filePath;
}

test("loadCustomers normalizes valid customer records from disk", () => {
  const configPath = writeCustomersFixture([
    {
      customerId: "tenant-z",
      tokenHash: "0123456789abcdef0123456789abcdef",
      rateLimit: {
        requestsPerMinute: 12,
        burst: 3
      }
    }
  ]);

  const loaded = loadCustomers(configPath);
  assert.equal(loaded.path, configPath);
  assert.deepEqual(loaded.customers, [
    {
      customerId: "tenant-z",
      label: "tenant-z",
      tokenHash: "0123456789abcdef0123456789abcdef",
      status: "active",
      rateLimit: {
        requestsPerMinute: 12,
        burst: 3
      },
      allowedTools: ["*"],
      expiresAt: null
    }
  ]);
});

test("loadCustomers rejects the same invalid payloads as the admin registry path", () => {
  const configPath = writeCustomersFixture([
    {
      customerId: "tenant-invalid",
      tokenHash: "0123456789abcdef0123456789abcdef",
      status: "paused"
    }
  ]);
  assert.throws(() => loadCustomers(configPath), /status must be one of: active, disabled/);

  const invalidToolsPath = writeCustomersFixture([
    {
      customerId: "tenant-invalid-tools",
      tokenHash: "0123456789abcdef0123456789abcdef",
      allowedTools: [""]
    }
  ]);
  assert.throws(() => loadCustomers(invalidToolsPath), /allowedTools must only contain non-empty tool names/);
});
