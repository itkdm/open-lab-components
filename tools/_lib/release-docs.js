"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createReleaseWorkflow } = require("./release-workflow");
const {
  PREPUBLISH_SEQUENCE,
  RELEASE_CHECK_SEQUENCE,
  RELEASE_SCRIPT_COMMANDS
} = require("./release-manifest");
const {
  MCP_PACKAGE_FILE_GLOBS,
  MCP_TARBALL_REQUIRED_FILES,
  ROOT_PACKAGE_FILE_GLOBS,
  ROOT_TARBALL_REQUIRED_FILES
} = require("./publish-assets");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readReleaseVersions(paths) {
  const rootPackage = readJson(path.join(paths.root, "package.json"));
  const mcpPackage = readJson(path.join(paths.mcpServerDir, "package.json"));
  return {
    rootVersion: rootPackage.version,
    mcpVersion: mcpPackage.version
  };
}

function createReleaseDocSpec(paths) {
  const versions = readReleaseVersions(paths);
  const version = versions.rootVersion;
  const tag = `v${version}`;

  return {
    versions,
    workflow: createReleaseWorkflow(version),
    files: [
      {
        relativePath: `docs/GITHUB-RELEASE-${version}.md`,
        requiredSnippets: [tag, version, RELEASE_SCRIPT_COMMANDS.releaseReady, ...RELEASE_CHECK_SEQUENCE]
      },
      {
        relativePath: `docs/ANNOUNCEMENT-${version}.zh-CN.md`,
        requiredSnippets: [version, RELEASE_SCRIPT_COMMANDS.releaseReady]
      },
      {
        relativePath: `docs/RELEASE-CHECKLIST-${version}.md`,
        requiredSnippets: [version, RELEASE_SCRIPT_COMMANDS.releaseReady, tag, ...RELEASE_CHECK_SEQUENCE]
      },
      {
        relativePath: `docs/RELEASE-COMMANDS-${version}.md`,
        requiredSnippets: [version, RELEASE_SCRIPT_COMMANDS.releaseReady, `git tag ${tag}`]
      },
      {
        relativePath: "docs/PUBLISHING.md",
        requiredSnippets: [
          `docs/GITHUB-RELEASE-${version}.md`,
          `docs/ANNOUNCEMENT-${version}.zh-CN.md`,
          `docs/RELEASE-CHECKLIST-${version}.md`,
          `docs/RELEASE-COMMANDS-${version}.md`,
          RELEASE_SCRIPT_COMMANDS.rootQuality,
          RELEASE_SCRIPT_COMMANDS.releaseSmoke,
          RELEASE_SCRIPT_COMMANDS.releaseCheck,
          RELEASE_SCRIPT_COMMANDS.releasePack,
          ...PREPUBLISH_SEQUENCE,
          ...ROOT_PACKAGE_FILE_GLOBS,
          ...MCP_PACKAGE_FILE_GLOBS,
          `git tag ${tag}`
        ]
      },
      {
        relativePath: "docs/RELEASE-SMOKE.md",
        requiredSnippets: [
          ...ROOT_TARBALL_REQUIRED_FILES,
          ...MCP_TARBALL_REQUIRED_FILES
        ]
      }
    ]
  };
}

module.exports = {
  createReleaseDocSpec,
  readReleaseVersions
};
