import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

import packageMetadata from "../../tools/_lib/package-metadata.js";
import { listDeclaredScripts } from "../src/runtime/script-manifest.js";
import { MCP_PACKAGE_FILE_GLOBS } from "../../tools/_lib/publish-assets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "package.json");
const { MCP_PACKAGE_METADATA, SHARED_PACKAGE_METADATA } = packageMetadata;

function collectMetadataFailures(prefix, actual, expected, failures) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual ? actual[key] : undefined;
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
  for (const glob of MCP_PACKAGE_FILE_GLOBS) {
    if (!actualFiles.includes(glob)) {
      failures.push(`missing package file glob: ${glob}`);
    }
  }

  for (const glob of actualFiles) {
    if (!MCP_PACKAGE_FILE_GLOBS.includes(glob)) {
      failures.push(`undeclared package file glob in package.json: ${glob}`);
    }
  }

  collectMetadataFailures("", pkg, SHARED_PACKAGE_METADATA, failures);
  collectMetadataFailures("", pkg, MCP_PACKAGE_METADATA, failures);

  if (failures.length) {
    console.error("MCP script manifest checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("MCP script manifest checks passed.");
}

main();
