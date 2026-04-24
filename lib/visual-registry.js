"use strict";

var metadata = require("./visual-registry-metadata.js");
var _registry = null;

function createVisualRegistryMissingError() {
  var error = new Error(
    'Visual registry file is missing. Run "npm run build:registry" before using visual asset APIs.'
  );
  error.code = "VISUAL_REGISTRY_NOT_BUILT";
  return error;
}

function loadRegistry() {
  try {
    return require("../registry/" + metadata.DEFAULT_VISUAL_REGISTRY_FILE);
  } catch (error) {
    if (error && error.code === "MODULE_NOT_FOUND") {
      throw createVisualRegistryMissingError();
    }
    throw error;
  }
}

function getRegistry() {
  if (_registry) return _registry;
  _registry = loadRegistry();
  return _registry;
}

function clearRegistryCache() {
  _registry = null;
}

module.exports = {
  clearRegistryCache: clearRegistryCache,
  createVisualRegistryMissingError: createVisualRegistryMissingError,
  getRegistry: getRegistry
};
