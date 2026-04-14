import test from "node:test";
import assert from "node:assert/strict";
import {
  getCategories,
  listComponents,
  searchComponents,
  recommendComponents,
  submitRecommendationFeedback,
  getRecommendationFeedbackStats,
  buildExperimentPagePlan,
  composeExperimentBundle,
  getComponent
} from "../src/tools/catalog.js";
import { createFeedbackStore, feedbackStore } from "../src/feedback/feedback-store.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lab = require("../../index.js");
const RESPONSE_SCHEMA_VERSION = "openlab-mcp-response/v1";

test.afterEach(async () => {
  await feedbackStore.reset();
});

test("get_categories returns counts that sum to registry count", () => {
  const categories = getCategories();
  const total = categories.reduce((sum, item) => sum + item.count, 0);

  assert.ok(categories.length > 0);
  assert.equal(total, lab.registry.count);
});

test("list_components filters by category and omits html", () => {
  const result = listComponents({ category: "physics/mechanics", limit: 5 });
  assert.ok(result.total > 0);
  assert.ok(result.items.length <= 5);
  for (const item of result.items) {
    assert.equal(item.category, "physics/mechanics");
    assert.equal(Object.prototype.hasOwnProperty.call(item, "html"), false);
  }
});

test("list_components localizes names and tags", () => {
  const result = listComponents({ category: "physics/circuit", limit: 20, locale: "en" });
  const resistor = result.items.find((item) => item.id === "phy.resistor.axial.basic");
  assert.ok(resistor);
  assert.equal(resistor.name, "Axial Resistor");
  assert.ok(resistor.tags.includes("resistor"));
});

test("list_components filters hasEvents deterministically", () => {
  const withEvents = listComponents({ hasEvents: true, limit: 10 });
  assert.ok(withEvents.items.length > 0);
  for (const item of withEvents.items) {
    assert.equal(item.hasEvents, true);
    assert.ok(item.eventCount > 0);
  }
});

test("search_components ranks exact id matches first", () => {
  const result = searchComponents({ query: "phy.mechanics.projectile.interactive", limit: 5 });
  assert.ok(result.items.length > 0);
  assert.equal(result.items[0].id, "phy.mechanics.projectile.interactive");
  assert.equal(result.items[0].matchReason, "exact id");
});

test("search_components rejects empty query", () => {
  assert.throws(() => searchComponents({ query: "" }), /query is required/);
});

test("recommend_components returns explainable ranked recommendations", () => {
  const result = recommendComponents({
    subject: "physics",
    lessonGoal: "interactive circuit demonstration for resistance concepts",
    interactionMode: "interactive demo",
    mustIncludeTags: ["resistor"],
    preferredCategories: ["physics/circuit"],
    locale: "en",
    limit: 3
  });

  assert.equal(result.schemaVersion, RESPONSE_SCHEMA_VERSION);
  assert.equal(result.responseType, "recommend_components");
  assert.equal(result.localeApplied, "en");
  assert.ok(Array.isArray(result.warnings));
  assert.equal(result.source.kind, "open-lab-components-catalog");
  assert.ok(result.items.length > 0);
  assert.equal(result.items[0].category, "physics/circuit");
  assert.ok(result.items[0].tags.includes("resistor"));
  assert.equal(typeof result.items[0].recommendationScore, "number");
  assert.equal(typeof result.items[0].scoreBreakdown, "object");
  assert.equal(typeof result.items[0].qualitySignals, "object");
  assert.ok(Array.isArray(result.items[0].reasonSummary));
  assert.ok(result.items[0].scoreBreakdown.requiredTags > 0);
  assert.ok(result.items[0].scoreBreakdown.quality > 0);
  assert.equal(typeof result.items[0].qualitySignals.interactive, "boolean");
  assert.ok(result.items[0].qualitySignals.localeCount >= 1);
  assert.ok(Array.isArray(result.items[0].recommendationReasons));
});

test("recommend_components requires subject and lessonGoal", () => {
  assert.throws(() => recommendComponents({ subject: "", lessonGoal: "" }), /subject and lessonGoal are required/);
});

