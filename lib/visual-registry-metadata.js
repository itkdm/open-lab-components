"use strict";

var DEFAULT_VISUAL_REGISTRY_FILE = "visuals.json";
var VISUAL_SUBJECTS_FILE = "visual-subjects.json";
var VISUAL_TAGS_FILE = "visual-tags.json";
var VISUAL_TAXONOMY_FILE = "visual-taxonomy.json";
var VISUAL_SOURCE_FILES = [".gitkeep"];

function getLocalizedVisualRegistryFile(locale) {
  return "visuals." + locale + ".json";
}

function getLocalizedVisualSubjectsFile(locale) {
  return "visual-subjects." + locale + ".json";
}

function getLocalizedVisualTagsFile(locale) {
  return "visual-tags." + locale + ".json";
}

function getLocalizedVisualTaxonomyFile(locale) {
  return "visual-taxonomy." + locale + ".json";
}

function listGeneratedVisualRegistryFiles(locales) {
  var files = [
    DEFAULT_VISUAL_REGISTRY_FILE,
    VISUAL_SUBJECTS_FILE,
    VISUAL_TAGS_FILE,
    VISUAL_TAXONOMY_FILE
  ];

  for (var i = 0; i < locales.length; i += 1) {
    files.push(getLocalizedVisualRegistryFile(locales[i]));
    files.push(getLocalizedVisualSubjectsFile(locales[i]));
    files.push(getLocalizedVisualTagsFile(locales[i]));
    files.push(getLocalizedVisualTaxonomyFile(locales[i]));
  }

  return Array.from(new Set(files)).sort();
}

module.exports = {
  DEFAULT_VISUAL_REGISTRY_FILE: DEFAULT_VISUAL_REGISTRY_FILE,
  VISUAL_SOURCE_FILES: VISUAL_SOURCE_FILES,
  VISUAL_SUBJECTS_FILE: VISUAL_SUBJECTS_FILE,
  VISUAL_TAGS_FILE: VISUAL_TAGS_FILE,
  VISUAL_TAXONOMY_FILE: VISUAL_TAXONOMY_FILE,
  getLocalizedVisualRegistryFile: getLocalizedVisualRegistryFile,
  getLocalizedVisualSubjectsFile: getLocalizedVisualSubjectsFile,
  getLocalizedVisualTagsFile: getLocalizedVisualTagsFile,
  getLocalizedVisualTaxonomyFile: getLocalizedVisualTaxonomyFile,
  listGeneratedVisualRegistryFiles: listGeneratedVisualRegistryFiles
};
