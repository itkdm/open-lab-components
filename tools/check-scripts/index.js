#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { projectPathsFrom } = require("../_lib/paths");
const { listDeclaredScripts } = require("../_lib/script-manifest");
const { ROOT_PACKAGE_FILE_GLOBS } = require("../_lib/publish-assets");

const PATHS = projectPathsFrom(__dirname);
const packageJsonPath = path.join(PATHS.root, "package.json");

function main() {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const expected = listDeclaredScripts();
  const actual = pkg.scripts || {};
  const failures = [];

  for (const [name, command] of Object.entries(expected)) {
    if (!(name in actual)) {
      failures.push(`missing script: ${name}`);
      continue;
    }
    if (actual[name] !== command) {
      failures.push(`script mismatch for ${name}: expected "${command}"`);
    }
  }

  for (const name of Object.keys(actual)) {
    if (!(name in expected)) {
      failures.push(`undeclared script in package.json: ${name}`);
    }
  }

  const actualFiles = pkg.files || [];
  for (const glob of ROOT_PACKAGE_FILE_GLOBS) {
    if (!actualFiles.includes(glob)) {
      failures.push(`missing package file glob: ${glob}`);
    }
  }

  for (const glob of actualFiles) {
    if (!ROOT_PACKAGE_FILE_GLOBS.includes(glob)) {
      failures.push(`undeclared package file glob in package.json: ${glob}`);
    }
  }

  if (failures.length) {
    console.error("Script manifest checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Script manifest checks passed.");
}

main();
