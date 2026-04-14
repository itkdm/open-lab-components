const fs = require("fs");
const path = require("path");

const { normalizeCategoryNames } = require("../../lib/i18n");
const registryMetadata = require("../../lib/registry-metadata");

const REGISTRY_SOURCE_FILES = new Set(registryMetadata.REGISTRY_SOURCE_FILES);

function getRegistryPaths(rootDir) {
  const registryDir = path.join(rootDir, "registry");
  return {
    registryDir: registryDir,
    registryPath: path.join(registryDir, registryMetadata.DEFAULT_REGISTRY_FILE),
    categoryNamesPath: path.join(registryDir, registryMetadata.CATEGORY_NAMES_FILE)
  };
}

function loadCategoryNames(registryDir) {
  const categoryNamesPath = path.join(registryDir, registryMetadata.CATEGORY_NAMES_FILE);
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

function listGeneratedRegistryFiles(locales) {
  return registryMetadata.listGeneratedRegistryFiles(locales);
}

function pruneGeneratedRegistryFiles(registryDir, locales) {
  const expected = new Set(listGeneratedRegistryFiles(locales));
  if (!fs.existsSync(registryDir)) return;

  for (const entry of fs.readdirSync(registryDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (REGISTRY_SOURCE_FILES.has(entry.name)) continue;
    if (expected.has(entry.name)) continue;
    fs.rmSync(path.join(registryDir, entry.name), { force: true });
  }
}

module.exports = {
  getRegistryPaths: getRegistryPaths,
  loadCategoryNames: loadCategoryNames,
  listGeneratedRegistryFiles: listGeneratedRegistryFiles,
  pruneGeneratedRegistryFiles: pruneGeneratedRegistryFiles,
  readRegistryFile: readRegistryFile,
  REGISTRY_SOURCE_FILES: REGISTRY_SOURCE_FILES
};