test("recommend_components reranks based on feedback signals", async () => {
  const before = recommendComponents({
    subject: "physics",
    lessonGoal: "interactive circuit demonstration for resistance concepts",
    interactionMode: "interactive demo",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["resistor"],
    locale: "en",
    limit: 10
  });

  const targetId = "phy.resistor.axial.basic";
  const beforeIndex = before.items.findIndex((item) => item.id === targetId);
  assert.ok(beforeIndex >= 0);

  await submitRecommendationFeedback({
    componentId: targetId,
    feedbackType: "selected",
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "interactive circuit demonstration for resistance concepts",
    interactionMode: "interactive demo",
    preferredCategories: ["physics/circuit"]
  });

  const after = recommendComponents({
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "interactive circuit demonstration for resistance concepts",
    interactionMode: "interactive demo",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["resistor"],
    locale: "en",
    limit: 10
  });
  const afterIndex = after.items.findIndex((item) => item.id === targetId);

  assert.ok(afterIndex >= 0);
  assert.ok(after.items[afterIndex].feedbackAdjustment.totalBoost > 0);
  assert.ok(after.items[afterIndex].scoreBreakdown.feedback > 0);
  assert.ok(afterIndex <= beforeIndex);
});

test("feedback is isolated across tenants", async () => {
  await submitRecommendationFeedback({
    componentId: "phy.resistor.axial.basic",
    feedbackType: "saved",
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "resistance lesson"
  });

  const tenantA = recommendComponents({
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "resistance lesson",
    mustIncludeTags: ["resistor"],
    locale: "en"
  });
  const tenantB = recommendComponents({
    customerId: "tenant-b",
    subject: "physics",
    lessonGoal: "resistance lesson",
    mustIncludeTags: ["resistor"],
    locale: "en"
  });

  assert.ok(tenantA.items[0].feedbackAdjustment.totalBoost > 0);
  assert.equal(tenantB.items[0].feedbackAdjustment.totalBoost, 0);
});

test("build_experiment_page returns a structured page plan", () => {
  const result = buildExperimentPagePlan({
    subject: "physics",
    lessonGoal: "help students understand resistor behavior in a circuit",
    audience: "middle-school students",
    interactionMode: "interactive demo",
    pageType: "lesson",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["resistor"],
    locale: "en"
  });

  assert.equal(result.schemaVersion, RESPONSE_SCHEMA_VERSION);
  assert.equal(result.responseType, "build_experiment_page");
  assert.equal(result.localeApplied, "en");
  assert.equal(result.page.subject, "physics");
  assert.ok(Array.isArray(result.sections));
  assert.ok(result.sections.length >= 4);
  assert.equal(typeof result.sections[0].slot, "string");
  assert.equal(typeof result.sections[0].interactionLevel, "string");
  assert.ok(Array.isArray(result.sections[0].hostRequirements));
  assert.ok(Array.isArray(result.selectedComponents));
  assert.ok(Array.isArray(result.assemblySteps));
});

test("compose_experiment_bundle returns render-ready bundle items", () => {
  const result = composeExperimentBundle({
    subject: "physics",
    lessonGoal: "show resistor behavior with a guided lesson flow",
    audience: "middle-school students",
    interactionMode: "interactive demo",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["resistor"],
    locale: "en"
  });

  assert.equal(result.schemaVersion, RESPONSE_SCHEMA_VERSION);
  assert.equal(result.responseType, "compose_experiment_bundle");
  assert.equal(result.localeApplied, "en");
  assert.equal(typeof result.bundle.itemCount, "number");
  assert.ok(Array.isArray(result.items));
  assert.ok(result.items.length > 0);
  assert.equal(typeof result.items[0].slot, "string");
  assert.equal(typeof result.items[0].interactionLevel, "string");
  assert.ok(Array.isArray(result.items[0].hostRequirements));
  assert.ok(result.items[0].html.includes("data-cmp-id"));
  assert.ok(Array.isArray(result.renderOrder));
});

test("compose_experiment_bundle supports explicit component ids", () => {
  const result = composeExperimentBundle({
    componentIds: ["phy.resistor.axial.basic"],
    locale: "en"
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].component.id, "phy.resistor.axial.basic");
});

test("feedback stats expose reranking aggregates", async () => {
  await submitRecommendationFeedback({
    componentId: "phy.resistor.axial.basic",
    feedbackType: "clicked",
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "resistance lesson"
  });

  const result = getRecommendationFeedbackStats();
  assert.equal(result.feedback.tenantCount, 1);
  assert.equal(result.feedback.tenantEventCounts["tenant-a"]["phy.resistor.axial.basic"], 1);
});

