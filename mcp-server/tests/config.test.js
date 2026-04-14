import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadCustomers, loadRuntimeConfig } from "../src/runtime/config.js";
import { MCP_DEFAULTS, MCP_ENV_KEYS } from "../src/runtime/config-manifest.js";
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
  assert.equal(
    resolveConfigPath(undefined, { cwd: fakeCwd }),
    path.join(fakeCwd, ...MCP_DEFAULTS.configRelativePath)
  );
  assert.equal(
    resolveFeedbackStorePath(undefined, { cwd: fakeCwd }),
    path.join(fakeCwd, ...MCP_DEFAULTS.feedbackStoreRelativePath)
  );
});

test("runtime path helpers support MCP_RUNTIME_HOME overrides", () => {
  const fakeCwd = path.resolve("workspace", "repo");
  const env = { [MCP_ENV_KEYS.runtimeHome]: "./var/open-lab-mcp" };
  const expectedHome = path.join(fakeCwd, "var", "open-lab-mcp");

  assert.equal(resolveRuntimeHome(env, fakeCwd), expectedHome);
  assert.equal(
    resolveConfigPath(undefined, { env, cwd: fakeCwd }),
    path.join(expectedHome, ...MCP_DEFAULTS.configRelativePath)
  );
  assert.equal(
    resolveFeedbackStorePath(undefined, { env, cwd: fakeCwd }),
    path.join(expectedHome, ...MCP_DEFAULTS.feedbackStoreRelativePath)
  );
});

test("loadRuntimeConfig exposes resolved runtime paths without overriding explicit absolute paths", () => {
  const configPath = path.join(path.sep, "etc", "open-lab-mcp", "customers.json");
  const feedbackStorePath = path.join(path.sep, "var", "lib", "open-lab-mcp", "feedback-store.json");

  const runtime = loadRuntimeConfig({
    [MCP_ENV_KEYS.runtimeHome]: "/srv/open-lab-mcp",
    [MCP_ENV_KEYS.configPath]: configPath,
    [MCP_ENV_KEYS.feedbackStorePath]: feedbackStorePath
  });

  assert.equal(runtime.runtimeHome, "/srv/open-lab-mcp");
  assert.equal(runtime.configPath, configPath);
  assert.equal(runtime.feedbackStorePath, feedbackStorePath);
});

test("loadRuntimeConfig uses manifest defaults for unset or invalid values", () => {
  const runtime = loadRuntimeConfig({
    [MCP_ENV_KEYS.port]: "0",
    [MCP_ENV_KEYS.sessionTtlMs]: "10",
    [MCP_ENV_KEYS.maxSessionsPerCustomer]: "-1",
    [MCP_ENV_KEYS.feedbackHalfLifeDays]: "0"
  });

  assert.equal(runtime.host, MCP_DEFAULTS.host);
  assert.equal(runtime.port, MCP_DEFAULTS.port);
  assert.equal(runtime.logLevel, MCP_DEFAULTS.logLevel);
  assert.equal(runtime.sessionTtlMs, MCP_DEFAULTS.sessionTtlMs);
  assert.equal(runtime.maxSessionsPerCustomer, MCP_DEFAULTS.maxSessionsPerCustomer);
  assert.equal(runtime.feedbackHalfLifeDays, MCP_DEFAULTS.feedbackHalfLifeDays);
});
