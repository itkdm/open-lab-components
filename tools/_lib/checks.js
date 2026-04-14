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

function runPrerequisites(prerequisites) {
  for (const item of prerequisites || []) {
    ensureFile(item.label, item.targetPath, () => {
      runNodeScript(item.scriptPath, item.cwd);
    });
  }
}

function runNodePipeline(steps, successMessage) {
  for (const step of steps || []) {
    logStep(step.label);
    runNodeScript(step.scriptPath, step.cwd);
  }
  if (successMessage) {
    console.log(successMessage);
  }
}

function assertIncludes(output, snippet, label) {
  if (!output.includes(snippet)) {
    throw new Error(`${label} is missing required output: ${snippet}`);
  }
}

function runShellPipeline(steps, successMessage) {
  for (const step of steps || []) {
    const output = runShellAndCapture(step.label, step.command, step.cwd);
    for (const snippet of step.requiredOutput || []) {
      assertIncludes(output, snippet, step.label);
    }
  }
  if (successMessage) {
    console.log(successMessage);
  }
}

module.exports = {
  assertIncludes,
  ensureFile,
  logStep,
  runNodePipeline,
  runPrerequisites,
  runAndCapture,
  runShellPipeline,
  runShellAndCapture,
  runCommand,
  runNodeScript
};