test("feedback store persists to disk and reloads", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "olc-feedback-"));
  const storePath = path.join(tempDir, "feedback.json");
  const firstStore = createFeedbackStore();
  const secondStore = createFeedbackStore();

  await firstStore.configureBackend({ feedbackStoreBackend: "file", feedbackStorePath: storePath });
  await firstStore.configureDecay(30);
  await firstStore.recordFeedback({
    componentId: "phy.resistor.axial.basic",
    feedbackType: "saved",
    customerId: "tenant-a",
    subject: "physics",
    lessonGoal: "resistance lesson"
  });

  const persisted = JSON.parse(fs.readFileSync(storePath, "utf8"));
  assert.equal(persisted.tenantGlobalScores["tenant-a"]["phy.resistor.axial.basic"].score, 8);

  await secondStore.configureBackend({ feedbackStoreBackend: "file", feedbackStorePath: storePath });
  const reloaded = secondStore.snapshot();
  assert.equal(reloaded.tenantGlobalScores["tenant-a"]["phy.resistor.axial.basic"].score, 8);
  await firstStore.close();
  await secondStore.close();
});

test("feedback decay reduces old boosts over time", async () => {
  const store = createFeedbackStore();
  await store.configureBackend({ feedbackStoreBackend: "memory" });
  await store.configureDecay(1);
  const now = Date.UTC(2026, 0, 10);
  await store.recordFeedback({
    componentId: "phy.resistor.axial.basic",
    feedbackType: "saved",
    customerId: "tenant-a",
    timestamp: now - 86_400_000
  });

  const adjustment = store.getAdjustment("phy.resistor.axial.basic", {
    customerId: "tenant-a",
    timestamp: now
  });

  assert.ok(adjustment.totalBoost < 32);
  assert.ok(adjustment.totalBoost > 0);
  await store.close();
});

test("get_component returns full html and registry fields", () => {
  const result = getComponent("phy.mechanics.projectile.interactive");
  assert.equal(result.schemaVersion, RESPONSE_SCHEMA_VERSION);
  assert.equal(result.responseType, "get_component");
  assert.equal(result.localeApplied, "zh-CN");
  assert.ok(Array.isArray(result.warnings));
  assert.equal(result.component.id, "phy.mechanics.projectile.interactive");
  assert.match(result.component.html, /data-cmp-id="phy\.mechanics\.projectile\.interactive"/);
  assert.equal(typeof result.component.sourcePath, "string");
  assert.equal(result.component.sourcePath.includes("\\"), false);
  assert.equal(typeof result.integrationHints, "object");
  assert.ok(Array.isArray(result.usageContexts));
});

test("get_component returns localized fields with locale option", () => {
  const result = getComponent("phy.resistor.axial.basic", "en");
  assert.equal(result.component.name, "Axial Resistor");
  assert.equal(result.component.ariaLabel, "Axial resistor");
  assert.ok(result.component.locales["zh-CN"]);
  assert.deepEqual(result.warnings, []);
  assert.equal(typeof result.integrationHints.recommendedSlot, "string");
  assert.equal(typeof result.integrationHints.mountStrategy, "string");
  assert.equal(typeof result.integrationHints.eventSupport, "object");
  assert.ok(Array.isArray(result.integrationHints.hostRequirements));
  assert.ok(result.usageContexts.length > 0);
});

test("get_component emits locale fallback warning when requested locale is unavailable", () => {
  const result = getComponent("phy.resistor.axial.basic", "fr-FR");
  assert.equal(result.component.name, "电阻");
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, "locale_fallback");
  assert.equal(result.warnings[0].requestedLocale, "fr-FR");
});

test("recommend_components emits no_results warning when filters exclude all components", () => {
  const result = recommendComponents({
    subject: "physics",
    lessonGoal: "interactive circuit demonstration",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["non-existent-tag"],
    locale: "en"
  });

  assert.equal(result.items.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, "no_results");
});

test("get_component unknown id returns suggestions metadata", () => {
  assert.throws(
    () => getComponent("phy.mechanics.projectile.missing"),
    (error) => {
      assert.equal(error.code, "COMPONENT_NOT_FOUND");
      assert.equal(error.data.id, "phy.mechanics.projectile.missing");
      assert.ok(Array.isArray(error.data.suggestions));
      assert.ok(error.data.suggestions.length <= 5);
      return true;
    }
  );
});
