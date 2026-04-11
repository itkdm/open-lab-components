import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpServer } from "../src/core/remote-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "fixtures", "customers.test.json");

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function withRemoteServer(run) {
  const remote = await startHttpServer({
    runtime: {
      host: "127.0.0.1",
      port: 0,
      configPath: fixturePath,
      logLevel: "error",
      allowedHosts: [],
      trustProxy: false
    }
  });

  const port = remote.server.address().port;

  try {
    await run({ remote, port });
  } finally {
    await remote.close();
  }
}

async function withRemoteServerRuntime(runtime, run) {
  const remote = await startHttpServer({
    runtime: {
      host: "127.0.0.1",
      port: 0,
      configPath: fixturePath,
      logLevel: "error",
      allowedHosts: [],
      trustProxy: false,
      ...runtime
    }
  });

  const port = remote.server.address().port;

  try {
    await run({ remote, port });
  } finally {
    await remote.close();
  }
}

async function withRemoteServerOptions(options, run) {
  const remote = await startHttpServer({
    runtime: {
      host: "127.0.0.1",
      port: 0,
      configPath: fixturePath,
      logLevel: "error",
      allowedHosts: [],
      trustProxy: false,
      ...(options.runtime || {})
    },
    logger: options.logger
  });

  const port = remote.server.address().port;

  try {
    await run({ remote, port });
  } finally {
    await remote.close();
  }
}

test("remote health endpoint responds", async () => {
  await withRemoteServer(async ({ port }) => {
    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    const readiness = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(readiness.status, 200);
    const payload = await readiness.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.feedback.ok, true);
    assert.equal(payload.feedback.backend, "file");
  });
});

test("remote server emits cors headers for allowed origins", async () => {
  const origin = "https://console.example.com";
  const remote = await startHttpServer({
    runtime: {
      host: "127.0.0.1",
      port: 0,
      configPath: fixturePath,
      logLevel: "error",
      allowedHosts: [],
      allowedOrigins: [origin]
    }
  });

  const port = remote.server.address().port;

  try {
    const preflight = await fetch(`http://127.0.0.1:${port}/metrics`, {
      method: "OPTIONS",
      headers: { Origin: origin }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), origin);

    const metrics = await fetch(`http://127.0.0.1:${port}/metrics`, {
      headers: {
        Origin: origin
      }
    });
    assert.equal(metrics.headers.get("access-control-allow-origin"), origin);
  } finally {
    await remote.close();
  }
});

test("remote server supports authenticated MCP over Streamable HTTP", async () => {
  await withRemoteServer(async ({ port }) => {
    const client = new Client({ name: "remote-test-client", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: authHeaders("test-token")
      }
    });

    try {
      await client.connect(transport);
      const result = await client.callTool({ name: "get_categories", arguments: {} });
      assert.ok(!result.isError);
      assert.match(result.content[0].text, /categories/);
    } finally {
      await client.close();
    }
  });
});

test("remote auth rejects missing token", async () => {
  await withRemoteServer(async ({ port }) => {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "x", version: "1" } } })
    });
    assert.equal(response.status, 401);
  });
});

test("remote auth rejects disabled and expired tokens", async () => {
  await withRemoteServer(async ({ port }) => {
    const disabled = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders("disabled-token")
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "x", version: "1" } } })
    });
    assert.equal(disabled.status, 403);

    const expired = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders("expired-token")
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "x", version: "1" } } })
    });
    assert.equal(expired.status, 403);
  });
});

test("remote tool restrictions and rate limiting are enforced", async () => {
  await withRemoteServer(async ({ port }) => {
    const restrictedClient = new Client({ name: "remote-test-client", version: "0.1.0" });
    const restrictedTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: authHeaders("restricted-token")
      }
    });

    try {
      await restrictedClient.connect(restrictedTransport);
      const allowed = await restrictedClient.callTool({ name: "get_categories", arguments: {} });
      assert.ok(!allowed.isError);
      await assert.rejects(
        () => restrictedClient.callTool({ name: "list_components", arguments: { limit: 1 } }),
        /403|tool_not_allowed/i
      );
    } finally {
      await restrictedClient.close();
    }

    const rateLimitedClient = new Client({ name: "remote-test-client", version: "0.1.0" });
    const rateLimitedTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: authHeaders("restricted-token")
      }
    });

    try {
      await rateLimitedClient.connect(rateLimitedTransport);
      await rateLimitedClient.callTool({ name: "get_categories", arguments: {} });
      await rateLimitedClient.callTool({ name: "get_categories", arguments: {} });
      await rateLimitedClient.callTool({ name: "get_categories", arguments: {} });
      await rateLimitedClient.callTool({ name: "get_categories", arguments: {} });
      await assert.rejects(
        () => rateLimitedClient.callTool({ name: "get_categories", arguments: {} }),
        /429|rate limit/i
      );
    } finally {
      await rateLimitedClient.close();
    }
  });
});

