"use strict";

var DEFAULT_REGISTRY_FILE = "registry.json";
var CATEGORY_NAMES_FILE = "category-names.json";
var DEFAULT_CATEGORIES_FILE = "categories.json";
var DEFAULT_TAGS_FILE = "tags.json";
var I18N_REPORT_FILE = "i18n-report.json";
var REGISTRY_SOURCE_FILES = [".gitkeep", CATEGORY_NAMES_FILE];

function getLocalizedRegistryFile(locale) {
  return "registry." + locale + ".json";
}

function getLocalizedCategoriesFile(locale) {
  return "categories." + locale + ".json";
}

function getLocalizedTagsFile(locale) {
  return "tags." + locale + ".json";
}

function listGeneratedRegistryFiles(locales) {
  var files = [
    DEFAULT_CATEGORIES_FILE,
    DEFAULT_REGISTRY_FILE,
    DEFAULT_TAGS_FILE,
    I18N_REPORT_FILE
  ];

  for (var i = 0; i < locales.length; i += 1) {
    files.push(getLocalizedCategoriesFile(locales[i]));
    files.push(getLocalizedRegistryFile(locales[i]));
    files.push(getLocalizedTagsFile(locales[i]));
  }

  return Array.from(new Set(files)).sort();
}

module.exports = {
  CATEGORY_NAMES_FILE: CATEGORY_NAMES_FILE,
  DEFAULT_CATEGORIES_FILE: DEFAULT_CATEGORIES_FILE,
  DEFAULT_REGISTRY_FILE: DEFAULT_REGISTRY_FILE,
  DEFAULT_TAGS_FILE: DEFAULT_TAGS_FILE,
  I18N_REPORT_FILE: I18N_REPORT_FILE,
  REGISTRY_SOURCE_FILES: REGISTRY_SOURCE_FILES,
  getLocalizedCategoriesFile: getLocalizedCategoriesFile,
  getLocalizedRegistryFile: getLocalizedRegistryFile,
  getLocalizedTagsFile: getLocalizedTagsFile,
  listGeneratedRegistryFiles: listGeneratedRegistryFiles
};
