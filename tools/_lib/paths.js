const path = require("path");

function projectRootFrom(__dirnameValue) {
  // tools/<script>/index.js -> tools -> projectRoot
  return path.resolve(__dirnameValue, "..", "..");
}

function toPosixRel(fromDir, absPath) {
  const rel = path.relative(fromDir, absPath);
  return rel.split(path.sep).join("/");
}

module.exports = { projectRootFrom, toPosixRel };