test("remote metrics endpoint returns aggregated operational data", async () => {
  await withRemoteServer(async ({ port }) => {
    const client = new Client({ name: "remote-test-client", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: authHeaders("test-token")
      }
    });
    await client.connect(transport);
    await client.callTool({
      name: "submit_recommendation_feedback",
      arguments: {
        componentId: "phy.resistor.axial.basic",
        feedbackType: "clicked",
        subject: "physics",
        lessonGoal: "resistance lesson"
      }
    });
    await client.close();

    const metrics = await fetch(`http://127.0.0.1:${port}/metrics`);
    assert.equal(metrics.status, 200);
    const payload = await metrics.json();
    assert.equal(typeof payload.activeSessions, "number");
    assert.equal(typeof payload.uptimeSeconds, "number");
    assert.equal(typeof payload.requestsByRoute, "object");
    assert.equal(payload.feedbackEvents.clicked >= 1, true);
    assert.equal(payload.requestsByCustomer["vip-test"] >= 1, true);
    assert.equal(payload.feedbackBackend.kind, "file");
    assert.equal(payload.feedbackBackend.ok, true);
    assert.equal(typeof payload.feedbackStoreSummary.tenantCount, "number");
    assert.equal(typeof payload.feedbackStoreSummary.trackedComponents, "number");
    assert.equal(payload.feedbackStoreSummary.backend, "file");
    assert.equal(typeof payload.feedbackStore.tenantCount, "number");
    assert.equal(typeof payload.feedbackStore.trackedComponents, "number");
    assert.equal(payload.feedbackStore.backend, "file");
  });
});

test("remote admin and metrics endpoints enforce configured bearer tokens", async () => {
  await withRemoteServerRuntime(
    {
      adminBearerToken: "admin-secret",
      metricsBearerToken: "metrics-secret"
    },
    async ({ port }) => {
      const adminWithoutToken = await fetch(`http://127.0.0.1:${port}/admin/overview`);
      assert.equal(adminWithoutToken.status, 401);
      assert.equal(adminWithoutToken.headers.get("www-authenticate"), "Bearer");

      const adminWithWrongToken = await fetch(`http://127.0.0.1:${port}/admin/overview`, {
        headers: authHeaders("wrong-admin-token")
      });
      assert.equal(adminWithWrongToken.status, 401);

      const adminWithToken = await fetch(`http://127.0.0.1:${port}/admin/overview`, {
        headers: authHeaders("admin-secret")
      });
      assert.equal(adminWithToken.status, 200);

      const metricsWithoutToken = await fetch(`http://127.0.0.1:${port}/metrics`);
      assert.equal(metricsWithoutToken.status, 401);
      assert.equal(metricsWithoutToken.headers.get("www-authenticate"), "Bearer");

      const metricsWithMetricsToken = await fetch(`http://127.0.0.1:${port}/metrics`, {
        headers: authHeaders("metrics-secret")
      });
      assert.equal(metricsWithMetricsToken.status, 200);

      const metricsWithAdminToken = await fetch(`http://127.0.0.1:${port}/metrics`, {
        headers: authHeaders("admin-secret")
      });
      assert.equal(metricsWithAdminToken.status, 200);
    }
  );
});

test("admin customer lifecycle updates ready and metrics customer counts", async () => {
  await withRemoteServer(async ({ port }) => {
    const initialReady = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(initialReady.status, 200);
    const initialReadyPayload = await initialReady.json();
    assert.equal(initialReadyPayload.customers, 4);

    const createResponse = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: "new-school",
        label: "New School",
        allowedTools: ["get_categories"],
        rateLimit: {
          requestsPerMinute: 10,
          burst: 2
        }
      })
    });
    assert.equal(createResponse.status, 201);
    const createdPayload = await createResponse.json();
    assert.equal(createdPayload.customer.customerId, "new-school");
    assert.equal(typeof createdPayload.rawToken, "string");

    const customerList = await fetch(`http://127.0.0.1:${port}/admin/customers`);
    assert.equal(customerList.status, 200);
    const customerListPayload = await customerList.json();
    assert.equal(customerListPayload.customers.some((customer) => customer.customerId === "new-school"), true);

    const updatedReady = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(updatedReady.status, 200);
    const updatedReadyPayload = await updatedReady.json();
    assert.equal(updatedReadyPayload.customers, 5);

    const metrics = await fetch(`http://127.0.0.1:${port}/metrics`);
    assert.equal(metrics.status, 200);
    const metricsPayload = await metrics.json();
    assert.equal(metricsPayload.customerCount, 5);

    const overview = await fetch(`http://127.0.0.1:${port}/admin/overview`);
    assert.equal(overview.status, 200);
    const overviewPayload = await overview.json();
    assert.equal(overviewPayload.totalCustomers, 5);
    assert.equal(overviewPayload.activeCustomers, 4);

    const removeResponse = await fetch(`http://127.0.0.1:${port}/admin/customers/new-school`, {
      method: "DELETE"
    });
    assert.equal(removeResponse.status, 204);

    const finalReady = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(finalReady.status, 200);
    const finalReadyPayload = await finalReady.json();
    assert.equal(finalReadyPayload.customers, 4);
  });
});

