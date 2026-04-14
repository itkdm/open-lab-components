import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadCustomers, loadRuntimeConfig } from "../src/runtime/config.js";
import {
  resolveConfigPath,
  resolveFeedbackStorePath,
  resolveRuntimeHome
} from "../src/runtime/paths.js";

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

test("runtime path helpers default to the current working directory", () => {
  const fakeCwd = path.resolve("srv", "open-lab-mcp");
  assert.equal(resolveRuntimeHome({}, fakeCwd), fakeCwd);
  assert.equal(resolveConfigPath(undefined, { cwd: fakeCwd }), path.join(fakeCwd, "config", "customers.json"));
  assert.equal(
    resolveFeedbackStorePath(undefined, { cwd: fakeCwd }),
    path.join(fakeCwd, "data", "feedback-store.json")
  );
});

test("runtime path helpers support MCP_RUNTIME_HOME overrides", () => {
  const fakeCwd = path.resolve("workspace", "repo");
  const env = { MCP_RUNTIME_HOME: "./var/open-lab-mcp" };
  const expectedHome = path.join(fakeCwd, "var", "open-lab-mcp");

  assert.equal(resolveRuntimeHome(env, fakeCwd), expectedHome);
  assert.equal(resolveConfigPath(undefined, { env, cwd: fakeCwd }), path.join(expectedHome, "config", "customers.json"));
  assert.equal(
    resolveFeedbackStorePath(undefined, { env, cwd: fakeCwd }),
    path.join(expectedHome, "data", "feedback-store.json")
  );
});

test("loadRuntimeConfig exposes resolved runtime paths without overriding explicit absolute paths", () => {
  const configPath = path.join(path.sep, "etc", "open-lab-mcp", "customers.json");
  const feedbackStorePath = path.join(path.sep, "var", "lib", "open-lab-mcp", "feedback-store.json");

  const runtime = loadRuntimeConfig({
    MCP_RUNTIME_HOME: "/srv/open-lab-mcp",
    CUSTOMERS_CONFIG_PATH: configPath,
    FEEDBACK_STORE_PATH: feedbackStorePath
  });

  assert.equal(runtime.runtimeHome, "/srv/open-lab-mcp");
  assert.equal(runtime.configPath, configPath);
  assert.equal(runtime.feedbackStorePath, feedbackStorePath);
});
