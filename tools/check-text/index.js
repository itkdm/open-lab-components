#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { projectPathsFrom, toPosixRel } = require("../_lib/paths");
const { walkDir } = require("../_lib/walk");

const PATHS = projectPathsFrom(__dirname);
const ROOT = PATHS.root;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".d.ts",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".txt",
  ".yaml",
  ".yml"
]);
const ROOT_FILES = [
  ".editorconfig",
  ".gitattributes",
  "README.md",
  "index.d.ts",
  "index.js",
  "package.json"
];
const SCAN_DIRS = [
  PATHS.docsDir,
  PATHS.libDir,
  PATHS.mcpServerDir,
  PATHS.siteDir,
  PATHS.testsDir,
  PATHS.toolsDir
];
const IGNORED_SEGMENTS = new Set([
  ".git",
  "data",
  "dist",
  "node_modules",
  "registry"
]);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return ROOT_FILES.includes(path.basename(filePath));
}

function shouldSkipFile(filePath) {
  const rel = toPosixRel(ROOT, filePath);
  const segments = rel.split("/");
  return segments.some((segment) => IGNORED_SEGMENTS.has(segment));
}

function collectFiles() {
  const files = new Set();

  for (const name of ROOT_FILES) {
    const filePath = path.join(ROOT, name);
    if (fs.existsSync(filePath)) files.add(filePath);
  }

  for (const dir of SCAN_DIRS) {
    for (const filePath of walkDir(dir, { filterFile: isTextFile })) {
      if (!shouldSkipFile(filePath)) files.add(filePath);
    }
  }

  return Array.from(files).sort();
}

function checkFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const rel = toPosixRel(ROOT, filePath);
  const issues = [];

  if (buf.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)) {
    issues.push("contains UTF-8 BOM");
  }

  const text = buf.toString("utf8");
  if (text.includes("\r")) {
    issues.push("contains CRLF line endings");
  }

  return issues.length ? `${rel}: ${issues.join(", ")}` : null;
}

function main() {
  const failures = [];

  for (const filePath of collectFiles()) {
    const issue = checkFile(filePath);
    if (issue) failures.push(issue);
  }

  if (failures.length) {
    console.error("Text file boundary checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Text file boundary checks passed.");
}

main();
