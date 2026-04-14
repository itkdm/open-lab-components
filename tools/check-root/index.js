#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const registryPath = path.join(rootDir, "registry", "registry.json");
const buildRegistryScript = path.join(rootDir, "tools", "build-registry", "index.js");

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
    label: "root api smoke",
    cwd: rootDir,
    command: process.execPath,
    args: [path.join(rootDir, "tests", "root-api.test.js")]
  },
  {
    label: "runtime lifecycle harness",
    cwd: path.join(rootDir, "tools", "runtime-harness"),
    command: process.execPath,
    args: [path.join(rootDir, "tools", "runtime-harness", "runtime-lifecycle.test.js")]
  },
  {
    label: "component validation",
    cwd: rootDir,
    command: process.execPath,
    args: [path.join(rootDir, "tools", "validate", "index.js")]
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
