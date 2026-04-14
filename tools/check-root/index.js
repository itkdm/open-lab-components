#!/usr/bin/env node
"use strict";

const path = require("node:path");
const { projectPathsFrom } = require("../_lib/paths");
const { ensureFile, logStep, runCommand, runNodeScript } = require("../_lib/checks");

const PATHS = projectPathsFrom(__dirname);
const rootDir = PATHS.root;
const registryPath = path.join(PATHS.registryDir, "registry.json");
const buildRegistryScript = path.join(PATHS.toolsDir, "build-registry", "index.js");

function ensureRegistryBuilt() {
  ensureFile("build registry", registryPath, () => {
    runNodeScript(buildRegistryScript, rootDir);
  });
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
  logStep(check.label);
  if (check.command === process.execPath && check.args.length === 1) {
    runNodeScript(check.args[0], check.cwd);
    continue;
  }
  runCommand(check.command, check.args, check.cwd);
}

console.log("All root quality checks passed.");
