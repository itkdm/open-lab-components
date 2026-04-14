#!/usr/bin/env node
"use strict";

const { execSync } = require("node:child_process");
const { projectPathsFrom } = require("../_lib/paths");

const PATHS = projectPathsFrom(__dirname);
const rootDir = PATHS.root;
const mcpDir = PATHS.mcpServerDir;

function runCheck(label, command, cwd) {
  console.log(`==> ${label}`);
  const output = execSync(command, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  process.stdout.write(output);
  return output;
}

function assertIncludes(output, snippet, label) {
  if (!output.includes(snippet)) {
    throw new Error(`${label} is missing required output: ${snippet}`);
  }
}

function main() {
  const rootPack = runCheck("root package pack dry-run", "npm pack --dry-run 2>&1", rootDir);
  assertIncludes(rootPack, "name: @itkdm/open-lab-components", "root package");
  assertIncludes(rootPack, "index.js", "root package");
  assertIncludes(rootPack, "index.d.ts", "root package");
  assertIncludes(rootPack, "registry/registry.json", "root package");

  const mcpPack = runCheck("mcp package pack dry-run", "npm pack --dry-run 2>&1", mcpDir);
  assertIncludes(mcpPack, "name: @itkdm/open-lab-components-mcp", "mcp package");
  assertIncludes(mcpPack, "src/core/cli.js", "mcp package");
  assertIncludes(mcpPack, "src/core/http-cli.js", "mcp package");
  assertIncludes(mcpPack, "README.md", "mcp package");

  console.log("Release smoke checks passed.");
}

main();
