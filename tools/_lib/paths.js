const path = require("path");

function projectRootFrom(__dirnameValue) {
  // tools/<script>/index.js -> tools -> projectRoot
  return path.resolve(__dirnameValue, "..", "..");
}

function createProjectPaths(rootDir) {
  return {
    root: rootDir,
    assetsDir: path.join(rootDir, "assets"),
    componentsDir: path.join(rootDir, "components"),
    demoDir: path.join(rootDir, "demo"),
    docsDir: path.join(rootDir, "docs"),
    libDir: path.join(rootDir, "lib"),
    registryDir: path.join(rootDir, "registry"),
    siteDir: path.join(rootDir, "site"),
    siteDistDir: path.join(rootDir, "site", "dist"),
    testsDir: path.join(rootDir, "tests"),
    toolsDir: path.join(rootDir, "tools"),
    runtimeHarnessDir: path.join(rootDir, "tools", "runtime-harness"),
    mcpServerDir: path.join(rootDir, "mcp-server")
  };
}

function projectPathsFrom(__dirnameValue) {
  return createProjectPaths(projectRootFrom(__dirnameValue));
}

function toPosixRel(fromDir, absPath) {
  const rel = path.relative(fromDir, absPath);
  return rel.split(path.sep).join("/");
}

module.exports = {
  createProjectPaths,
  projectPathsFrom,
  projectRootFrom,
  toPosixRel
};


