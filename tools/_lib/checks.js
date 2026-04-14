const fs = require("node:fs");
const { execFileSync, execSync } = require("node:child_process");

function resolveCommand(command) {
  if (process.platform === "win32" && command === "npm") {
    return "npm.cmd";
  }
  return command;
}

function logStep(label) {
  console.log(`==> ${label}`);
}

function runCommand(command, args, cwd) {
  execFileSync(resolveCommand(command), args, {
    cwd,
    stdio: "inherit"
  });
}

function runNodeScript(scriptPath, cwd) {
  runCommand(process.execPath, [scriptPath], cwd);
}

function runAndCapture(label, command, args, cwd) {
  logStep(label);
  const output = execFileSync(resolveCommand(command), args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  process.stdout.write(output);
  return output;
}

function runShellAndCapture(label, command, cwd) {
  logStep(label);
  const output = execSync(`${command} 2>&1`, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  process.stdout.write(output);
  return output;
}

function ensureFile(label, filePath, build) {
  if (fs.existsSync(filePath)) return;
  logStep(label);
  build();
}

module.exports = {
  ensureFile,
  logStep,
  runAndCapture,
  runShellAndCapture,
  runCommand,
  runNodeScript
};
