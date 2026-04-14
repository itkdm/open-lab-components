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

function collectReleaseWorkflowFailures(releaseSpec) {
  const failures = [];
  const publishingPath = path.join(PATHS.root, "docs", "PUBLISHING.md");
  const commandsPath = path.join(
    PATHS.root,
    "docs",
    `RELEASE-COMMANDS-${releaseSpec.versions.rootVersion}.md`
  );
  const publishing = fs.readFileSync(publishingPath, "utf8");
  const commands = fs.readFileSync(commandsPath, "utf8");

  let previousPublishingIndex = -1;
  let previousCommandsIndex = -1;

  for (const step of releaseSpec.workflow) {
    const publishingIndex = publishing.indexOf(step.command, previousPublishingIndex + 1);
    if (publishingIndex === -1) {
      failures.push(`docs/PUBLISHING.md missing workflow step: ${step.command}`);
    } else {
      previousPublishingIndex = publishingIndex;
    }

    const commandsIndex = commands.indexOf(step.command, previousCommandsIndex + 1);
    if (commandsIndex === -1) {
      failures.push(
        `docs/RELEASE-COMMANDS-${releaseSpec.versions.rootVersion}.md missing workflow step: ${step.command}`
      );
    } else {
      previousCommandsIndex = commandsIndex;
    }
  }

  return failures;
}

function toLocalizedBaseName(fileName) {
  return fileName.replace(/(\.en|\.zh-CN)?\.md$/, "");
}

function collectLocalizedPairFailuresForDir(relativeDir, filterFn) {
  const targetDir = path.join(PATHS.root, relativeDir);
  const docFiles = fs
    .readdirSync(targetDir)
    .filter((fileName) => fileName.endsWith(".md"))
    .filter((fileName) => (typeof filterFn === "function" ? filterFn(fileName) : true));
  const failures = [];
  const bases = new Set(docFiles.map(toLocalizedBaseName));

  for (const base of Array.from(bases).sort()) {
    const enFile = `${base}.en.md`;
    const zhFile = `${base}.zh-CN.md`;
    if (!docFiles.includes(enFile)) {
      failures.push(`${relativeDir}/${enFile} missing localized pair`);
    }
    if (!docFiles.includes(zhFile)) {
      failures.push(`${relativeDir}/${zhFile} missing localized pair`);
    }
  }

  return failures;
}

function collectLocalizedDocPairFailures() {
  const failures = [];
  failures.push(...collectLocalizedPairFailuresForDir("docs"));
  failures.push(...collectLocalizedPairFailuresForDir(".", (fileName) => [
    "README.md",
    "README.en.md",
    "README.zh-CN.md",
    "CHANGELOG.md",
    "CHANGELOG.en.md",
    "CHANGELOG.zh-CN.md",
    "QUICK_START.md",
    "QUICK_START.en.md",
    "QUICK_START.zh-CN.md"
  ].includes(fileName)));
  failures.push(...collectLocalizedPairFailuresForDir("mcp-server", (fileName) => [
    "README.md",
    "README.en.md",
    "README.zh-CN.md",
    "DEPLOYMENT.md",
    "DEPLOYMENT.en.md",
    "DEPLOYMENT.zh-CN.md",
    "DEPLOYMENT-CHECKLIST.md",
    "DEPLOYMENT-CHECKLIST.en.md",
    "DEPLOYMENT-CHECKLIST.zh-CN.md",
    "OPERATIONS.md",
    "OPERATIONS.en.md",
    "OPERATIONS.zh-CN.md"
  ].includes(fileName)));
  failures.push(...collectLocalizedPairFailuresForDir("site", (fileName) => [
    "README.md",
    "README.en.md",
    "README.zh-CN.md"
  ].includes(fileName)));
  failures.push(...collectLocalizedPairFailuresForDir(".github", (fileName) => [
    "PULL_REQUEST_TEMPLATE.md",
    "PULL_REQUEST_TEMPLATE.en.md",
    "PULL_REQUEST_TEMPLATE.zh-CN.md"
  ].includes(fileName)));
  failures.push(...collectLocalizedPairFailuresForDir(".claude/commands", (fileName) => [
    "create-component.md",
    "create-component.en.md",
    "create-component.zh-CN.md"
  ].includes(fileName)));
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
  failures.push(...collectReleaseWorkflowFailures(releaseSpec));
  failures.push(...collectLocalizedDocPairFailures());

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
