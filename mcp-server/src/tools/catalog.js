import { createRequire } from "node:module";
import { feedbackStore } from "../feedback/feedback-store.js";

const require = createRequire(import.meta.url);
const lab = require("../../../index.js");

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

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function collectRecommendationText(item) {
  const localeEntries = Object.values(item.locales || {});
  const props = Array.isArray(item.props) ? item.props : [];
  const events = Array.isArray(item.events) ? item.events : [];

  return normalizeText(
    [
      item.id,
      item.name,
      item.nameEn,
      item.ariaLabel,
      item.category,
      item.categoryName,
      item.categoryNameEn,
      item.description,
      ...(Array.isArray(item.tags) ? item.tags : []),
      ...localeEntries.flatMap((localeData) => [
        localeData.name,
        localeData.ariaLabel,
        localeData.description,
        ...(Array.isArray(localeData.tags) ? localeData.tags : [])
      ]),
      ...props.flatMap((prop) => [prop.key, prop.label, prop.desc, prop.category]),
      ...events.flatMap((event) => [event.name, event.label, event.desc, event.type])
    ].join(" ")
  );
}

function scoreTokensAgainstText(tokens, text, weight, reason, matches) {
  let score = 0;
  let hitCount = 0;

  for (const token of tokens) {
    if (text.includes(token)) {
      score += weight;
      hitCount += 1;
    }
  }

  if (hitCount > 0) {
    matches.push({
      reason,
      matchedTokens: tokens.filter((token) => text.includes(token))
    });
  }

  return score;
}

function recommendationSummary(item) {
  return {
    ...toSummary(item),
    description: item.description || null
  };
}

function recommendComponents(input = {}) {
  const locale = input.locale;
  const subject = String(input.subject || "").trim();
  const lessonGoal = String(input.lessonGoal || "").trim();
  const audience = String(input.audience || "").trim();
  const interactionMode = String(input.interactionMode || "").trim();
  const customerId = String(input.customerId || input.tenantId || "").trim();
  const mustIncludeTags = normalizeArray(input.mustIncludeTags);
  const preferredCategories = normalizeArray(input.preferredCategories);
  const excludeCategories = normalizeArray(input.excludeCategories);
  const limit = clampLimit(input.limit, 5, 10);

  if (!subject || !lessonGoal) {
    throw new Error("subject and lessonGoal are required");
  }

  const queryText = [subject, lessonGoal, audience, interactionMode, ...mustIncludeTags, ...preferredCategories].join(" ");
  const queryTokens = tokenize(queryText);
  const subjectTokens = tokenize(subject);
  const goalTokens = tokenize(lessonGoal);
  const audienceTokens = tokenize(audience);
  const interactionTokens = tokenize(interactionMode);
  const recommendations = [];

  for (const item of getItems(locale)) {
    if (excludeCategories.includes(item.category)) continue;

    let score = 0;
    const matchDetails = [];
    const text = collectRecommendationText(item);

    if (preferredCategories.includes(item.category)) {
      score += 140;
      matchDetails.push({ reason: "preferred category", matchedTokens: [item.category] });
    }

    if (normalizeText(item.category).includes(normalizeText(subject)) && subject) {
      score += 120;
      matchDetails.push({ reason: "subject-category alignment", matchedTokens: [subject] });
    }

    score += scoreTokensAgainstText(subjectTokens, text, 34, "subject match", matchDetails);
    score += scoreTokensAgainstText(goalTokens, text, 24, "lesson goal match", matchDetails);
    score += scoreTokensAgainstText(audienceTokens, text, 10, "audience match", matchDetails);
    score += scoreTokensAgainstText(interactionTokens, text, 16, "interaction mode match", matchDetails);

    const tags = normalizeArray(item.tags).map(normalizeText);
    const matchedRequiredTags = mustIncludeTags.filter((tag) => tags.includes(normalizeText(tag)));
    if (mustIncludeTags.length > 0 && matchedRequiredTags.length === 0) continue;
    if (matchedRequiredTags.length > 0) {
      score += matchedRequiredTags.length * 55;
      matchDetails.push({ reason: "required tags", matchedTokens: matchedRequiredTags });
    }

    if (hasEvents(item) && /interactive|experiment|simulate|demo|拖拽|交互|实验|演示/i.test(queryText)) {
      score += 45;
      matchDetails.push({ reason: "interaction-ready", matchedTokens: ["events"] });
    }

    if (Array.isArray(item.props) && item.props.length > 0) {
      score += Math.min(18, item.props.length);
    }

    if (queryTokens.length > 0) {
      const matchedQueryTokens = queryTokens.filter((token) => text.includes(token));
      if (matchedQueryTokens.length === 0) continue;
      score += matchedQueryTokens.length * 6;
    }

    const feedbackAdjustment = feedbackStore.getAdjustment(item.id, {
      customerId,
      subject,
      lessonGoal,
      audience,
      interactionMode,
      preferredCategories,
      mustIncludeTags
    });
    if (feedbackAdjustment.totalBoost !== 0) {
      score += feedbackAdjustment.totalBoost;
      matchDetails.push({
        reason: "feedback rerank",
        matchedTokens: [
          `context:${feedbackAdjustment.contextBoost}`,
          `global:${feedbackAdjustment.globalBoost}`
        ]
      });
    }

    recommendations.push({
      ...recommendationSummary(item),
      recommendationScore: score,
      recommendationReasons: matchDetails.slice(0, 5),
      feedbackAdjustment,
      recommendedUse:
        item.description ||
        `Suitable for ${subject} scenarios that need ${lessonGoal}.`
    });
  }

  recommendations.sort(
    (a, b) =>
      b.recommendationScore - a.recommendationScore ||
      Number(b.hasEvents) - Number(a.hasEvents) ||
      b.id.localeCompare(a.id)
  );

  return {
    query: {
      subject,
      lessonGoal,
      customerId: customerId || null,
      audience: audience || null,
      interactionMode: interactionMode || null,
      mustIncludeTags,
      preferredCategories,
      excludeCategories,
      locale: locale || null
    },
    items: recommendations.slice(0, limit)
  };
}

