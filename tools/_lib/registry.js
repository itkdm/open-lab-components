const fs = require("fs");
const path = require("path");

const { normalizeCategoryNames } = require("../../lib/i18n");

const REGISTRY_SOURCE_FILES = new Set([".gitkeep", "category-names.json"]);

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

function listGeneratedRegistryFiles(locales) {
  const files = new Set(["categories.json", "i18n-report.json", "registry.json", "tags.json"]);
  for (const locale of locales) {
    files.add(`categories.${locale}.json`);
    files.add(`registry.${locale}.json`);
    files.add(`tags.${locale}.json`);
  }
  return Array.from(files).sort();
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
