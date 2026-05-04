"use strict";

const ROOT_PACKAGE_FILE_GLOBS = [
  "index.js",
  "index.d.ts",
  "lib/**/*.js",
  "components/**/*.html",
  "registry/*.json",
  "visuals/**/*"
];

const MCP_PACKAGE_FILE_GLOBS = [
  "src/**/*",
  "config/**/*.json",
  "deploy/**/*",
  ".env.example",
  "README.md",
  "DEPLOYMENT.md",
  "DEPLOYMENT-CHECKLIST.md",
  "OPERATIONS.md"
];

const ROOT_TARBALL_REQUIRED_FILES = [
  "index.js",
  "index.d.ts",
  "registry/registry.json"
];

const MCP_TARBALL_REQUIRED_FILES = [
  "src/core/cli.js",
  "src/core/http-cli.js",
  "README.md"
];

module.exports = {
  MCP_PACKAGE_FILE_GLOBS,
  MCP_TARBALL_REQUIRED_FILES,
  ROOT_PACKAGE_FILE_GLOBS,
  ROOT_TARBALL_REQUIRED_FILES
};
