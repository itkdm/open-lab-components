import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpServer } from "../src/remote-server.js";

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

test("remote health endpoint responds", async () => {
  await withRemoteServer(async ({ port }) => {
    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
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
        headers: authHeaders("test-token")
      }
    });

    try {
      await rateLimitedClient.connect(rateLimitedTransport);
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
