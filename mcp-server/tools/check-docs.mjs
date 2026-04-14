import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MCP_DEPLOY_ENV_OVERRIDES,
  MCP_DEPLOY_VERIFY_COMMANDS,
  MCP_OPERATIONAL_ROUTES,
  MCP_RUNTIME_ENV_VARS
} from "../src/runtime/operations-manifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readmePath = path.join(__dirname, "..", "README.md");
const deploymentPath = path.join(__dirname, "..", "DEPLOYMENT.md");

function assertIncludes(text, values, label) {
  const missing = values.filter((value) => !text.includes(value));
  return missing.map((value) => `${label} missing: ${value}`);
}

function main() {
  const readme = fs.readFileSync(readmePath, "utf8");
  const deployment = fs.readFileSync(deploymentPath, "utf8");
  const failures = [
    ...assertIncludes(readme, MCP_RUNTIME_ENV_VARS, "README env var"),
    ...assertIncludes(readme, MCP_DEPLOY_VERIFY_COMMANDS, "README verification command"),
    ...assertIncludes(deployment, MCP_OPERATIONAL_ROUTES, "DEPLOYMENT route"),
    ...assertIncludes(deployment, MCP_DEPLOY_ENV_OVERRIDES, "DEPLOYMENT env override")
  ];

  if (failures.length) {
    console.error("MCP docs checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("MCP docs checks passed.");
}

main();
