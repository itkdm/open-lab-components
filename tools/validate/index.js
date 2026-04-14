const fs = require("fs");
const path = require("path");

const parse5 = require("parse5");

const { walkDir } = require("../_lib/walk");
const { extractManifest } = require("../_lib/manifest");
const { projectRootFrom, toPosixRel } = require("../_lib/paths");
const { getRegistryPaths, loadCategoryNames } = require("../_lib/registry");
const {
  BILINGUAL_SAMPLE_IDS,
  DEFAULT_LOCALE,
  LEGACY_SCHEMA,
  LOCALIZED_SCHEMA,
  isNonEmptyString,
  normalizeLocales
} = require("../../lib/i18n");

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isElementNode(n) {
  return n && n.nodeName && n.tagName;
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
  if (/(<!doctype\b|<html\b|<head\b|<body\b)/i.test(raw)) errs.push("Must be HTML fragment (no doctype/html/head/body).");
  if (/\b(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(raw)) errs.push("External link detected in src/href.");
  if (/@import\b/i.test(raw)) errs.push("CSS @import is not allowed.");
  if (/@font-face\b/i.test(raw)) errs.push("CSS @font-face is not allowed.");
  if (/\burl\(\s*["']?\s*(?:https?:)?\/\//i.test(raw)) errs.push("External url(...) is not allowed.");
  return errs;
}

function checkCssIsolation(styleText) {
  const errs = [];
  if (/(^|[,{]\s*)(html|body|:root)\b/i.test(styleText)) errs.push("Global selector detected in <style> (html/body/:root).");
  if (/(^|[,{]\s*)\*\s*(?=[,{])/i.test(styleText)) errs.push('Global selector "*" detected in <style>.');
  return errs;
}

function isValidId(value) {
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(value);
}

function isValidCategory(value) {
  return /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(value);
}

function validateEvents(events) {
  const errs = [];
  if (events === undefined) return errs;
  if (!Array.isArray(events)) {
    errs.push("manifest.events must be an array when provided");
    return errs;
  }
  for (let i = 0; i < events.length; i += 1) {
    const evt = events[i];
    if (!evt || typeof evt !== "object" || Array.isArray(evt)) {
      errs.push(`manifest.events[${i}] must be an object`);
      continue;
    }
    if (!isNonEmptyString(evt.name)) errs.push(`manifest.events[${i}].name missing or not non-empty string`);
    if (!isNonEmptyString(evt.type)) errs.push(`manifest.events[${i}].type missing or not non-empty string`);
    if (!evt.values || typeof evt.values !== "object" || Array.isArray(evt.values)) {
      errs.push(`manifest.events[${i}].values must be an object`);
    }
  }
  return errs;
}

function validateLocaleShapes(manifest, locales, categoryNames, filePath, errors, warnings) {
  if (!locales["zh-CN"] || !isNonEmptyString(locales["zh-CN"].name)) {
    errors.push({ filePath, message: "manifest.locales.zh-CN.name missing or empty" });
  }
  if (!locales["zh-CN"] || !isNonEmptyString(locales["zh-CN"].ariaLabel)) {
    errors.push({ filePath, message: "manifest.locales.zh-CN.ariaLabel missing or empty" });
  }

  for (const [locale, entry] of Object.entries(locales)) {
    if (!isNonEmptyString(entry.name)) {
      errors.push({ filePath, message: `manifest.locales.${locale}.name missing or empty` });
    }
    if (!isNonEmptyString(entry.ariaLabel)) {
      errors.push({ filePath, message: `manifest.locales.${locale}.ariaLabel missing or empty` });
    }
    if (entry.tags && !Array.isArray(entry.tags)) {
      errors.push({ filePath, message: `manifest.locales.${locale}.tags must be an array` });
    }

    const propTexts = entry.props && typeof entry.props === "object" ? entry.props : {};
    const propKeys = new Set((Array.isArray(manifest.props) ? manifest.props : []).map((prop) => prop.key));
    for (const propKey of Object.keys(propTexts)) {
      if (!propKeys.has(propKey)) {
        errors.push({ filePath, message: `manifest.locales.${locale}.props contains unknown key "${propKey}"` });
      }
    }

    const eventTexts = entry.events && typeof entry.events === "object" ? entry.events : {};
    const eventNames = new Set((Array.isArray(manifest.events) ? manifest.events : []).map((evt) => evt.name));
    for (const eventName of Object.keys(eventTexts)) {
      if (!eventNames.has(eventName)) {
        errors.push({ filePath, message: `manifest.locales.${locale}.events contains unknown event "${eventName}"` });
      }
    }
  }

  if (!categoryNames[manifest.category]) {
    errors.push({ filePath, message: `category locale names missing for "${manifest.category}" in registry/category-names.json` });
  }

  if (BILINGUAL_SAMPLE_IDS.includes(manifest.id) && (!locales.en || !isNonEmptyString(locales.en.name) || !isNonEmptyString(locales.en.ariaLabel))) {
    errors.push({ filePath, message: "sample component must provide English locale with name and ariaLabel" });
  } else if (!locales.en || !isNonEmptyString(locales.en.name)) {
    warnings.push({ filePath, message: "English locale missing; falling back to zh-CN" });
  }

  if (manifest.schema === LEGACY_SCHEMA) {
    warnings.push({ filePath, message: "legacy cmp-manifest/v1 detected; migrate to cmp-manifest/v2 when practical" });
  }
}

function main() {
  const root = projectRootFrom(__dirname);
  const componentsDir = path.join(root, "components");
  const registryDir = getRegistryPaths(root).registryDir;
  const files = walkDir(componentsDir, { filterFile: (p) => p.toLowerCase().endsWith(".html") });

  const categoryNames = loadCategoryNames(registryDir);
  const errors = [];
  const warnings = [];
  const seenId = new Map();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");

    let manifest;
    try {
      manifest = extractManifest(raw, { filePath }).manifest;
    } catch (e) {
      errors.push({ filePath, message: e.message });
      continue;
    }

    if (manifest.schema !== LEGACY_SCHEMA && manifest.schema !== LOCALIZED_SCHEMA) {
      errors.push({ filePath, message: `manifest.schema must be "${LEGACY_SCHEMA}" or "${LOCALIZED_SCHEMA}" (got "${manifest.schema}")` });
    }

    if (!isNonEmptyString(manifest.id)) {
      errors.push({ filePath, message: "manifest.id missing or not string" });
    } else {
      if (!isValidId(manifest.id)) {
        errors.push({ filePath, message: 'manifest.id must match ^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$' });
      }
      if (seenId.has(manifest.id)) {
        errors.push({ filePath, message: `Duplicate manifest.id "${manifest.id}" (also in ${seenId.get(manifest.id)})` });
      } else {
        seenId.set(manifest.id, filePath);
      }
    }

    if (!isNonEmptyString(manifest.category)) {
      errors.push({ filePath, message: "manifest.category missing or not non-empty string" });
    } else if (!isValidCategory(manifest.category)) {
      errors.push({ filePath, message: 'manifest.category must be "subject/domain" using lower-case letters, digits, and "-"' });
    }
    if (!isNonEmptyString(manifest.version)) {
      errors.push({ filePath, message: "manifest.version missing or not non-empty string" });
    } else if (!SEMVER_RE.test(manifest.version)) {
      errors.push({ filePath, message: `manifest.version must be valid SemVer (got "${manifest.version}")` });
    }

    for (const msg of validateEvents(manifest.events)) errors.push({ filePath, message: msg });
    for (const msg of checkForbidden(raw)) errors.push({ filePath, message: msg });

    const trimmed = raw.replace(/^\uFEFF/, "");
    const fragment = parse5.parseFragment(trimmed, { sourceCodeLocationInfo: false });
    const elementNodes = (fragment.childNodes || []).filter(isElementNode);
    const nonAux = elementNodes.filter((n) => n.tagName !== "style" && n.tagName !== "script");
    const cmpRoots = nonAux.filter((n) => hasClass(n, "cmp"));

    let rootAriaLabel = "";
    if (cmpRoots.length !== 1) {
      errors.push({ filePath, message: `Expected exactly 1 component root element with class="cmp"; found ${cmpRoots.length}` });
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
      rootAriaLabel = aria || "";
      if (!aria) errors.push({ filePath, message: 'Root must have aria-label="..."' });
    }

    const illegalTop = nonAux.filter((n) => !hasClass(n, "cmp"));
    if (illegalTop.length > 0) {
      errors.push({
        filePath,
        message: `Illegal extra top-level elements (only root + optional <style>/<script> allowed): ${illegalTop.map((n) => `<${n.tagName}>`).join(", ")}`
      });
    }

    const styleText = collectStyleText(fragment);
    for (const msg of checkCssIsolation(styleText)) errors.push({ filePath, message: msg });

    const locales = normalizeLocales(manifest, rootAriaLabel);
    validateLocaleShapes(manifest, locales, categoryNames, filePath, errors, warnings);
  }

  if (warnings.length) {
    console.warn(`Validation emitted ${warnings.length} warning(s):`);
    for (const warning of warnings) {
      console.warn(`- ${toPosixRel(root, warning.filePath)}: ${warning.message}`);
    }
  }

  if (errors.length) {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`- ${toPosixRel(root, err.filePath)}: ${err.message}`);
    }
    process.exitCode = 1;
  }
}

main();
