import { createRequire } from "node:module";
import { feedbackStore } from "../feedback/feedback-store.js";

const require = createRequire(import.meta.url);
const catalog = require("../../../lib/catalog.js");
const MCP_RESPONSE_SCHEMA_VERSION = "openlab-mcp-response/v1";
const SOURCE_INFO = Object.freeze({
  kind: "open-lab-components-catalog",
  package: "@itkdm/open-lab-components-mcp"
});

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

    if (hasEvents(item) && /interactive|experiment|simulate|demo|拖拽|交互|实验|演示/i.test(queryText)) {
      score += 45;
      scoreBreakdown.interactionReadiness += 45;
      matchDetails.push({ reason: "interaction-ready", matchedTokens: ["events"] });
    }

    if (queryTokens.length > 0) {
      const matchedQueryTokens = queryTokens.filter((token) => text.includes(token));
      if (matchedQueryTokens.length === 0) continue;
      scoreBreakdown.queryCoverage = matchedQueryTokens.length * 6;
      score += scoreBreakdown.queryCoverage;
    }

    const quality = scoreQualitySignals(item);
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

  const limitedItems = recommendations.slice(0, limit);
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
      rankingModel: "rule-based-v2",
      qualitySignalsIncluded: true,
      feedbackRerankIncluded: true,
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
  if (/intro|overview|导入|概览/.test(normalized)) return "intro";
  if (/experiment|demo|simulation|实验|演示|仿真/.test(normalized)) return "interactive";
  if (/analysis|explain|concept|原理|解析|讲解/.test(normalized)) return "explanation";
  if (/practice|exercise|quiz|训练|练习/.test(normalized)) return "practice";
  if (/summary|wrap|总结|回顾/.test(normalized)) return "summary";
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
          ? `${item.name} fits because it scored ${item.recommendationScore} and aligns with ${subject} + ${lessonGoal}.`
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
  recommendComponents,
  submitRecommendationFeedback,
  getRecommendationFeedbackStats,
  buildExperimentPagePlan,
  composeExperimentBundle,
  getComponent,
  getSuggestions,
  toSummary
};
