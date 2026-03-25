import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tool-registry.js";

function createServer() {
  const server = new McpServer({
    name: "open-lab-components",
    version: "0.1.0"
  });
  registerTools(server);

  return server;
}

async function startStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return { server, transport };
}

export { createServer, startStdioServer };
