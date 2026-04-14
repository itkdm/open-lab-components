import path from "node:path";
import { MCP_DEFAULTS, MCP_ENV_KEYS } from "./config-manifest.js";

function resolveRuntimeHome(env = process.env, cwd = process.cwd()) {
  const runtimeHome = env[MCP_ENV_KEYS.runtimeHome] ? String(env[MCP_ENV_KEYS.runtimeHome]).trim() : "";
  if (!runtimeHome) return cwd;
  return path.isAbsolute(runtimeHome) ? runtimeHome : path.resolve(cwd, runtimeHome);
}

function resolveRuntimePath(relativePath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  return path.resolve(runtimeHome, relativePath);
}

function resolveConfigPath(configPath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  if (!configPath) return path.resolve(runtimeHome, ...MCP_DEFAULTS.configRelativePath);
  return path.isAbsolute(configPath) ? configPath : path.resolve(runtimeHome, configPath);
}

function resolveFeedbackStorePath(storePath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  if (!storePath) return path.resolve(runtimeHome, ...MCP_DEFAULTS.feedbackStoreRelativePath);
  return path.isAbsolute(storePath) ? storePath : path.resolve(runtimeHome, storePath);
}

export {
  resolveConfigPath,
  resolveFeedbackStorePath,
  resolveRuntimeHome,
  resolveRuntimePath
};
