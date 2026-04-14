#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { projectPathsFrom } = require("../_lib/paths");
const { listGeneratedRegistryFiles } = require("../_lib/registry");
const { listExpectedSiteDistEntries, SITE_REPUBLISHED_ROOT_DIRS } = require("../_lib/site");
const registryMetadata = require("../../lib/registry-metadata");
const { ensureFile, runNodeScript } = require("../_lib/checks");
const { SUPPORTED_LOCALES } = require("../../lib/i18n");

const PATHS = projectPathsFrom(__dirname);

function ensureGeneratedOutputs() {
  const registryPath = path.join(PATHS.registryDir, registryMetadata.DEFAULT_REGISTRY_FILE);
  const distNoJekyllPath = path.join(PATHS.siteDistDir, ".nojekyll");

  ensureFile("build registry", registryPath, () => {
    runNodeScript(path.join(PATHS.toolsDir, "build-registry", "index.js"), PATHS.root);
  });

  ensureFile("build site", distNoJekyllPath, () => {
    runNodeScript(path.join(PATHS.toolsDir, "build-site", "index.js"), PATHS.root);
  });
}

function assertExists(absPath, label) {
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing ${label}: ${absPath}`);
  }
}

function checkRegistryArtifacts() {
  for (const fileName of listGeneratedRegistryFiles(SUPPORTED_LOCALES)) {
    assertExists(path.join(PATHS.registryDir, fileName), `registry artifact ${fileName}`);
  }
}

function checkSiteArtifacts() {
  const expectedEntries = new Set(listExpectedSiteDistEntries(PATHS.siteDir));
  const actualEntries = new Set(fs.readdirSync(PATHS.siteDistDir));

  for (const entry of expectedEntries) {
    assertExists(path.join(PATHS.siteDistDir, entry), `site dist entry ${entry}`);
  }

  for (const entry of actualEntries) {
    if (!expectedEntries.has(entry)) {
      throw new Error(`Unexpected site dist entry: ${entry}`);
    }
  }

  assertExists(
    path.join(PATHS.siteDistDir, "registry", registryMetadata.DEFAULT_REGISTRY_FILE),
    "site dist registry copy"
  );
  for (const dir of SITE_REPUBLISHED_ROOT_DIRS) {
    assertExists(path.join(PATHS.siteDistDir, dir), `site dist ${dir} copy`);
  }
}

function main() {
  ensureGeneratedOutputs();
  checkRegistryArtifacts();
  checkSiteArtifacts();
  console.log("Generated artifact checks passed.");
}

main();
