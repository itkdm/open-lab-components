"use strict";

const ROOT_PACKAGE_DEPENDENCIES = {
  dependencies: {},
  devDependencies: {
    parse5: "^7.3.0"
  }
};

const MCP_PACKAGE_DEPENDENCIES = {
  dependencies: {
    "@modelcontextprotocol/sdk": "^1.27.1",
    pg: "^8.20.0",
    redis: "^5.11.0",
    zod: "^3.25.76"
  },
  devDependencies: {}
};

module.exports = {
  MCP_PACKAGE_DEPENDENCIES,
  ROOT_PACKAGE_DEPENDENCIES
};
