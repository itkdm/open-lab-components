import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExperimentPagePlan,
  composeExperimentBundle,
  getComponent,
  recommendComponents
} from "../src/tools/catalog.js";
import { feedbackStore } from "../src/feedback/feedback-store.js";

const RESPONSE_SCHEMA_VERSION = "openlab-mcp-response/v1";

test.afterEach(async () => {
  await feedbackStore.reset();
});

function assertResponseEnvelope(payload, responseType, expectedLocale) {
  assert.equal(payload.schemaVersion, RESPONSE_SCHEMA_VERSION);
  assert.equal(payload.responseType, responseType);
  assert.equal(typeof payload.generatedAt, "string");
  assert.equal(payload.localeApplied, expectedLocale);
  assert.ok(Array.isArray(payload.warnings));
  assert.deepEqual(payload.source, {
    kind: "open-lab-components-catalog",
    package: "@itkdm/open-lab-components-mcp"
  });
}

test("recommend_components contract stays stable", () => {
  const result = recommendComponents({
    subject: "physics",
    lessonGoal: "interactive circuit demonstration for resistance concepts",
    interactionMode: "interactive demo",
    mustIncludeTags: ["resistor"],
    preferredCategories: ["physics/circuit"],
    locale: "en",
    limit: 2
  });

  assertResponseEnvelope(result, "recommend_components", "en");
  assert.ok(Array.isArray(result.items));
  assert.ok(result.items.length > 0);
  const first = result.items[0];
  assert.equal(typeof first.id, "string");
  assert.equal(typeof first.recommendationScore, "number");
  assert.equal(typeof first.scoreBreakdown, "object");
  assert.equal(typeof first.qualitySignals, "object");
  assert.ok(Array.isArray(first.reasonSummary));
  assert.ok(Array.isArray(first.recommendationReasons));
  assert.equal(typeof first.feedbackAdjustment, "object");
});

test("build_experiment_page contract stays stable", () => {
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

  assertResponseEnvelope(result, "build_experiment_page", "en");
  assert.equal(typeof result.page, "object");
  assert.ok(Array.isArray(result.selectedComponents));
  assert.ok(Array.isArray(result.sections));
  assert.equal(typeof result.sections[0].slot, "string");
  assert.equal(typeof result.sections[0].interactionLevel, "string");
  assert.ok(Array.isArray(result.sections[0].hostRequirements));
  assert.ok(Array.isArray(result.implementationNotes));
  assert.ok(Array.isArray(result.assemblySteps));
});

test("compose_experiment_bundle contract stays stable", () => {
  const result = composeExperimentBundle({
    subject: "physics",
    lessonGoal: "show resistor behavior with a guided lesson flow",
    audience: "middle-school students",
    interactionMode: "interactive demo",
    preferredCategories: ["physics/circuit"],
    mustIncludeTags: ["resistor"],
    locale: "en"
  });

  assertResponseEnvelope(result, "compose_experiment_bundle", "en");
  assert.equal(typeof result.bundle, "object");
  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.items[0].slot, "string");
  assert.equal(typeof result.items[0].interactionLevel, "string");
  assert.ok(Array.isArray(result.items[0].hostRequirements));
  assert.ok(Array.isArray(result.renderOrder));
  assert.ok(Array.isArray(result.hostInstructions));
});

test("get_component contract stays stable", () => {
  const result = getComponent("phy.resistor.axial.basic", "en");

  assertResponseEnvelope(result, "get_component", "en");
  assert.equal(typeof result.component, "object");
  assert.equal(result.component.id, "phy.resistor.axial.basic");
  assert.equal(typeof result.component.html, "string");
  assert.equal(typeof result.component.sourcePath, "string");
  assert.equal(typeof result.component.locales, "object");
  assert.equal(typeof result.integrationHints, "object");
  assert.ok(Array.isArray(result.usageContexts));
});