async function submitRecommendationFeedback(input = {}) {
  return {
    feedback: await feedbackStore.recordFeedback(input)
  };
}

function getRecommendationFeedbackStats() {
  return {
    feedback: feedbackStore.snapshot()
  };
}

function inferSectionType(title) {
  const normalized = normalizeText(title);
  if (/intro|overview|导入|概览/.test(normalized)) return "intro";
  if (/experiment|demo|simulation|实验|演示|仿真/.test(normalized)) return "interactive";
  if (/analysis|explain|concept|原理|解析|讲解/.test(normalized)) return "explanation";
  if (/practice|exercise|quiz|训练|练习/.test(normalized)) return "practice";
  if (/summary|wrap|总结|回顾/.test(normalized)) return "summary";
  return "content";
}

function buildSectionTitles(subject, lessonGoal, audience) {
  const target = audience ? `for ${audience}` : "";
  return [
    `Lesson Overview ${target}`.trim(),
    `${subject} Interactive Demonstration`,
    `${subject} Concept Explanation`,
    `${subject} Guided Practice`,
    `${subject} Lesson Summary`
  ].map((title, index) => {
    if (index === 0) return title;
    return lessonGoal ? `${title}: ${lessonGoal}` : title;
  });
}

function buildExperimentPagePlan(input = {}) {
  const subject = String(input.subject || "").trim();
  const lessonGoal = String(input.lessonGoal || "").trim();
  const audience = String(input.audience || "").trim();
  const interactionMode = String(input.interactionMode || "").trim();
  const locale = input.locale;
  const pageType = String(input.pageType || "lesson").trim();
  const maxComponents = clampLimit(input.maxComponents, 4, 6);
  const preferredCategories = normalizeArray(input.preferredCategories);
  const mustIncludeTags = normalizeArray(input.mustIncludeTags);

  if (!subject || !lessonGoal) {
    throw new Error("subject and lessonGoal are required");
  }

  const recommendationResult = recommendComponents({
    subject,
    lessonGoal,
    audience,
    interactionMode,
    preferredCategories,
    mustIncludeTags,
    limit: maxComponents,
    locale
  });

  const selectedItems = recommendationResult.items.slice(0, maxComponents);
  const sectionTitles = buildSectionTitles(subject, lessonGoal, audience);
  const sections = sectionTitles.map((title, index) => {
    const sectionType = inferSectionType(title);
    const item = selectedItems[index % Math.max(selectedItems.length, 1)] || null;

    return {
      order: index + 1,
      title,
      sectionType,
      objective:
        sectionType === "interactive"
          ? `Use a visual component to make ${lessonGoal} concrete.`
          : sectionType === "practice"
            ? `Help learners apply ${lessonGoal} with guided interaction.`
            : `Support the ${pageType} flow around ${lessonGoal}.`,
      recommendedComponentId: item ? item.id : null,
      recommendedComponentReason:
        item
          ? `${item.name} fits because it scored ${item.recommendationScore} and aligns with ${subject} + ${lessonGoal}.`
          : "No component selected for this section.",
      interactionPattern:
        sectionType === "interactive"
          ? interactionMode || "interactive exploration"
          : sectionType === "practice"
            ? "guided exercise"
            : "content support"
    };
  });

  return {
    page: {
      pageType,
      subject,
      lessonGoal,
      audience: audience || null,
      interactionMode: interactionMode || null,
      locale: locale || null
    },
    selectedComponents: selectedItems,
    sections,
    implementationNotes: [
      "Place the highest-scoring interactive component above the fold.",
      "Pair each interactive section with a short explanation and one learner task.",
      "Reuse locale-aware labels from the MCP response instead of hardcoding copy.",
      "Use get_component only for the final chosen items to avoid transferring unnecessary HTML."
    ],
    assemblySteps: [
      "Call recommend_components with the lesson constraints to shortlist candidates.",
      "Use get_component for the selected ids to fetch final HTML payloads.",
      "Embed components in the interactive and practice sections first.",
      "Add explanatory text and teacher guidance around each selected component."
    ]
  };
}

