"use strict";

var metadata = require("./registry-metadata.js");
var _registry = null;

function createRegistryMissingError() {
  var error = new Error(
    'Registry file is missing. Run "npm run build:registry" before using the root package APIs.'
  );
  error.code = "REGISTRY_NOT_BUILT";
  return error;
}

function loadRegistry() {
  try {
    return require("../registry/" + metadata.DEFAULT_REGISTRY_FILE);
  } catch (error) {
    if (error && error.code === "MODULE_NOT_FOUND") {
      throw createRegistryMissingError();
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
  createRegistryMissingError: createRegistryMissingError,
  getRegistry: getRegistry
};
