import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

import { listDeclaredScripts } from "../src/runtime/script-manifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "package.json");

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
