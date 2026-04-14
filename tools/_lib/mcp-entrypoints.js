"use strict";

const MCP_RUNTIME_ENTRY_SCRIPTS = {
  start: "node ./src/core/cli.js",
  "start:http": "node ./src/core/http-cli.js",
  "token:generate": "node ./src/core/token-cli.js"
};

const MCP_PACKAGE_BINS = {
  "open-lab-components-mcp": "./src/core/cli.js",
  "open-lab-components-mcp-http": "./src/core/http-cli.js"
};

const MCP_README_ENTRYPOINT_TOKENS = [
  "npm start",
  "npm run start:http",
  "npm run token:generate",
  "npm run mcp:start",
  "npm run mcp:start:http",
  "open-lab-components-mcp",
  "open-lab-components-mcp-http"
];

const MCP_DEPLOYMENT_ENTRYPOINT_TOKENS = [
  "npm run token:generate",
  "npm run start:http"
];

module.exports = {
  MCP_DEPLOYMENT_ENTRYPOINT_TOKENS,
  MCP_PACKAGE_BINS,
  MCP_README_ENTRYPOINT_TOKENS,
  MCP_RUNTIME_ENTRY_SCRIPTS
};
