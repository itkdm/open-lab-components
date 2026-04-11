#!/usr/bin/env node
import { startHttpServer } from "./remote-server.js";

startHttpServer()
  .then(({ runtime }) => {
    console.log(
      JSON.stringify({
        event: "remote_mcp_started",
        host: runtime.host,
        port: runtime.port,
        path: "/mcp"
      })
    );
  })
  .catch((error) => {
    console.error("[open-lab-components-mcp-http] Failed to start remote MCP server.");
    console.error(error);
    process.exit(1);
  });
