#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { projectPathsFrom } = require("../_lib/paths");

const PATHS = projectPathsFrom(__dirname);
const rootDir = PATHS.root;
const registryPath = path.join(PATHS.registryDir, "registry.json");
const buildRegistryScript = path.join(PATHS.toolsDir, "build-registry", "index.js");

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}

function ensureRegistryBuilt() {
  if (fs.existsSync(registryPath)) return;
  console.log("==> build registry");
  run(process.execPath, [buildRegistryScript], rootDir);
}

const checks = [
  {
    label: "text file boundaries",
    cwd: rootDir,
    command: process.execPath,
    args: [path.join(PATHS.toolsDir, "check-text", "index.js")]
  },
  {
    label: "root api smoke",
    cwd: rootDir,
    command: process.execPath,
    args: [path.join(PATHS.testsDir, "root-api.test.js")]
  },
  {
    label: "runtime lifecycle harness",
    cwd: PATHS.runtimeHarnessDir,
    command: process.execPath,
    args: [path.join(PATHS.runtimeHarnessDir, "runtime-lifecycle.test.js")]
  },
  {
    label: "component validation",
    cwd: rootDir,
    command: process.execPath,
    args: [path.join(PATHS.toolsDir, "validate", "index.js")]
  }
];

for (const check of checks) {
  if (check.label === "root api smoke") {
    ensureRegistryBuilt();
  }
  console.log(`==> ${check.label}`);
  run(check.command, check.args, check.cwd);
}

console.log("All root quality checks passed.");
