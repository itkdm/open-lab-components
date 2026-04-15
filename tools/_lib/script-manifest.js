"use strict";

const { PREPUBLISH_SEQUENCE, RELEASE_CHECK_SEQUENCE } = require("./release-manifest");

const ROOT_SCRIPT_GROUPS = {
  build: {
    "build": "npm run build:registry && npm run build:site",
    "build:quality-report": "node tools/build-quality-report/index.js",
    "build:registry": "node tools/build-registry/index.js && node tools/build-quality-report/index.js",
    "build:site": "node tools/build-site/index.js"
  },
  check: {
    "check:docs": "node tools/check-docs/index.js",
    "check:generated": "node tools/check-generated/index.js",
    "check:registry": "node tools/check-registry/index.js",
    "check:release": "node tools/release-smoke/index.js",
    "check:root": "node tools/check-root/index.js",
    "check:scripts": "node tools/check-scripts/index.js",
    "check:text": "node tools/check-text/index.js"
  },
  mcp: {
    "mcp:check:docs": "npm --prefix mcp-server run check:docs",
    "mcp:check:scripts": "npm --prefix mcp-server run check:scripts",
    "mcp:start": "npm --prefix mcp-server start",
    "mcp:start:http": "npm --prefix mcp-server run start:http",
    "mcp:test": "npm --prefix mcp-server test",
    "mcp:test:remote": "npm --prefix mcp-server run test:remote"
  },
  release: {
    "pack:check": "npm pack --dry-run",
    "mcp:pack:check": "cd mcp-server && npm pack --dry-run",
    "release:check": RELEASE_CHECK_SEQUENCE.join(" && "),
    "release:pack": "npm run pack:check && npm run mcp:pack:check",
    "release:ready": "npm run release:check && npm run release:pack",
    "prepublishOnly": PREPUBLISH_SEQUENCE.join(" && ")
  },
  site: {
    "dev:site": "node tools/dev-site/index.js"
  },
  test: {
    "test": "npm run check:root && npm run mcp:test",
    "test:root": "node tests/root-api.test.js",
    "test:runtime": "npm --prefix tools/runtime-harness test",
    "validate": "node tools/validate/index.js"
  }
};

function listDeclaredScripts() {
  const ordered = {};
  for (const groupName of Object.keys(ROOT_SCRIPT_GROUPS)) {
    Object.assign(ordered, ROOT_SCRIPT_GROUPS[groupName]);
  }
  return ordered;
}

module.exports = {
  ROOT_SCRIPT_GROUPS,
  listDeclaredScripts
};
