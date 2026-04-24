"use strict";

var fs, pathMod;
try { fs = require("fs"); pathMod = require("path"); } catch (_error) { /* browser */ }

var i18n = require("./i18n.js");
var registryLib = require("./visual-registry.js");
var visualTaxonomy = require("./visual-taxonomy.js");

function getRegistry() {
  return registryLib.getRegistry();
}

function getLocale(options) {
  return i18n.normalizeLocale(options && options.locale);
}

function isTextFormat(format) {
  var value = String(format || "").toLowerCase();
  return value.indexOf("svg") !== -1 ||
    value.indexOf("xml") !== -1 ||
    value.indexOf("json") !== -1 ||
    value.indexOf("text/") === 0;
}

function localizeVisual(item, options) {
  if (!item) return null;
  var locale = getLocale(options);
  var localized = i18n.resolveLocaleEntry(item.locales, locale);
  var english = i18n.resolveLocaleEntry(item.locales, "en");
  var next = i18n.deepClone(item);
  next.title = localized.title || item.title || item.id;
  next.titleEn = english.title || item.titleEn || next.title;
  next.summary = localized.summary || item.summary || "";
  next.summaryEn = english.summary || item.summaryEn || next.summary;
  next.aiPrompt = localized.prompt || item.aiPrompt || "";
  next.aiPromptEn = english.prompt || item.aiPromptEn || next.aiPrompt;
  next.tags = Array.isArray(localized.tags) && localized.tags.length
    ? localized.tags.slice()
    : (Array.isArray(item.tags) ? item.tags.slice() : []);
  return next;
}

function list(filter, options) {
  var reg = getRegistry();
  var items = reg.items;
  var locale = getLocale(options);
  var selected = !filter ? items.slice() : items.filter(function (item) {
    if (filter.subject && item.subject !== filter.subject) return false;
    if (filter.type && item.type !== filter.type) return false;
    if (filter.topic && item.topic !== filter.topic) return false;
    if (filter.tag) {
      var localized = localizeVisual(item, { locale: locale });
      if (!localized.tags || localized.tags.indexOf(filter.tag) === -1) return false;
    }
    return true;
  });
  return selected.map(function (item) { return localizeVisual(item, { locale: locale }); });
}

function get(id, options) {
  var items = getRegistry().items;
  for (var i = 0; i < items.length; i += 1) {
    if (items[i].id === id) return localizeVisual(items[i], options);
  }
  return null;
}

function subjects() {
  var seen = {};
  var result = [];
  var items = getRegistry().items;
  for (var i = 0; i < items.length; i += 1) {
    var subject = items[i].subject;
    if (!seen[subject]) {
      seen[subject] = true;
      result.push(subject);
    }
  }
  return result;
}

function readSync(id) {
  if (!fs) throw new Error("readSync is only available in Node.js");
  var visual = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!visual) throw new Error("Visual not found: " + id);
  var filePath = pathMod.join(__dirname, "..", visual.assetPath);
  return isTextFormat(visual.format)
    ? fs.readFileSync(filePath, "utf-8")
    : fs.readFileSync(filePath);
}

function read(id) {
  if (!fs) return Promise.reject(new Error("read is only available in Node.js"));
  var visual = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!visual) return Promise.reject(new Error("Visual not found: " + id));
  var filePath = pathMod.join(__dirname, "..", visual.assetPath);
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, isTextFormat(visual.format) ? "utf-8" : undefined, function (error, data) {
      if (error) reject(error); else resolve(data);
    });
  });
}

function resolve(id) {
  if (!pathMod) throw new Error("resolve is only available in Node.js");
  var visual = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!visual) throw new Error("Visual not found: " + id);
  return pathMod.join(__dirname, "..", visual.assetPath);
}

function summarize(item) {
  return {
    id: item.id,
    subject: item.subject,
    topic: item.topic,
    type: item.type,
    format: item.format,
    title: item.title,
    titleEn: item.titleEn,
    summary: item.summary,
    summaryEn: item.summaryEn,
    aiPrompt: item.aiPrompt,
    aiPromptEn: item.aiPromptEn,
    tags: Array.isArray(item.tags) ? item.tags.slice() : [],
    gradeRange: Array.isArray(item.gradeRange) ? item.gradeRange.slice() : [],
    relatedComponents: Array.isArray(item.relatedComponents) ? item.relatedComponents.slice() : [],
    originType: item.originType || "ai-generated",
    author: item.author || null,
    source: item.source || null,
    license: item.license || null,
    thumbnailMode: item.thumbnailMode || "cover",
    focalPoint: item.focalPoint || null,
    featured: Boolean(item.featured),
    thumbnailPath: item.thumbnailPath,
    assetPath: item.assetPath
  };
}

module.exports = {
  getRegistry: getRegistry,
  localizeVisual: localizeVisual,
  list: list,
  get: get,
  subjects: subjects,
  readSync: readSync,
  read: read,
  resolve: resolve,
  isTextFormat: isTextFormat,
  summarize: summarize,
  taxonomy: function taxonomy(locale) {
    return visualTaxonomy.createTaxonomyPayload(locale || i18n.DEFAULT_LOCALE);
  }
};
