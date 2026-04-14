"use strict";

const registryMetadata = require("../../lib/registry-metadata");

const RELEASE_SCRIPT_COMMANDS = {
  rootQuality: "npm run check:root",
  releaseSmoke: "npm run check:release",
  releaseCheck: "npm run release:check",
  releasePack: "npm run release:pack",
  releaseReady: "npm run release:ready",
  rootPackDryRun: "npm run pack:check",
  mcpPackDryRun: "npm run mcp:pack:check",
  rootPublish: "npm publish",
  mcpPublish: "npm --prefix mcp-server publish"
};

const RELEASE_CHECK_SEQUENCE = [
  "npm run validate",
  "npm run build:registry",
  "npm run mcp:test",
  "npm run build:site"
];

const PREPUBLISH_SEQUENCE = [
  "npm run build:registry",
  "npm run check:registry"
];

function createReleasePackContracts(paths) {
  return [
    {
      label: "root package pack dry-run",
      cwd: paths.root,
      command: "npm pack --dry-run",
      requiredOutput: [
        "name: @itkdm/open-lab-components",
        "index.js",
        "index.d.ts",
        "registry/" + registryMetadata.DEFAULT_REGISTRY_FILE
      ]
    },
    {
      label: "mcp package pack dry-run",
      cwd: paths.mcpServerDir,
      command: "npm pack --dry-run",
      requiredOutput: [
        "name: @itkdm/open-lab-components-mcp",
        "src/core/cli.js",
        "src/core/http-cli.js",
        "README.md"
      ]
    }
  ];
}

module.exports = {
  PREPUBLISH_SEQUENCE,
  RELEASE_CHECK_SEQUENCE,
  RELEASE_SCRIPT_COMMANDS,
  createReleasePackContracts
};
