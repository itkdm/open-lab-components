import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.resolve(repoRoot, "mcp-server", "src", "cli.js");

async function withClient(run) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath],
    cwd: repoRoot,
    stderr: "pipe"
  });
  const client = new Client({
    name: "open-lab-components-mcp-test",
    version: "0.1.0"
  });

  try {
    await client.connect(transport);
    await run(client);
  } finally {
    await client.close();
  }
}

test("server boots over stdio and serves the v1 toolset", { concurrency: false }, async () => {
  await withClient(async (client) => {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();

    assert.deepEqual(names, [
      "get_categories",
      "get_component",
      "list_components",
      "search_components"
    ]);

    const result = await client.callTool({
      name: "get_component",
      arguments: { id: "missing.component.id" }
    });

    assert.equal(result.isError, true);
    assert.equal(result.content[0].type, "text");
    assert.match(result.content[0].text, /Component not found/);

    const listResult = await client.callTool({
      name: "list_components",
      arguments: { category: "physics/mechanics", limit: 3 }
    });
    const payload = JSON.parse(listResult.content[0].text);

    assert.ok(Array.isArray(payload.items));
    assert.ok(payload.items.length <= 3);
    for (const item of payload.items) {
      assert.equal(item.category, "physics/mechanics");
    }
  });
});
