#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");

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
  console.log(`==> ${check.label}`);
  execFileSync(check.command, check.args, {
    cwd: check.cwd,
    stdio: "inherit"
  });
}

console.log("All root quality checks passed.");
