const path = require("node:path");

const registryMetadata = require("../../lib/registry-metadata");
const { createReleasePackContracts } = require("./release-manifest");

function createRootQualityPipeline(paths) {
  return {
    successMessage: "All root quality checks passed.",
    prerequisites: [
      {
        label: "build registry",
        targetPath: path.join(paths.registryDir, registryMetadata.DEFAULT_REGISTRY_FILE),
        scriptPath: path.join(paths.toolsDir, "build-registry", "index.js"),
        cwd: paths.root
      }
    ],
    steps: [
      {
        label: "script manifest boundaries",
        scriptPath: path.join(paths.toolsDir, "check-scripts", "index.js"),
        cwd: paths.root
      },
      {
        label: "docs boundaries",
        scriptPath: path.join(paths.toolsDir, "check-docs", "index.js"),
        cwd: paths.root
      },
      {
        label: "text file boundaries",
        scriptPath: path.join(paths.toolsDir, "check-text", "index.js"),
        cwd: paths.root
      },
      {
        label: "root api smoke",
        scriptPath: path.join(paths.testsDir, "root-api.test.js"),
        cwd: paths.root
      },
      {
        label: "runtime lifecycle harness",
        scriptPath: path.join(paths.runtimeHarnessDir, "runtime-lifecycle.test.js"),
        cwd: paths.runtimeHarnessDir
      },
      {
        label: "component validation",
        scriptPath: path.join(paths.toolsDir, "validate", "index.js"),
        cwd: paths.root
      }
    ]
  };
}

function createGeneratedArtifactPipeline(paths) {
  return {
    prerequisites: [
      {
        label: "build registry",
        targetPath: path.join(paths.registryDir, registryMetadata.DEFAULT_REGISTRY_FILE),
        scriptPath: path.join(paths.toolsDir, "build-registry", "index.js"),
        cwd: paths.root
      },
      {
        label: "build site",
        targetPath: path.join(paths.siteDistDir, ".nojekyll"),
        scriptPath: path.join(paths.toolsDir, "build-site", "index.js"),
        cwd: paths.root
      }
    ]
  };
}

function createReleaseSmokePipeline(paths) {
  return {
    successMessage: "Release smoke checks passed.",
    steps: createReleasePackContracts(paths)
  };
}

module.exports = {
  createGeneratedArtifactPipeline,
  createReleaseSmokePipeline,
  createRootQualityPipeline
};
