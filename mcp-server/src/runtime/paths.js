import path from "node:path";

function resolveRuntimeHome(env = process.env, cwd = process.cwd()) {
  const runtimeHome = env.MCP_RUNTIME_HOME ? String(env.MCP_RUNTIME_HOME).trim() : "";
  if (!runtimeHome) return cwd;
  return path.isAbsolute(runtimeHome) ? runtimeHome : path.resolve(cwd, runtimeHome);
}

function resolveRuntimePath(relativePath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  return path.resolve(runtimeHome, relativePath);
}

function resolveConfigPath(configPath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  if (!configPath) return path.resolve(runtimeHome, "config", "customers.json");
  return path.isAbsolute(configPath) ? configPath : path.resolve(runtimeHome, configPath);
}

function resolveFeedbackStorePath(storePath, options = {}) {
  const runtimeHome = resolveRuntimeHome(options.env, options.cwd);
  if (!storePath) return path.resolve(runtimeHome, "data", "feedback-store.json");
  return path.isAbsolute(storePath) ? storePath : path.resolve(runtimeHome, storePath);
}

export {
  resolveConfigPath,
  resolveFeedbackStorePath,
  resolveRuntimeHome,
  resolveRuntimePath
};
