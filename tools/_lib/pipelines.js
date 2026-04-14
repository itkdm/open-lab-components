const path = require("node:path");

const registryMetadata = require("../../lib/registry-metadata");

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
    steps: [
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
    ]
  };
}

module.exports = {
  createGeneratedArtifactPipeline,
  createReleaseSmokePipeline,
  createRootQualityPipeline
};
