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
  var modulePath = require.resolve("../registry/" + metadata.DEFAULT_VISUAL_REGISTRY_FILE);
  try {
    delete require.cache[modulePath];
    return require(modulePath);
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
  try {
    delete require.cache[require.resolve("../registry/" + metadata.DEFAULT_VISUAL_REGISTRY_FILE)];
  } catch (_error) {
    /* ignore */
  }
}

module.exports = {
  clearRegistryCache: clearRegistryCache,
  createVisualRegistryMissingError: createVisualRegistryMissingError,
  getRegistry: getRegistry
};