test("admin customer writes reject invalid payloads and duplicate ids", async () => {
  await withRemoteServer(async ({ port }) => {
    const duplicate = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: "vip-test",
        label: "Duplicate VIP"
      })
    });
    assert.equal(duplicate.status, 409);
    assert.deepEqual(await duplicate.json(), {
      error: "customer_exists",
      category: "conflict",
      message: "Customer already exists: vip-test"
    });

    const invalid = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        label: "Missing ID"
      })
    });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), {
      error: "invalid_customer",
      category: "validation",
      message: "customerId is required"
    });

    const invalidStatus = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: "bad-status-school",
        status: "paused"
      })
    });
    assert.equal(invalidStatus.status, 400);
    assert.deepEqual(await invalidStatus.json(), {
      error: "invalid_customer",
      category: "validation",
      message: "status must be one of: active, disabled"
    });

    const invalidAllowedTools = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: "bad-tools-school",
        allowedTools: [""]
      })
    });
    assert.equal(invalidAllowedTools.status, 400);
    assert.deepEqual(await invalidAllowedTools.json(), {
      error: "invalid_customer",
      category: "validation",
      message: "allowedTools must only contain non-empty tool names"
    });

    const invalidRateLimit = await fetch(`http://127.0.0.1:${port}/admin/customers/vip-test`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rateLimit: {
          requestsPerMinute: 0
        }
      })
    });
    assert.equal(invalidRateLimit.status, 400);
    assert.deepEqual(await invalidRateLimit.json(), {
      error: "invalid_customer",
      category: "validation",
      message: "rateLimit.requestsPerMinute must be a positive integer"
    });
  });
});

test("admin customer update, rotate, and delete return not found for unknown ids", async () => {
  await withRemoteServer(async ({ port }) => {
    const update = await fetch(`http://127.0.0.1:${port}/admin/customers/missing-school`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "disabled"
      })
    });
    assert.equal(update.status, 404);
    assert.deepEqual(await update.json(), {
      error: "customer_not_found",
      category: "not_found",
      message: "Customer not found: missing-school"
    });

    const rotate = await fetch(`http://127.0.0.1:${port}/admin/customers/missing-school/rotate-token`, {
      method: "POST"
    });
    assert.equal(rotate.status, 404);
    assert.deepEqual(await rotate.json(), {
      error: "customer_not_found",
      category: "not_found",
      message: "Customer not found: missing-school"
    });

    const remove = await fetch(`http://127.0.0.1:${port}/admin/customers/missing-school`, {
      method: "DELETE"
    });
    assert.equal(remove.status, 404);
    assert.deepEqual(await remove.json(), {
      error: "customer_not_found",
      category: "not_found",
      message: "Customer not found"
    });
  });
});

test("admin customer writes return 500 when registry persistence fails", async () => {
  await withRemoteServer(async ({ port }) => {
    const originalRenameSync = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("simulated_persist_failure");
    };

    try {
      const create = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: "persist-fail-school",
          label: "Persist Fail School"
        })
      });
      assert.equal(create.status, 500);
      assert.deepEqual(await create.json(), {
        error: "customer_persist_failed",
        category: "infrastructure",
        message: "simulated_persist_failure"
      });

      const update = await fetch(`http://127.0.0.1:${port}/admin/customers/vip-test`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "disabled"
        })
      });
      assert.equal(update.status, 500);
      assert.deepEqual(await update.json(), {
        error: "customer_persist_failed",
        category: "infrastructure",
        message: "simulated_persist_failure"
      });

      const rotate = await fetch(`http://127.0.0.1:${port}/admin/customers/vip-test/rotate-token`, {
        method: "POST"
      });
      assert.equal(rotate.status, 500);
      assert.deepEqual(await rotate.json(), {
        error: "customer_persist_failed",
        category: "infrastructure",
        message: "simulated_persist_failure"
      });

      const remove = await fetch(`http://127.0.0.1:${port}/admin/customers/vip-test`, {
        method: "DELETE"
      });
      assert.equal(remove.status, 500);
      assert.deepEqual(await remove.json(), {
        error: "customer_persist_failed",
        category: "infrastructure",
        message: "simulated_persist_failure"
      });
    } finally {
      fs.renameSync = originalRenameSync;
    }
  });
});

test("admin customer write failures emit structured error logs", async () => {
  const entries = [];
  const logger = {
    info() {},
    debug() {},
    error(payload) {
      entries.push(payload);
    },
    sizeBucket() {
      return "none";
    }
  };

  await withRemoteServerOptions({ logger }, async ({ port }) => {
    const response = await fetch(`http://127.0.0.1:${port}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: "vip-test"
      })
    });
    assert.equal(response.status, 409);
  });

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    event: "admin_customer_write_failed",
    action: "create",
    route: "/admin/customers",
    method: "POST",
    customerId: null,
    status: 409,
    error: "customer_exists",
    category: "conflict",
    message: "Customer already exists: vip-test"
  });
});
