#!/usr/bin/env node
import { startStdioServer } from "./server.js";

startStdioServer().catch((error) => {
  console.error("[open-lab-components-mcp] Failed to start MCP server.");
  console.error(error);
  process.exit(1);
});
