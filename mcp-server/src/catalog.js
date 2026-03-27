import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lab = require("../../index.js");

let searchIndex = null;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9\u4e00-\u9fff._/-]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getItems(locale) {
  return lab.list(undefined, { locale });
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
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function filterItems({ category, tag, hasEvents: wantEvents, locale } = {}) {
  return getItems(locale)
    .filter((item) => {
      if (category && item.category !== category) return false;
      if (tag && !(Array.isArray(item.tags) && item.tags.includes(tag))) return false;
      if (typeof wantEvents === "boolean" && hasEvents(item) !== wantEvents) return false;
      return true;
    })
    .sort(compareItems);
}

function getCategories(locale = "zh-CN") {
  const counts = new Map();

  for (const item of getItems(locale)) {
    const current = counts.get(item.category) || {
      category: item.category,
      categoryName: item.categoryName,
      categoryNameEn: item.categoryNameEn,
      count: 0
    };
    current.count += 1;
    counts.set(item.category, current);
  }

  return Array.from(counts.values()).sort((a, b) => a.category.localeCompare(b.category));
}

function listComponents(input = {}) {
  const appliedFilters = {};
  if (input.category) appliedFilters.category = input.category;
  if (input.tag) appliedFilters.tag = input.tag;
  if (typeof input.hasEvents === "boolean") appliedFilters.hasEvents = input.hasEvents;
  if (input.locale) appliedFilters.locale = input.locale;

  const limit = clampLimit(input.limit, 20, 50);
  const filtered = filterItems(input);

  return {
    items: filtered.slice(0, limit).map(toSummary),
    total: filtered.length,
    appliedFilters
  };
}

function buildSearchIndex() {
  if (searchIndex) return searchIndex;

  searchIndex = lab.registry.items.map((item) => {
    const localePayloads = Object.entries(item.locales || {}).map(([locale, localeData]) => ({
      locale,
      name: normalizeText(localeData.name),
      ariaLabel: normalizeText(localeData.ariaLabel),
      tags: Array.isArray(localeData.tags) ? localeData.tags.map(normalizeText) : []
    }));

    const fields = {
      id: normalizeText(item.id),
      category: normalizeText(item.category),
      categoryName: normalizeText(item.categoryName),
      categoryNameEn: normalizeText(item.categoryNameEn),
      locales: localePayloads
    };

    const allText = [
      fields.id,
      fields.category,
      fields.categoryName,
      fields.categoryNameEn,
      ...localePayloads.flatMap((entry) => [entry.name, entry.ariaLabel, ...entry.tags])
    ].join(" ");

    return {
      item,
      fields,
      tokens: tokenize(allText)
    };
  });

  return searchIndex;
}

function scoreMatch(entry, query) {
  const q = normalizeText(query);
  const qTokens = tokenize(query);
  if (!q) return null;

  const { fields, tokens } = entry;
  const localizedNames = fields.locales.map((entry) => entry.name);
  const localizedAriaLabels = fields.locales.map((entry) => entry.ariaLabel);
  const localizedTags = fields.locales.flatMap((entry) => entry.tags);

  if (fields.id === q) return { score: 1000, matchReason: "exact id" };
  if (localizedNames.includes(q)) return { score: 950, matchReason: "exact localized name" };
  if (localizedAriaLabels.includes(q)) return { score: 940, matchReason: "exact localized ariaLabel" };
  if (fields.id.startsWith(q)) return { score: 900, matchReason: "id prefix" };
  if (localizedNames.some((name) => name.startsWith(q))) return { score: 880, matchReason: "localized name prefix" };
  if (localizedTags.includes(q)) return { score: 840, matchReason: "exact tag" };
  if (fields.category === q) return { score: 830, matchReason: "exact category" };
  if (fields.categoryName === q || fields.categoryNameEn === q) return { score: 820, matchReason: "exact category name" };

  let matchedTokens = 0;
  for (const token of qTokens) {
    if (tokens.some((candidate) => candidate.includes(token))) matchedTokens += 1;
  }
  if (matchedTokens === qTokens.length && qTokens.length > 0) {
    return { score: 700 + matchedTokens, matchReason: "token match" };
  }

  if (
    fields.id.includes(q) ||
    fields.category.includes(q) ||
    fields.categoryName.includes(q) ||
    fields.categoryNameEn.includes(q) ||
    localizedNames.some((name) => name.includes(q)) ||
    localizedAriaLabels.some((name) => name.includes(q)) ||
    localizedTags.some((tag) => tag.includes(q))
  ) {
    return { score: 600, matchReason: "substring match" };
  }

  return null;
}

function searchComponents(input = {}) {
  const query = String(input.query || "").trim();
  if (!query) throw new Error("query is required");

  const limit = clampLimit(input.limit, 10, 20);
  const category = input.category;
  const locale = input.locale;
  const matches = [];

  for (const entry of buildSearchIndex()) {
    if (category && entry.item.category !== category) continue;
    const match = scoreMatch(entry, query);
    if (!match) continue;
    matches.push({
      ...toSummary(lab.get(entry.item.id, { locale })),
      score: match.score,
      matchReason: match.matchReason
    });
  }

  matches.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { items: matches.slice(0, limit) };
}

function getSuggestions(id, locale) {
  return searchComponents({ query: id, limit: 5, locale }).items.map((item) => item.id);
}

function getComponent(id, locale = "zh-CN") {
  const item = lab.get(id, { locale });
  if (!item) {
    const error = new Error(`Component not found: ${id}`);
    error.code = "COMPONENT_NOT_FOUND";
    error.data = {
      id,
      suggestions: getSuggestions(id, locale)
    };
    throw error;
  }

  return {
    component: {
      ...item,
      html: lab.readSync(id),
      hasEvents: hasEvents(item),
      eventCount: eventCount(item)
    }
  };
}

export {
  getCategories,
  listComponents,
  searchComponents,
  getComponent,
  getSuggestions,
  toSummary
};
