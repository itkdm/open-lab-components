#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { projectPathsFrom } = require("../_lib/paths");
const { ROOT_DOC_SURFACES } = require("../_lib/docs-manifest");

const PATHS = projectPathsFrom(__dirname);

function main() {
  const failures = [];

  for (const surface of ROOT_DOC_SURFACES) {
    const targetPath = path.join(PATHS.root, surface.relativePath);
    const text = fs.readFileSync(targetPath, "utf8");
    for (const snippet of surface.requiredSnippets) {
      if (!text.includes(snippet)) {
        failures.push(`${surface.relativePath} missing: ${snippet}`);
      }
    }
  }

  if (failures.length) {
    console.error("Root docs checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Root docs checks passed.");
}

main();
