const fs = require("fs");
const path = require("path");

const { normalizeCategoryNames } = require("../../lib/i18n");

function getRegistryPaths(rootDir) {
  const registryDir = path.join(rootDir, "registry");
  return {
    registryDir: registryDir,
    registryPath: path.join(registryDir, "registry.json"),
    categoryNamesPath: path.join(registryDir, "category-names.json")
  };
}

function loadCategoryNames(registryDir) {
  const categoryNamesPath = path.join(registryDir, "category-names.json");
  if (!fs.existsSync(categoryNamesPath)) return {};
  try {
    return normalizeCategoryNames(JSON.parse(fs.readFileSync(categoryNamesPath, "utf8")));
  } catch (_error) {
    return {};
  }
}

function readRegistryFile(registryPath) {
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

module.exports = {
  getRegistryPaths: getRegistryPaths,
  loadCategoryNames: loadCategoryNames,
  readRegistryFile: readRegistryFile
};
