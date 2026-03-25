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

function getItems() {
  return lab.registry.items.slice();
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
    category: item.category,
    categoryName: item.categoryName,
    categoryNameEn: item.categoryNameEn,
    version: item.version,
    tags: Array.isArray(item.tags) ? item.tags.slice() : [],
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

function filterItems({ category, tag, hasEvents: wantEvents } = {}) {
  return getItems()
    .filter((item) => {
      if (category && item.category !== category) return false;
      if (tag && !(Array.isArray(item.tags) && item.tags.includes(tag))) return false;
      if (typeof wantEvents === "boolean" && hasEvents(item) !== wantEvents) return false;
      return true;
    })
    .sort(compareItems);
}

function getCategories() {
  const counts = new Map();

  for (const item of getItems()) {
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

  searchIndex = getItems().map((item) => {
    const fields = {
      id: normalizeText(item.id),
      name: normalizeText(item.name),
      nameEn: normalizeText(item.nameEn),
      category: normalizeText(item.category),
      categoryName: normalizeText(item.categoryName),
      categoryNameEn: normalizeText(item.categoryNameEn),
      tags: Array.isArray(item.tags) ? item.tags.map(normalizeText) : []
    };

    const allText = [
      fields.id,
      fields.name,
      fields.nameEn,
      fields.category,
      fields.categoryName,
      fields.categoryNameEn,
      ...fields.tags
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

  if (fields.id === q) return { score: 1000, matchReason: "exact id" };
  if (fields.name === q) return { score: 950, matchReason: "exact name" };
  if (fields.nameEn === q) return { score: 940, matchReason: "exact English name" };
  if (fields.id.startsWith(q)) return { score: 900, matchReason: "id prefix" };
  if (fields.name.startsWith(q)) return { score: 880, matchReason: "name prefix" };
  if (fields.nameEn.startsWith(q)) return { score: 870, matchReason: "English name prefix" };
  if (fields.tags.includes(q)) return { score: 840, matchReason: "exact tag" };
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
    fields.name.includes(q) ||
    fields.nameEn.includes(q) ||
    fields.category.includes(q) ||
    fields.categoryName.includes(q) ||
    fields.categoryNameEn.includes(q) ||
    fields.tags.some((tag) => tag.includes(q))
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
  const matches = [];

  for (const entry of buildSearchIndex()) {
    if (category && entry.item.category !== category) continue;
    const match = scoreMatch(entry, query);
    if (!match) continue;
    matches.push({
      ...toSummary(entry.item),
      score: match.score,
      matchReason: match.matchReason
    });
  }

  matches.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { items: matches.slice(0, limit) };
}

function getSuggestions(id) {
  return searchComponents({ query: id, limit: 5 }).items.map((item) => item.id);
}

function getComponent(id) {
  const item = lab.get(id);
  if (!item) {
    const error = new Error(`Component not found: ${id}`);
    error.code = "COMPONENT_NOT_FOUND";
    error.data = {
      id,
      suggestions: getSuggestions(id)
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
