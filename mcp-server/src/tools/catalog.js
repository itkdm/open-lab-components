import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feedbackStore } from "../feedback/feedback-store.js";

const require = createRequire(import.meta.url);
const catalog = require("../../../lib/catalog.js");
const visualCatalog = require("../../../lib/visual-catalog.js");
const MCP_RESPONSE_SCHEMA_VERSION = "openlab-mcp-response/v1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUALITY_REPORT_PATH = path.resolve(__dirname, "../../../registry/quality-report.json");
const SOURCE_INFO = Object.freeze({
  kind: "open-lab-components-catalog",
  package: "@itkdm/open-lab-components-mcp"
});
let qualityReportCache = undefined;

const {
  clampLimit,
  eventCount,
  getCategories,
  getComponentData,
  getItems,
  getSuggestions,
  hasEvents,
  listComponents,
  normalizeText,
  searchComponents,
  tokenize,
  toSummary
} = catalog;
const {
  get: getVisualById,
  list: listVisualRegistryItems,
  readSync: readVisualSync,
  isTextFormat: isTextVisualFormat,
  subjects: getVisualSubjects,
  summarize: summarizeVisual
} = visualCatalog;

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function clampVisualLimit(limit) {
  return clampLimit(limit, 12, 30);
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

function buildVisualSearchText(item) {
  return normalizeText(
    [
      item.id,
      item.subject,
      item.topic,
      item.type,
      item.originType,
      item.title,
      item.titleEn,
      item.summary,
      item.summaryEn,
      item.aiPrompt,
      item.aiPromptEn,
      item.author && item.author.name,
      item.source && item.source.label,
      item.license && item.license.name,
      ...(Array.isArray(item.tags) ? item.tags : []),
      ...Object.values(item.locales || {}).flatMap((localeEntry) => [
        localeEntry.title,
        localeEntry.summary,
        localeEntry.prompt,
        ...(Array.isArray(localeEntry.tags) ? localeEntry.tags : [])
      ])
    ].join(" ")
  );
}

function createResponseMeta(kind, locale, warnings = []) {
  return {
    schemaVersion: MCP_RESPONSE_SCHEMA_VERSION,
    responseType: kind,
    generatedAt: new Date().toISOString(),
    localeApplied: locale || "zh-CN",
    warnings: Array.isArray(warnings) ? warnings : [],
    source: SOURCE_INFO
  };
}

function listVisuals(input = {}) {
  const locale = input.locale;
  const subject = String(input.subject || "").trim();
  const type = String(input.type || "").trim();
  const topic = String(input.topic || "").trim();
  const tag = String(input.tag || "").trim();
  const limit = clampVisualLimit(input.limit);
  const items = listVisualRegistryItems({
    subject: subject || undefined,
    type: type || undefined,
    topic: topic || undefined,
    tag: tag || undefined
  }, { locale });

  return {
    ...createResponseMeta("list_visuals", locale),
    appliedFilters: {
      subject: subject || null,
      type: type || null,
      topic: topic || null,
      tag: tag || null,
      limit
    },
    total: items.length,
    items: items.slice(0, limit).map(summarizeVisual)
  };
}

function searchVisuals(input = {}) {
  const locale = input.locale;
  const query = String(input.query || "").trim();
  const subject = String(input.subject || "").trim();
  const type = String(input.type || "").trim();
  const limit = clampVisualLimit(input.limit);
  if (!query) {
    throw new Error("query is required");
  }

  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);
  const items = listVisualRegistryItems(undefined, { locale })
    .filter((item) => {
      if (subject && item.subject !== subject) return false;
      if (type && item.type !== type) return false;
      return true;
    })
    .map((item) => {
      const text = buildVisualSearchText(item);
      let score = 0;
      let matchReason = "token match";
      if (normalizeText(item.id) === normalizedQuery) {
        score = 1000;
        matchReason = "exact id";
      } else if (normalizeText(item.title) === normalizedQuery) {
        score = 950;
        matchReason = "exact title";
      } else if (text.includes(normalizedQuery)) {
        score = 700;
        matchReason = "substring match";
      } else {
        const matchedTokens = tokens.filter((token) => text.includes(token));
        if (!matchedTokens.length) return null;
        score = 500 + matchedTokens.length * 10;
      }

      return {
        ...summarizeVisual(item),
        score,
        matchReason
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);

  return {
    ...createResponseMeta("search_visuals", locale),
    query,
    appliedFilters: {
      subject: subject || null,
      type: type || null,
      limit
    },
    items
  };
}

function buildVisualIntegrationHints(visual) {
  return {
    placement: visual.type === "flowchart" || visual.type === "procedure" ? "instruction-section" : "concept-section",
    embedMode: visual.format === "image/svg+xml" ? "inline-or-img" : "img",
    originType: visual.originType || "ai-generated",
    thumbnailMode: visual.thumbnailMode || "cover",
    focalPoint: visual.focalPoint || null,
    relatedComponents: Array.isArray(visual.relatedComponents) ? visual.relatedComponents.slice() : []
  };
}

function getVisual(id, locale = "zh-CN") {
  const visual = getVisualById(id, { locale });
  if (!visual) {
    const error = new Error(`Visual not found: ${id}`);
    error.code = "VISUAL_NOT_FOUND";
    error.data = { id };
    throw error;
  }

  const content = readVisualSync(id);
  const isTextContent = isTextVisualFormat(visual.format);
  return {
    ...createResponseMeta("get_visual", locale),
    integrationHints: buildVisualIntegrationHints(visual),
    visual: {
      ...visual,
      content: isTextContent ? content : null,
      contentEncoding: isTextContent ? "utf-8" : "binary"
    }
  };
}

function getVisualCatalogOverview(locale = "en") {
  const items = listVisualRegistryItems(undefined, { locale });
  return {
    locale,
    visualCount: items.length,
    subjectCount: new Set(items.map((item) => item.subject)).size,
    typeCount: new Set(items.map((item) => item.type)).size,
    subjects: getVisualSubjects(),
    featured: items.slice(0, 6).map(summarizeVisual)
  };
}

function normalizeRequestedLocale(locale) {
  if (!locale) return "zh-CN";
  const raw = String(locale).trim().toLowerCase();
  if (!raw || raw === "zh" || raw === "zh-cn") return "zh-CN";
  if (raw === "en" || raw === "en-us" || raw === "en-gb") return "en";
  return String(locale).trim();
}

function hasExactLocalePayload(item, locale) {
  const normalized = normalizeRequestedLocale(locale);
  const locales = item && item.locales && typeof item.locales === "object" ? item.locales : {};
  const entry = locales[normalized];
  return !!(entry && entry.name && entry.ariaLabel);
}

function createWarning(code, message, details = {}) {
  return {
    code,
    message,
    ...details
  };
}

function loadQualityReport() {
  if (qualityReportCache !== undefined) return qualityReportCache;
  try {
    const payload = JSON.parse(fs.readFileSync(QUALITY_REPORT_PATH, "utf8"));
    if (!payload || typeof payload !== "object" || !payload.items || typeof payload.items !== "object") {
      qualityReportCache = null;
      return qualityReportCache;
    }
    qualityReportCache = payload;
    return qualityReportCache;
  } catch (_error) {
    qualityReportCache = null;
    return qualityReportCache;
  }
}

function hasDescription(item) {
  return !!(item && typeof item.description === "string" && item.description.trim());
}

function countDocumentedProps(item) {
  return (Array.isArray(item.props) ? item.props : []).filter((prop) => {
    return !!(prop && typeof prop.desc === "string" && prop.desc.trim());
  }).length;
}

function countDocumentedEvents(item) {
  return (Array.isArray(item.events) ? item.events : []).filter((event) => {
    return !!(
      event &&
      ((typeof event.desc === "string" && event.desc.trim()) ||
        (typeof event.label === "string" && event.label.trim()))
    );
  }).length;
}

function buildQualitySignals(item) {
  const props = Array.isArray(item.props) ? item.props : [];
  const events = Array.isArray(item.events) ? item.events : [];
  const locales = item && item.locales && typeof item.locales === "object" ? item.locales : {};

  return {
    hasDescription: hasDescription(item),
    localeCount: Object.values(locales).filter((entry) => entry && entry.name && entry.ariaLabel).length,
    propCount: props.length,
    documentedPropCount: countDocumentedProps(item),
    eventCount: events.length,
    documentedEventCount: countDocumentedEvents(item),
    interactive: hasEvents(item)
  };
}

function scoreQualitySignals(item) {
  const signals = buildQualitySignals(item);
  let score = 0;
  if (signals.hasDescription) score += 12;
  score += Math.min(8, signals.localeCount * 4);
  score += Math.min(12, signals.documentedPropCount * 3);
  score += Math.min(8, signals.documentedEventCount * 4);
  if (signals.interactive) score += 6;
  return { score, signals };
}

function getQualityAssessment(item) {
  const qualityReport = loadQualityReport();
  const qualityEntry = qualityReport && qualityReport.items ? qualityReport.items[item.id] : null;
  if (qualityEntry) {
    return {
      score: Number(qualityEntry.score) || 0,
      signals: {
        ...qualityEntry.signals,
        source: "registry-report"
      },
      reportEnabled: true
    };
  }

  const runtimeAssessment = scoreQualitySignals(item);
  return {
    score: runtimeAssessment.score,
    signals: {
      ...runtimeAssessment.signals,
      source: "runtime-derived"
    },
    reportEnabled: false
  };
}

function deriveComponentInteractionLevel(item) {
  return hasEvents(item) ? "interactive" : "static";
}

function summarizeTagFrequency(items, limit = 8) {
  const counts = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    for (const tag of normalizeArray(item.tags)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function summarizeQuality(items) {
  const assessments = (Array.isArray(items) ? items : []).map((item) => getQualityAssessment(item));
  const scores = assessments.map((entry) => entry.score);
  const total = scores.reduce((sum, value) => sum + value, 0);
  return {
    reportEnabled: assessments.some((entry) => entry.reportEnabled),
    averageScore: scores.length > 0 ? Number((total / scores.length).toFixed(2)) : 0,
    maxScore: scores.length > 0 ? Math.max(...scores) : 0,
    interactiveCount: (Array.isArray(items) ? items : []).filter((item) => hasEvents(item)).length
  };
}

function summarizeDiscoveryItems(items, locale, limit = 8) {
  const categories = new Set();
  for (const item of items) {
    if (item.category) categories.add(item.category);
  }
  const ranked = items
    .map((item) => {
      const quality = getQualityAssessment(item);
      return {
        ...recommendationSummary(item),
        interactionLevel: deriveComponentInteractionLevel(item),
        qualityScore: quality.score,
        qualitySignals: quality.signals
      };
    })
    .sort((a, b) => b.qualityScore - a.qualityScore || Number(b.hasEvents) - Number(a.hasEvents) || a.id.localeCompare(b.id))
    .slice(0, limit);

  return {
    componentCount: items.length,
    categories: Array.from(categories).sort(),
    topTags: summarizeTagFrequency(items),
    qualitySummary: summarizeQuality(items),
    items: ranked
  };
}

function getSubjectCatalogSummary(subject, locale = "en") {
  const normalizedSubject = normalizeText(subject);
  const items = getItems(locale).filter((item) => normalizeText(item.category).startsWith(`${normalizedSubject}/`));
  return {
    subject: normalizedSubject,
    locale: locale || "en",
    ...summarizeDiscoveryItems(items, locale)
  };
}

function getInteractiveCatalogSummary(locale = "en") {
  const items = getItems(locale).filter((item) => hasEvents(item));
  return {
    locale: locale || "en",
    ...summarizeDiscoveryItems(items, locale)
  };
}

function getLessonReadyCatalogSummary(locale = "en") {
  const items = getItems(locale).filter((item) => {
    const quality = getQualityAssessment(item);
    return quality.score >= 24 && hasDescription(item) && countDocumentedProps(item) >= 1;
  });
  return {
    locale: locale || "en",
    ...summarizeDiscoveryItems(items, locale)
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
  const excludeComponentIds = normalizeArray(input.excludeComponentIds);
  const preferInteractive = Boolean(input.preferInteractive);
  const requiredInteractionLevel = String(input.requiredInteractionLevel || "").trim() || null;
  const maxPerCategory = Number.isFinite(Number(input.maxPerCategory)) ? Math.max(1, Math.floor(Number(input.maxPerCategory))) : null;
  const limit = clampLimit(input.limit, 5, 10);
  const qualityReportEnabled = Boolean(loadQualityReport());

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
    if (excludeComponentIds.includes(item.id)) continue;
    if (requiredInteractionLevel && deriveComponentInteractionLevel(item) !== requiredInteractionLevel) continue;

    let score = 0;
    const matchDetails = [];
    const scoreBreakdown = {
      preferredCategory: 0,
      subjectAlignment: 0,
      subjectText: 0,
      lessonGoalText: 0,
      audienceText: 0,
      interactionText: 0,
      requiredTags: 0,
      interactionReadiness: 0,
      queryCoverage: 0,
      quality: 0,
      feedback: 0
    };
    const text = collectRecommendationText(item);

    if (preferredCategories.includes(item.category)) {
      score += 140;
      scoreBreakdown.preferredCategory += 140;
      matchDetails.push({ reason: "preferred category", matchedTokens: [item.category] });
    }

    if (normalizeText(item.category).includes(normalizeText(subject)) && subject) {
      score += 120;
      scoreBreakdown.subjectAlignment += 120;
      matchDetails.push({ reason: "subject-category alignment", matchedTokens: [subject] });
    }

    scoreBreakdown.subjectText = scoreTokensAgainstText(subjectTokens, text, 34, "subject match", matchDetails);
    score += scoreBreakdown.subjectText;
    scoreBreakdown.lessonGoalText = scoreTokensAgainstText(goalTokens, text, 24, "lesson goal match", matchDetails);
    score += scoreBreakdown.lessonGoalText;
    scoreBreakdown.audienceText = scoreTokensAgainstText(audienceTokens, text, 10, "audience match", matchDetails);
    score += scoreBreakdown.audienceText;
    scoreBreakdown.interactionText = scoreTokensAgainstText(interactionTokens, text, 16, "interaction mode match", matchDetails);
    score += scoreBreakdown.interactionText;

    const tags = normalizeArray(item.tags).map(normalizeText);
    const matchedRequiredTags = mustIncludeTags.filter((tag) => tags.includes(normalizeText(tag)));
    if (mustIncludeTags.length > 0 && matchedRequiredTags.length === 0) continue;
    if (matchedRequiredTags.length > 0) {
      scoreBreakdown.requiredTags = matchedRequiredTags.length * 55;
      score += scoreBreakdown.requiredTags;
      matchDetails.push({ reason: "required tags", matchedTokens: matchedRequiredTags });
    }

    if (hasEvents(item) && /interactive|experiment|simulate|demo/.test(normalizeText(queryText))) {
      score += 45;
      scoreBreakdown.interactionReadiness += 45;
      matchDetails.push({ reason: "interaction-ready", matchedTokens: ["events"] });
    }
    if (preferInteractive && hasEvents(item)) {
      score += 36;
      scoreBreakdown.interactionReadiness += 36;
      matchDetails.push({ reason: "interactive preference", matchedTokens: ["preferInteractive"] });
    }

    if (queryTokens.length > 0) {
      const matchedQueryTokens = queryTokens.filter((token) => text.includes(token));
      if (matchedQueryTokens.length === 0) continue;
      scoreBreakdown.queryCoverage = matchedQueryTokens.length * 6;
      score += scoreBreakdown.queryCoverage;
    }

    const quality = getQualityAssessment(item);
    scoreBreakdown.quality = quality.score;
    score += quality.score;

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
      scoreBreakdown.feedback = feedbackAdjustment.totalBoost;
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
      scoreBreakdown,
      qualitySignals: quality.signals,
      interactionLevel: deriveComponentInteractionLevel(item),
      reasonSummary: matchDetails.map((detail) => detail.reason),
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

  const limitedItems = [];
  const categoryCounts = new Map();
  for (const item of recommendations) {
    if (limitedItems.length >= limit) break;
    if (maxPerCategory) {
      const currentCount = categoryCounts.get(item.category) || 0;
      if (currentCount >= maxPerCategory) continue;
      categoryCounts.set(item.category, currentCount + 1);
    }
    limitedItems.push(item);
  }

  const warnings = [];
  if (limitedItems.length === 0) {
    warnings.push(
      createWarning("no_results", "No components matched the current recommendation constraints.", {
        limit
      })
    );
  }
  if (limitedItems.length > 0 && locale && limitedItems.some((item) => !hasExactLocalePayload(item, locale))) {
    warnings.push(
      createWarning("locale_fallback", "Some recommended components fell back to the default locale.", {
        requestedLocale: normalizeRequestedLocale(locale)
      })
    );
  }

  return {
    ...createResponseMeta("recommend_components", locale, warnings),
    selectionPolicy: {
      rankingModel: "rule-based-v3",
      qualitySignalsIncluded: true,
      qualityReportEnabled,
      feedbackRerankIncluded: true,
      interactivePreferenceApplied: preferInteractive,
      diversityRules: {
        maxPerCategory
      },
      fallbackLocale: "zh-CN"
    },
    appliedConstraints: {
      subject,
      lessonGoal,
      audience: audience || null,
      interactionMode: interactionMode || null,
      mustIncludeTags,
      preferredCategories,
      excludeCategories,
      excludeComponentIds,
      preferInteractive,
      requiredInteractionLevel,
      maxPerCategory,
      limit,
      locale: locale || null
    },
    query: {
      subject,
      lessonGoal,
      customerId: customerId || null,
      audience: audience || null,
      interactionMode: interactionMode || null,
      mustIncludeTags,
      preferredCategories,
      excludeCategories,
      excludeComponentIds,
      locale: locale || null
    },
    items: limitedItems
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
  if (/intro|overview|瀵煎叆|姒傝/.test(normalized)) return "intro";
  if (/experiment|demo|simulation|瀹為獙|婕旂ず|浠跨湡/.test(normalized)) return "interactive";
  if (/analysis|explain|concept|鍘熺悊|瑙ｆ瀽|璁茶В/.test(normalized)) return "explanation";
  if (/practice|exercise|quiz|璁粌|缁冧範/.test(normalized)) return "practice";
  if (/summary|wrap|鎬荤粨|鍥為【/.test(normalized)) return "summary";
  return "content";
}

function inferInteractionLevel(item, sectionType) {
  if (item && hasEvents(item)) return "interactive";
  if (sectionType === "interactive" || sectionType === "practice") return "guided";
  return "static";
}

function inferSlot(sectionType, order) {
  if (sectionType === "interactive") return order === 1 ? "hero" : "interactive";
  if (sectionType === "practice") return "practice";
  if (sectionType === "summary") return "summary";
  return order === 1 ? "intro" : "content";
}

function buildHostRequirements(item, sectionType) {
  const requirements = ["theme-css-vars"];
  if (item && hasEvents(item)) requirements.push("event-listeners");
  if (sectionType === "interactive") requirements.push("above-fold-compatible");
  return requirements;
}

function deriveUsageContexts(component) {
  const contexts = [];
  if (hasEvents(component)) {
    contexts.push("interactive-demo", "guided-practice");
  } else {
    contexts.push("concept-visual", "static-reference");
  }
  if (Array.isArray(component.tags) && component.tags.length > 0) {
    contexts.push("tag-driven-discovery");
  }
  return Array.from(new Set(contexts));
}

function buildIntegrationHints(component) {
  return {
    interactionLevel: inferInteractionLevel(component, hasEvents(component) ? "interactive" : "content"),
    hostRequirements: buildHostRequirements(component, hasEvents(component) ? "interactive" : "content"),
    recommendedSlot: hasEvents(component) ? "interactive" : "content",
    mountStrategy: hasEvents(component) ? "hydrate-and-listen" : "static-or-hydrate",
    eventSupport: hasEvents(component)
      ? {
          hasEvents: true,
          eventCount: eventCount(component)
        }
      : {
          hasEvents: false,
          eventCount: 0
        }
  };
}

function summarizeCoverage(selectedItems, sections) {
  const categories = new Set();
  const interactionLevels = new Set();
  const sectionTypes = new Set();
  const componentIds = [];

  for (const item of Array.isArray(selectedItems) ? selectedItems : []) {
    if (item && item.category) categories.add(item.category);
  }

  for (const section of Array.isArray(sections) ? sections : []) {
    if (section && section.sectionType) sectionTypes.add(section.sectionType);
    if (section && section.interactionLevel) interactionLevels.add(section.interactionLevel);
    if (section && section.recommendedComponentId) componentIds.push(section.recommendedComponentId);
  }

  return {
    selectedComponentCount: Array.isArray(selectedItems) ? selectedItems.length : 0,
    distinctCategoryCount: categories.size,
    duplicateComponentCount: countDuplicateComponentIds(componentIds),
    sectionTypeCount: sectionTypes.size,
    interactionLevelCount: interactionLevels.size,
    categories: Array.from(categories).sort(),
    sectionTypes: Array.from(sectionTypes).sort(),
    interactionLevels: Array.from(interactionLevels).sort()
  };
}

function summarizeBundle(bundleItems) {
  const categories = new Set();
  const interactionLevels = new Set();
  const layoutHints = new Set();
  const sectionTypes = new Set();
  const slots = new Set();
  const componentIds = [];

  for (const item of Array.isArray(bundleItems) ? bundleItems : []) {
    if (item?.component?.category) categories.add(item.component.category);
    if (item?.component?.id) componentIds.push(item.component.id);
    if (item?.interactionLevel) interactionLevels.add(item.interactionLevel);
    if (item?.layoutHint) layoutHints.add(item.layoutHint);
    if (item?.sectionType) sectionTypes.add(item.sectionType);
    if (item?.slot) slots.add(item.slot);
  }

  return {
    itemCount: Array.isArray(bundleItems) ? bundleItems.length : 0,
    distinctCategoryCount: categories.size,
    duplicateComponentCount: countDuplicateComponentIds(componentIds),
    layoutCount: layoutHints.size,
    sectionTypeCount: sectionTypes.size,
    interactionLevelCount: interactionLevels.size,
    slotCount: slots.size,
    categories: Array.from(categories).sort(),
    layoutHints: Array.from(layoutHints).sort(),
    sectionTypes: Array.from(sectionTypes).sort(),
    interactionLevels: Array.from(interactionLevels).sort(),
    slots: Array.from(slots).sort()
  };
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

function findFirstCandidate(candidates, predicate, usedIds, allowReuse = false) {
  for (const item of candidates) {
    if (!predicate(item)) continue;
    if (!allowReuse && usedIds.has(item.id)) continue;
    return item;
  }
  return null;
}

function countDuplicateComponentIds(ids) {
  const counts = new Map();
  for (const id of ids.filter(Boolean)) {
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  let duplicates = 0;
  for (const count of counts.values()) {
    if (count > 1) duplicates += count - 1;
  }
  return duplicates;
}

function assignComponentsToSections(sectionTitles, candidates, options = {}) {
  const maxComponents = options.maxComponents || 4;
  const interactionMode = options.interactionMode || "";
  const lessonGoal = options.lessonGoal || "";
  const pageType = options.pageType || "lesson";
  const usedIds = new Set();
  let duplicateComponentCount = 0;
  let coverageGapCount = 0;

  const sections = sectionTitles.map((title, index) => {
    const sectionType = inferSectionType(title);
    const preferInteractiveSection = sectionType === "interactive" || sectionType === "practice";
    const preferredPredicate = preferInteractiveSection ? (item) => hasEvents(item) : () => true;
    let item = null;

    if (usedIds.size < maxComponents) {
      item =
        findFirstCandidate(candidates, preferredPredicate, usedIds, false) ||
        findFirstCandidate(candidates, () => true, usedIds, false);
    }

    if (!item) {
      item =
        findFirstCandidate(candidates, preferredPredicate, usedIds, true) ||
        findFirstCandidate(candidates, () => true, usedIds, true);
      if (item) duplicateComponentCount += 1;
    }

    if (item) usedIds.add(item.id);
    if (preferInteractiveSection && (!item || !hasEvents(item))) {
      coverageGapCount += 1;
    }

    return {
      order: index + 1,
      title,
      sectionType,
      slot: inferSlot(sectionType, index + 1),
      objective:
        sectionType === "interactive"
          ? `Use a visual component to make ${lessonGoal} concrete.`
          : sectionType === "practice"
            ? `Help learners apply ${lessonGoal} with guided interaction.`
            : `Support the ${pageType} flow around ${lessonGoal}.`,
      recommendedComponentId: item ? item.id : null,
      recommendedComponentReason:
        item
          ? `${item.name} fits because it scored ${item.recommendationScore} and aligns with ${options.subject} + ${lessonGoal}.`
          : "No component selected for this section.",
      interactionLevel: inferInteractionLevel(item, sectionType),
      interactionPattern:
        sectionType === "interactive"
          ? interactionMode || "interactive exploration"
          : sectionType === "practice"
            ? "guided exercise"
            : "content support",
      hostRequirements: buildHostRequirements(item, sectionType)
    };
  });

  const selectedItems = uniqueById(
    sections
      .map((section) => candidates.find((candidate) => candidate.id === section.recommendedComponentId) || null)
      .filter(Boolean)
  ).slice(0, maxComponents);

  return {
    sections,
    selectedItems,
    duplicateComponentCount,
    coverageGapCount
  };
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
    excludeComponentIds: input.excludeComponentIds,
    preferInteractive: true,
    limit: Math.min(Math.max(maxComponents * 3, 8), 12),
    locale
  });
  const sectionTitles = buildSectionTitles(subject, lessonGoal, audience);
  const assigned = assignComponentsToSections(sectionTitles, recommendationResult.items, {
    subject,
    lessonGoal,
    interactionMode,
    pageType,
    maxComponents
  });
  const selectedItems = assigned.selectedItems;
  const sections = assigned.sections;

  const warnings = recommendationResult.warnings ? recommendationResult.warnings.slice() : [];
  if (selectedItems.length === 0) {
    warnings.push(
      createWarning("no_components_selected", "The page plan could not select any components for the requested lesson.", {
        maxComponents
      })
    );
  } else if (selectedItems.length < maxComponents) {
    warnings.push(
      createWarning("low_result_count", "The page plan selected fewer components than requested.", {
        requestedCount: maxComponents,
        selectedCount: selectedItems.length
      })
    );
  }
  if (assigned.duplicateComponentCount > 0) {
    warnings.push(
      createWarning("component_reused", "Some sections reuse the same component because unique candidates were exhausted.", {
        duplicateComponentCount: assigned.duplicateComponentCount
      })
    );
  }
  if (assigned.coverageGapCount > 0) {
    warnings.push(
      createWarning("coverage_gap", "Some interactive or practice sections could not be matched with interactive components.", {
        coverageGapCount: assigned.coverageGapCount
      })
    );
  }

  return {
    ...createResponseMeta("build_experiment_page", locale, warnings),
    page: {
      pageType,
      subject,
      lessonGoal,
      audience: audience || null,
      interactionMode: interactionMode || null,
      locale: locale || null
    },
    coverageSummary: summarizeCoverage(selectedItems, sections),
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
        slot: section.slot || inferSlot(section.sectionType, index + 1),
        interactionLevel: inferInteractionLevel(component, section.sectionType),
        component: {
          id: component.id,
          name: component.name,
          category: component.category,
          tags: component.tags,
          hasEvents: hasEvents(component)
        },
        html: component.html,
        layoutHint: pickBundleLayout(section.sectionType, index),
        hostRequirements: buildHostRequirements(component, section.sectionType),
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

  const warnings = [];
  if (basePlan && Array.isArray(basePlan.warnings) && basePlan.warnings.length > 0) {
    warnings.push(...basePlan.warnings);
  }
  if (bundleItems.length === 0) {
    warnings.push(
      createWarning("empty_bundle", "The bundle did not produce any renderable component items.", {
        requestedCount: maxComponents
      })
    );
  } else if (bundleItems.length < selectedComponents.length) {
    warnings.push(
      createWarning("partial_bundle", "Some selected components were not converted into renderable bundle items.", {
        selectedCount: selectedComponents.length,
        bundledCount: bundleItems.length
      })
    );
  }

  return {
    ...createResponseMeta("compose_experiment_bundle", locale, warnings),
    bundle: {
      pageType,
      subject: subject || null,
      lessonGoal: lessonGoal || null,
      audience: audience || null,
      interactionMode: interactionMode || null,
      locale: locale || null,
      itemCount: bundleItems.length
    },
    bundleSummary: summarizeBundle(bundleItems),
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

function validateExperimentBundle(input = {}) {
  const sections = Array.isArray(input.sections) ? input.sections : [];
  const items = Array.isArray(input.items) ? input.items : [];
  const issues = [];

  if (items.length === 0 && sections.length === 0) {
    issues.push({
      code: "empty_payload",
      severity: "error",
      message: "Either sections or items are required for validation.",
      target: "payload"
    });
  }

  const itemIds = items.map((item) => item?.component?.id).filter(Boolean);
  const sectionIds = sections.map((section) => section?.recommendedComponentId).filter(Boolean);
  if (countDuplicateComponentIds(itemIds) > 0 || countDuplicateComponentIds(sectionIds) > 0) {
    issues.push({
      code: "duplicate_component",
      severity: "error",
      message: "The same component is assigned multiple times.",
      target: "components"
    });
  }

  if (sections.length > 0 && !sections.some((section) => section.sectionType === "interactive")) {
    issues.push({
      code: "missing_interactive_section",
      severity: "warning",
      message: "The page plan does not include an interactive section.",
      target: "sections"
    });
  }

  if (items.length > 0 && !items.some((item) => item.interactionLevel === "interactive")) {
    issues.push({
      code: "missing_interactive_item",
      severity: "warning",
      message: "The bundle does not contain an interactive component item.",
      target: "items"
    });
  }

  const heroCount = items.filter((item) => item.slot === "hero" || item.layoutHint === "hero").length;
  if (heroCount > 1) {
    issues.push({
      code: "slot_layout_conflict",
      severity: "error",
      message: "More than one item claims the hero slot/layout.",
      target: "items"
    });
  }

  if (items.some((item) => !item.slot || !item.layoutHint)) {
    issues.push({
      code: "missing_layout_metadata",
      severity: "error",
      message: "Some bundle items are missing slot or layout metadata.",
      target: "items"
    });
  }

  if (sections.some((section) => !section.slot)) {
    issues.push({
      code: "missing_section_slot",
      severity: "error",
      message: "Some page-plan sections do not declare a slot.",
      target: "sections"
    });
  }

  if (items.some((item) => !Array.isArray(item.hostRequirements) || item.hostRequirements.length === 0) ||
      sections.some((section) => !Array.isArray(section.hostRequirements) || section.hostRequirements.length === 0)) {
    issues.push({
      code: "missing_host_requirements",
      severity: "warning",
      message: "Some sections or bundle items do not declare host requirements.",
      target: items.length > 0 ? "items" : "sections"
    });
  }

  return {
    valid: issues.length === 0,
    issueCount: issues.length,
    issues
  };
}

function getComponent(id, locale = "zh-CN") {
  try {
    const payload = getComponentData(id, locale);
    const warnings = [];
    if (locale && !hasExactLocalePayload(payload.component, locale)) {
      warnings.push(
        createWarning("locale_fallback", "The component response fell back to the default locale.", {
          requestedLocale: normalizeRequestedLocale(locale),
          componentId: id
        })
      );
    }
    return {
      ...createResponseMeta("get_component", locale, warnings),
      integrationHints: buildIntegrationHints(payload.component),
      usageContexts: deriveUsageContexts(payload.component),
      ...payload
    };
  } catch (caughtError) {
    if (!(caughtError && caughtError.code === "COMPONENT_NOT_FOUND")) {
      throw caughtError;
    }
    const notFoundError = new Error(`Component not found: ${id}`);
    notFoundError.code = "COMPONENT_NOT_FOUND";
    notFoundError.data = {
      id,
      suggestions: getSuggestions(id, locale)
    };
    throw notFoundError;
  }
}

export {
  getCategories,
  listComponents,
  searchComponents,
  listVisuals,
  searchVisuals,
  recommendComponents,
  submitRecommendationFeedback,
  getRecommendationFeedbackStats,
  buildExperimentPagePlan,
  composeExperimentBundle,
  validateExperimentBundle,
  getComponent,
  getVisual,
  getVisualCatalogOverview,
  getSuggestions,
  toSummary,
  getSubjectCatalogSummary,
  getInteractiveCatalogSummary,
  getLessonReadyCatalogSummary
};
