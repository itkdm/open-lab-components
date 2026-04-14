"use strict";

var fs, pathMod;
try { fs = require("fs"); pathMod = require("path"); } catch (error) { /* browser */ }

var i18n = require("./i18n.js");
var registryLib = require("./registry.js");

function getRegistry() {
  return registryLib.getRegistry();
}

function getLocale(options) {
  return i18n.normalizeLocale(options && options.locale);
}

function localizeItem(item, options) {
  if (!item) return null;
  return i18n.localizeRegistryItem(item, getLocale(options));
}

function list(filter, options) {
  var reg = getRegistry();
  var items = reg.items;
  var locale = getLocale(options);
  var selected = !filter ? items.slice() : items.filter(function (item) {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.tag) {
      var localized = localizeItem(item, { locale: locale });
      if (!localized.tags || localized.tags.indexOf(filter.tag) === -1) return false;
    }
    return true;
  });
  return selected.map(function (item) { return localizeItem(item, { locale: locale }); });
}

function get(id, options) {
  var reg = getRegistry();
  for (var i = 0; i < reg.items.length; i += 1) {
    if (reg.items[i].id === id) return localizeItem(reg.items[i], options);
  }
  return null;
}

function categories() {
  var seen = {};
  var result = [];
  var items = getRegistry().items;
  for (var i = 0; i < items.length; i += 1) {
    var cat = items[i].category;
    if (!seen[cat]) {
      seen[cat] = true;
      result.push(cat);
    }
  }
  return result;
}

function readSync(id) {
  if (!fs) throw new Error("readSync is only available in Node.js");
  var comp = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!comp) throw new Error("Component not found: " + id);
  var filePath = pathMod.join(__dirname, "..", comp.sourcePath);
  return fs.readFileSync(filePath, "utf-8");
}

function read(id) {
  if (!fs) return Promise.reject(new Error("read is only available in Node.js"));
  var comp = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!comp) return Promise.reject(new Error("Component not found: " + id));
  var filePath = pathMod.join(__dirname, "..", comp.sourcePath);
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, "utf-8", function (error, data) {
      if (error) reject(error); else resolve(data);
    });
  });
}

function resolve(id) {
  if (!pathMod) throw new Error("resolve is only available in Node.js");
  var comp = get(id, { locale: i18n.DEFAULT_LOCALE });
  if (!comp) throw new Error("Component not found: " + id);
  return pathMod.join(__dirname, "..", comp.sourcePath);
}

function hasEvents(item) {
  return Array.isArray(item.events) && item.events.length > 0;
}

function eventCount(item) {
  return hasEvents(item) ? item.events.length : 0;
}

function toSummary(item) {
  return {
    id: item.id,
    name: item.name,
    nameEn: item.nameEn,
    ariaLabel: item.ariaLabel,
    category: item.category,
    categoryName: item.categoryName,
    categoryNameEn: item.categoryNameEn,
    version: item.version,
    tags: Array.isArray(item.tags) ? item.tags.slice() : [],
    locales: item.locales,
    hasEvents: hasEvents(item),
    eventCount: eventCount(item)
  };
}

function compareItems(a, b) {
  return a.category.localeCompare(b.category) || a.id.localeCompare(b.id);
}

function clampLimit(limit, fallback, max) {
  var parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function getItems(locale) {
  return list(undefined, { locale: locale });
}

function filterItems(options) {
  var input = options || {};
  return getItems(input.locale)
    .filter(function (item) {
      if (input.category && item.category !== input.category) return false;
      if (input.tag && !(Array.isArray(item.tags) && item.tags.indexOf(input.tag) >= 0)) return false;
      if (typeof input.hasEvents === "boolean" && hasEvents(item) !== input.hasEvents) return false;
      return true;
    })
    .sort(compareItems);
}

function getCategories(locale) {
  var appliedLocale = locale || i18n.DEFAULT_LOCALE;
  var counts = new Map();
  var items = getItems(appliedLocale);

  for (var i = 0; i < items.length; i += 1) {
    var item = items[i];
    var current = counts.get(item.category) || {
      category: item.category,
      categoryName: item.categoryName,
      categoryNameEn: item.categoryNameEn,
      count: 0
    };
    current.count += 1;
    counts.set(item.category, current);
  }

  return Array.from(counts.values()).sort(function (a, b) {
    return a.category.localeCompare(b.category);
  });
}

function listComponents(input) {
  var options = input || {};
  var appliedFilters = {};
  if (options.category) appliedFilters.category = options.category;
  if (options.tag) appliedFilters.tag = options.tag;
  if (typeof options.hasEvents === "boolean") appliedFilters.hasEvents = options.hasEvents;
  if (options.locale) appliedFilters.locale = options.locale;

  var limit = clampLimit(options.limit, 20, 50);
  var filtered = filterItems(options);

  return {
    items: filtered.slice(0, limit).map(toSummary),
    total: filtered.length,
    appliedFilters: appliedFilters
  };
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9\u4e00-\u9fff._/-]+/i)
    .map(function (token) { return token.trim(); })
    .filter(Boolean);
}

var searchIndex = null;

