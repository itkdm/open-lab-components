const fs = require("fs");
const path = require("path");

const parse5 = require("parse5");

const { walkDir } = require("../_lib/walk");
const { extractManifest } = require("../_lib/manifest");
const { projectRootFrom } = require("../_lib/paths");

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isElementNode(n) {
  return n && n.nodeName && n.tagName;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function getAttr(node, name) {
  const a = (node.attrs || []).find((x) => x.name === name);
  return a ? a.value : null;
}

function hasClass(node, cls) {
  const v = getAttr(node, "class") || "";
  return v.split(/\s+/).includes(cls);
}

function collectStyleText(fragment) {
  const out = [];
  for (const n of fragment.childNodes || []) {
    if (isElementNode(n) && n.tagName === "style") {
      const t = (n.childNodes || []).map((x) => x.value || "").join("");
      out.push(t);
    }
  }
  return out.join("\n");
}

function checkForbidden(raw) {
  const errs = [];

  // Not a full HTML page
  if (/(<!doctype\b|<html\b|<head\b|<body\b)/i.test(raw)) {
    errs.push("Must be HTML fragment (no doctype/html/head/body).");
  }

  // No external resources
  if (/\b(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(raw)) {
    errs.push("External link detected in src/href.");
  }
  if (/@import\b/i.test(raw)) {
    errs.push("CSS @import is not allowed.");
  }
  if (/@font-face\b/i.test(raw)) {
    errs.push("CSS @font-face is not allowed.");
  }
  if (/\burl\(\s*["']?\s*(?:https?:)?\/\//i.test(raw)) {
    errs.push("External url(...) is not allowed.");
  }

  return errs;
}

function checkCssIsolation(styleText) {
  const errs = [];
  // Simple heuristic: forbid global selectors. (The spec requires scoping under component root.)
  if (/(^|[,{]\s*)(html|body|:root)\b/i.test(styleText)) {
    errs.push("Global selector detected in <style> (html/body/:root).");
  }
  if (/(^|[,{]\s*)\*\s*(?=[,{])/i.test(styleText)) {
    errs.push('Global selector "*" detected in <style>.');
  }
  return errs;
}

function isValidId(value) {
  // lower-case letters, digits, dot and dash; must start/end with alnum
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(value);
}

function isValidCategory(value) {
  // exactly two segments: subject/domain
  return /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(value);
}

function main() {
  const root = projectRootFrom(__dirname);
  const componentsDir = path.join(root, "components");

  const files = walkDir(componentsDir, { filterFile: (p) => p.toLowerCase().endsWith(".html") });
  const errors = [];
  const seenId = new Map();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");

    // manifest
    let manifest;
    try {
      manifest = extractManifest(raw, { filePath }).manifest;
    } catch (e) {
      errors.push({ filePath, message: e.message });
      continue;
    }

    if (manifest.schema !== "cmp-manifest/v1") {
      errors.push({ filePath, message: `manifest.schema must be "cmp-manifest/v1" (got "${manifest.schema}")` });
    }

    if (!manifest.id || typeof manifest.id !== "string") {
      errors.push({ filePath, message: "manifest.id missing or not string" });
    } else {
      if (!isValidId(manifest.id)) {
        errors.push({
          filePath,
          message: 'manifest.id must match ^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$'
        });
      }
      if (seenId.has(manifest.id)) {
        errors.push({
          filePath,
          message: `Duplicate manifest.id "${manifest.id}" (also in ${seenId.get(manifest.id)})`
        });
      } else {
        seenId.set(manifest.id, filePath);
      }
    }
    if (!isNonEmptyString(manifest.name)) {
      errors.push({ filePath, message: "manifest.name missing or not non-empty string" });
    }
    if (!isNonEmptyString(manifest.category)) {
      errors.push({ filePath, message: "manifest.category missing or not non-empty string" });
    } else if (!isValidCategory(manifest.category)) {
      errors.push({
        filePath,
        message: 'manifest.category must be "subject/domain" using lower-case letters, digits, and "-"'
      });
    }
    if (!isNonEmptyString(manifest.version)) {
      errors.push({ filePath, message: "manifest.version missing or not non-empty string" });
    } else if (!SEMVER_RE.test(manifest.version)) {
      errors.push({ filePath, message: `manifest.version must be valid SemVer (got "${manifest.version}")` });
    }

    // basic forbidden checks
    for (const msg of checkForbidden(raw)) errors.push({ filePath, message: msg });

    // parse + DOM contract checks
    const trimmed = raw.replace(/^\uFEFF/, "");
    const fragment = parse5.parseFragment(trimmed, { sourceCodeLocationInfo: false });

    const elementNodes = (fragment.childNodes || []).filter(isElementNode);
    const nonAux = elementNodes.filter((n) => n.tagName !== "style" && n.tagName !== "script");
    const cmpRoots = nonAux.filter((n) => hasClass(n, "cmp"));

    if (cmpRoots.length !== 1) {
      errors.push({
        filePath,
        message: `Expected exactly 1 component root element with class="cmp"; found ${cmpRoots.length}`
      });
    } else {
      const rootEl = cmpRoots[0];
      const dataId = getAttr(rootEl, "data-cmp-id");
      if (!dataId) errors.push({ filePath, message: 'Root must have data-cmp-id="..."' });
      if (manifest.id && dataId && manifest.id !== dataId) {
        errors.push({ filePath, message: `manifest.id !== data-cmp-id ("${manifest.id}" vs "${dataId}")` });
      }
      const role = getAttr(rootEl, "role");
      if (role !== "img") errors.push({ filePath, message: 'Root must have role="img"' });
      const aria = getAttr(rootEl, "aria-label");
      if (!aria) errors.push({ filePath, message: 'Root must have aria-label="组件名称"' });
    }

    // ensure only allowed top-level element siblings
    const illegalTop = nonAux.filter((n) => !hasClass(n, "cmp"));
    if (illegalTop.length > 0) {
      errors.push({
        filePath,
        message: `Illegal extra top-level elements (only root + optional <style>/<script> allowed): ${illegalTop
          .map((n) => `<${n.tagName}>`)
          .join(", ")}`
      });
    }

    // CSS isolation
    const styleText = collectStyleText(fragment);
    for (const msg of checkCssIsolation(styleText)) errors.push({ filePath, message: msg });
  }

  if (errors.length) {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      const rel = path.relative(root, err.filePath).split(path.sep).join("/");
      console.error(`- ${rel}: ${err.message}`);
    }
    process.exitCode = 1;
    return;
  }
}

main();

