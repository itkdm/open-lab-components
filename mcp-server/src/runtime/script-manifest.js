import { MCP_RUNTIME_ENTRY_SCRIPTS } from "./entrypoints.js";

export const MCP_SCRIPT_GROUPS = {
  runtime: MCP_RUNTIME_ENTRY_SCRIPTS,
  check: {
    "check:docs": "node ./tools/check-docs.mjs",
    "check:scripts": "node ./tools/check-scripts.mjs",
    "smoke:remote": "node ./deploy/smoke/verify-remote.mjs",
    "pack:check": "node ../tools/release-smoke/index.js"
  },
  test: {
    test: "node --test ./tests/catalog.test.js ./tests/config.test.js ./tests/customer-registry.test.js ./tests/feedback-backends.test.js ./tests/server.test.js ./tests/remote.test.js",
    "test:remote": "node --test ./tests/remote.test.js"
  }
};

export function listDeclaredScripts() {
  const ordered = {};
  for (const groupName of Object.keys(MCP_SCRIPT_GROUPS)) {
    Object.assign(ordered, MCP_SCRIPT_GROUPS[groupName]);
  }
  return ordered;
}
