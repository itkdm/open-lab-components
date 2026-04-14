#!/usr/bin/env node
"use strict";

const { projectPathsFrom } = require("../_lib/paths");
const { runShellAndCapture } = require("../_lib/checks");

const PATHS = projectPathsFrom(__dirname);
const rootDir = PATHS.root;
const mcpDir = PATHS.mcpServerDir;

function assertIncludes(output, snippet, label) {
  if (!output.includes(snippet)) {
    throw new Error(`${label} is missing required output: ${snippet}`);
  }
}

function main() {
  const rootPack = runShellAndCapture("root package pack dry-run", "npm pack --dry-run", rootDir);
  assertIncludes(rootPack, "name: @itkdm/open-lab-components", "root package");
  assertIncludes(rootPack, "index.js", "root package");
  assertIncludes(rootPack, "index.d.ts", "root package");
  assertIncludes(rootPack, "registry/registry.json", "root package");

  const mcpPack = runShellAndCapture("mcp package pack dry-run", "npm pack --dry-run", mcpDir);
  assertIncludes(mcpPack, "name: @itkdm/open-lab-components-mcp", "mcp package");
  assertIncludes(mcpPack, "src/core/cli.js", "mcp package");
  assertIncludes(mcpPack, "src/core/http-cli.js", "mcp package");
  assertIncludes(mcpPack, "README.md", "mcp package");

  console.log("Release smoke checks passed.");
}

main();
