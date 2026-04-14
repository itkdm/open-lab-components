#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { projectPathsFrom } = require("../_lib/paths");
const { ROOT_DOC_SURFACES } = require("../_lib/docs-manifest");
const { createReleaseDocSpec } = require("../_lib/release-docs");

const PATHS = projectPathsFrom(__dirname);

function collectSnippetFailures(surfaces) {
  const failures = [];
  for (const surface of surfaces) {
    const targetPath = path.join(PATHS.root, surface.relativePath);
    const text = fs.readFileSync(targetPath, "utf8");
    for (const snippet of surface.requiredSnippets) {
      if (!text.includes(snippet)) {
        failures.push(`${surface.relativePath} missing: ${snippet}`);
      }
    }
  }

  return failures;
}

function main() {
  const failures = collectSnippetFailures(ROOT_DOC_SURFACES);
  const releaseSpec = createReleaseDocSpec(PATHS);

  if (releaseSpec.versions.rootVersion !== releaseSpec.versions.mcpVersion) {
    failures.push(
      `package version mismatch: root=${releaseSpec.versions.rootVersion}, mcp=${releaseSpec.versions.mcpVersion}`
    );
  }

  failures.push(...collectSnippetFailures(releaseSpec.files));

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