function buildSearchIndex() {
  if (searchIndex) return searchIndex;

  searchIndex = getRegistry().items.map(function (item) {
    var localePayloads = Object.entries(item.locales || {}).map(function (entry) {
      var locale = entry[0];
      var localeData = entry[1];
      return {
        locale: locale,
        name: normalizeText(localeData.name),
        ariaLabel: normalizeText(localeData.ariaLabel),
        tags: Array.isArray(localeData.tags) ? localeData.tags.map(normalizeText) : []
      };
    });

    var fields = {
      id: normalizeText(item.id),
      category: normalizeText(item.category),
      categoryName: normalizeText(item.categoryName),
      categoryNameEn: normalizeText(item.categoryNameEn),
      locales: localePayloads
    };

    var allText = [
      fields.id,
      fields.category,
      fields.categoryName,
      fields.categoryNameEn
    ]
      .concat(localePayloads.flatMap(function (entry) {
        return [entry.name, entry.ariaLabel].concat(entry.tags);
      }))
      .join(" ");

    return {
      item: item,
      fields: fields,
      tokens: tokenize(allText)
    };
  });

  return searchIndex;
}

function scoreMatch(entry, query) {
  var q = normalizeText(query);
  var qTokens = tokenize(query);
  if (!q) return null;

  var fields = entry.fields;
  var tokens = entry.tokens;
  var localizedNames = fields.locales.map(function (localeEntry) { return localeEntry.name; });
  var localizedAriaLabels = fields.locales.map(function (localeEntry) { return localeEntry.ariaLabel; });
  var localizedTags = fields.locales.flatMap(function (localeEntry) { return localeEntry.tags; });

  if (fields.id === q) return { score: 1000, matchReason: "exact id" };
  if (localizedNames.indexOf(q) >= 0) return { score: 950, matchReason: "exact localized name" };
  if (localizedAriaLabels.indexOf(q) >= 0) return { score: 940, matchReason: "exact localized ariaLabel" };
  if (fields.id.indexOf(q) === 0) return { score: 900, matchReason: "id prefix" };
  if (localizedNames.some(function (name) { return name.indexOf(q) === 0; })) {
    return { score: 880, matchReason: "localized name prefix" };
  }
  if (localizedTags.indexOf(q) >= 0) return { score: 840, matchReason: "exact tag" };
  if (fields.category === q) return { score: 830, matchReason: "exact category" };
  if (fields.categoryName === q || fields.categoryNameEn === q) {
    return { score: 820, matchReason: "exact category name" };
  }

  var matchedTokens = 0;
  for (var i = 0; i < qTokens.length; i += 1) {
    if (tokens.some(function (candidate) { return candidate.indexOf(qTokens[i]) >= 0; })) matchedTokens += 1;
  }
  if (matchedTokens === qTokens.length && qTokens.length > 0) {
    return { score: 700 + matchedTokens, matchReason: "token match" };
  }

  if (
    fields.id.indexOf(q) >= 0 ||
    fields.category.indexOf(q) >= 0 ||
    fields.categoryName.indexOf(q) >= 0 ||
    fields.categoryNameEn.indexOf(q) >= 0 ||
    localizedNames.some(function (name) { return name.indexOf(q) >= 0; }) ||
    localizedAriaLabels.some(function (label) { return label.indexOf(q) >= 0; }) ||
    localizedTags.some(function (tag) { return tag.indexOf(q) >= 0; })
  ) {
    return { score: 600, matchReason: "substring match" };
  }

  return null;
}

function searchComponents(input) {
  var options = input || {};
  var query = String(options.query || "").trim();
  if (!query) throw new Error("query is required");

  var limit = clampLimit(options.limit, 10, 20);
  var category = options.category;
  var locale = options.locale;
  var matches = [];

  buildSearchIndex().forEach(function (entry) {
    if (category && entry.item.category !== category) return;
    var match = scoreMatch(entry, query);
    if (!match) return;
    matches.push(
      Object.assign({}, toSummary(get(entry.item.id, { locale: locale })), {
        score: match.score,
        matchReason: match.matchReason
      })
    );
  });

  matches.sort(function (a, b) {
    return b.score - a.score || a.id.localeCompare(b.id);
  });

  return { items: matches.slice(0, limit) };
}

function getSuggestions(id, locale) {
  return searchComponents({ query: id, limit: 5, locale: locale }).items.map(function (item) {
    return item.id;
  });
}

function getComponentData(id, locale) {
  var item = get(id, { locale: locale || i18n.DEFAULT_LOCALE });
  if (!item) {
    var error = new Error("Component not found: " + id);
    error.code = "COMPONENT_NOT_FOUND";
    error.data = {
      id: id,
      suggestions: getSuggestions(id, locale || i18n.DEFAULT_LOCALE)
    };
    throw error;
  }

  return {
    component: Object.assign({}, item, {
      html: readSync(id),
      hasEvents: hasEvents(item),
      eventCount: eventCount(item)
    })
  };
}

module.exports = {
  buildSearchIndex: buildSearchIndex,
  categories: categories,
  clampLimit: clampLimit,
  compareItems: compareItems,
  eventCount: eventCount,
  filterItems: filterItems,
  get: get,
  getCategories: getCategories,
  getComponentData: getComponentData,
  getItems: getItems,
  getLocale: getLocale,
  getRegistry: getRegistry,
  getSuggestions: getSuggestions,
  hasEvents: hasEvents,
  list: list,
  listComponents: listComponents,
  localizeItem: localizeItem,
  normalizeText: normalizeText,
  read: read,
  readSync: readSync,
  resolve: resolve,
  scoreMatch: scoreMatch,
  searchComponents: searchComponents,
  toSummary: toSummary,
  tokenize: tokenize
};