function pickBundleLayout(sectionType, index) {
  if (sectionType === "interactive") return "hero";
  if (sectionType === "practice") return "two-column";
  if (sectionType === "summary") return "compact";
  return index === 0 ? "hero" : "stack";
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function composeExperimentBundle(input = {}) {
  const locale = input.locale;
  const subject = String(input.subject || "").trim();
  const lessonGoal = String(input.lessonGoal || "").trim();
  const audience = String(input.audience || "").trim();
  const interactionMode = String(input.interactionMode || "").trim();
  const pageType = String(input.pageType || "lesson").trim();
  const componentIds = normalizeArray(input.componentIds);
  const maxComponents = clampLimit(input.maxComponents, 4, 6);

  let basePlan = null;
  let selectedComponents = [];

  if (componentIds.length > 0) {
    selectedComponents = componentIds.map((id) => {
      const result = getComponent(id, locale);
      return recommendationSummary(result.component);
    });
  } else {
    if (!subject || !lessonGoal) {
      throw new Error("subject and lessonGoal are required when componentIds are not provided");
    }

    basePlan = buildExperimentPagePlan({
      subject,
      lessonGoal,
      audience,
      interactionMode,
      pageType,
      preferredCategories: input.preferredCategories,
      mustIncludeTags: input.mustIncludeTags,
      maxComponents,
      locale
    });
    selectedComponents = basePlan.selectedComponents;
  }

  selectedComponents = uniqueById(selectedComponents).slice(0, maxComponents);
  const sections =
    basePlan && Array.isArray(basePlan.sections)
      ? basePlan.sections
      : selectedComponents.map((item, index) => ({
          order: index + 1,
          title: `${item.name} Section`,
          sectionType: index === 0 ? "interactive" : "content",
          objective: `Use ${item.name} to support the delivery of the page.`,
          recommendedComponentId: item.id,
          recommendedComponentReason: `${item.name} was explicitly selected for the bundle.`,
          interactionPattern: index === 0 ? interactionMode || "interactive exploration" : "content support"
        }));

  const bundleItems = sections
    .map((section, index) => {
      const componentId = section.recommendedComponentId;
      if (!componentId) return null;
      const component = getComponent(componentId, locale).component;

      return {
        order: index + 1,
        sectionTitle: section.title,
        sectionType: section.sectionType,
        component: {
          id: component.id,
          name: component.name,
          category: component.category,
          tags: component.tags,
          hasEvents: hasEvents(component)
        },
        html: component.html,
        layoutHint: pickBundleLayout(section.sectionType, index),
        integrationNotes: [
          `Mount ${component.name} in the ${section.title} section.`,
          hasEvents(component)
            ? "Wire host-side listeners if you need to capture interactive events."
            : "This component can be embedded as a static visual block.",
          "Preserve CSS variable configuration so the host page can theme the component."
        ]
      };
    })
    .filter(Boolean);

  return {
    bundle: {
      pageType,
      subject: subject || null,
      lessonGoal: lessonGoal || null,
      audience: audience || null,
      interactionMode: interactionMode || null,
      locale: locale || null,
      itemCount: bundleItems.length
    },
    items: bundleItems,
    renderOrder: bundleItems.map((item) => item.component.id),
    hostInstructions: [
      "Render bundle items in the provided order to preserve the intended teaching flow.",
      "Lazy-load below-the-fold sections if the host page has multiple interactive components.",
      "Apply section-level copy and teacher guidance around each bundled component."
    ],
    sourcePlan:
      basePlan
        ? {
            sections: basePlan.sections,
            assemblySteps: basePlan.assemblySteps
          }
        : null
  };
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
  recommendComponents,
  submitRecommendationFeedback,
  getRecommendationFeedbackStats,
  buildExperimentPagePlan,
  composeExperimentBundle,
  getComponent,
  getSuggestions,
  toSummary
};
