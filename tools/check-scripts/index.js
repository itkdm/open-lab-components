#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { projectPathsFrom } = require("../_lib/paths");
const {
  ROOT_PACKAGE_METADATA,
  SHARED_PACKAGE_METADATA
} = require("../_lib/package-metadata");
const { listDeclaredScripts } = require("../_lib/script-manifest");
const { ROOT_PACKAGE_FILE_GLOBS } = require("../_lib/publish-assets");

const PATHS = projectPathsFrom(__dirname);
const packageJsonPath = path.join(PATHS.root, "package.json");

function collectMetadataFailures(prefix, actual, expected, failures) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual ? actual[key] : undefined;
    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) {
        failures.push(`missing package metadata array: ${prefix}${key}`);
        continue;
      }
      for (const item of expectedValue) {
        if (!actualValue.includes(item)) {
          failures.push(`missing package metadata array item for ${prefix}${key}: ${item}`);
        }
      }
      for (const item of actualValue) {
        if (!expectedValue.includes(item)) {
          failures.push(`undeclared package metadata array item for ${prefix}${key}: ${item}`);
        }
      }
      continue;
    }
    if (expectedValue && typeof expectedValue === "object" && !Array.isArray(expectedValue)) {
      if (!actualValue || typeof actualValue !== "object") {
        failures.push(`missing package metadata object: ${prefix}${key}`);
        continue;
      }
      collectMetadataFailures(`${prefix}${key}.`, actualValue, expectedValue, failures);
      continue;
    }
    if (actualValue !== expectedValue) {
      failures.push(`package metadata mismatch for ${prefix}${key}: expected "${expectedValue}"`);
    }
  }
}

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

  collectMetadataFailures("", pkg, SHARED_PACKAGE_METADATA, failures);
  collectMetadataFailures("", pkg, ROOT_PACKAGE_METADATA, failures);

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
