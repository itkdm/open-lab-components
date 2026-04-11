import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createFeedbackBackend } from "../src/feedback/feedback-backends.js";
import { createFeedbackStore } from "../src/feedback/feedback-store.js";

function uniqueSuffix() {
  return `${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

async function roundTripFeedbackStore(store, runtime, feedbackInput) {
  await store.configureBackend(runtime);
  await store.configureDecay(14);
  await store.recordFeedback(feedbackInput);

  const snapshot = store.snapshot();
  const health = await store.healthCheck();

  return { snapshot, health };
}

const redisTest = process.env.REDIS_URL ? test : test.skip;
const postgresTest = process.env.POSTGRES_URL ? test : test.skip;

test("feedback backend factory rejects missing connection details", () => {
  assert.throws(() => createFeedbackBackend({ feedbackStoreBackend: "redis" }), /REDIS_URL is required/);
  assert.throws(() => createFeedbackBackend({ feedbackStoreBackend: "postgres" }), /POSTGRES_URL is required/);
});

redisTest("redis feedback backend persists and reloads state", async () => {
  const key = `open-lab-components:test:${uniqueSuffix()}`;
  const runtime = {
    feedbackStoreBackend: "redis",
    redisUrl: process.env.REDIS_URL,
    redisFeedbackKey: key
  };
  const feedbackInput = {
    componentId: "phy.resistor.axial.basic",
    feedbackType: "saved",
    customerId: "tenant-redis",
    subject: "physics",
    lessonGoal: "resistance lesson"
  };

  const firstStore = createFeedbackStore();
  const firstResult = await roundTripFeedbackStore(firstStore, runtime, feedbackInput);

  assert.equal(firstResult.snapshot.backend, "redis");
  assert.equal(firstResult.snapshot.backendMeta.key, key);
  assert.equal(firstResult.health.ok, true);
  assert.equal(firstResult.health.backend, "redis");

  await firstStore.close();

  const secondStore = createFeedbackStore();
  try {
    await secondStore.configureBackend(runtime);
    const reloaded = secondStore.snapshot();
    const adjustment = secondStore.getAdjustment("phy.resistor.axial.basic", {
      customerId: "tenant-redis",
      subject: "physics",
      lessonGoal: "resistance lesson"
    });

    assert.equal(reloaded.backend, "redis");
    assert.equal(reloaded.backendMeta.key, key);
    assert.equal(reloaded.tenantGlobalScores["tenant-redis"]["phy.resistor.axial.basic"].score, 8);
    assert.ok(adjustment.totalBoost > 0);
  } finally {
    await secondStore.close();
  }
});

postgresTest("postgres feedback backend persists and reloads state", async () => {
  const storeKey = `test_${uniqueSuffix().replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const runtime = {
    feedbackStoreBackend: "postgres",
    postgresUrl: process.env.POSTGRES_URL,
    postgresFeedbackTable: "mcp_feedback_store",
    postgresFeedbackStoreKey: storeKey
  };
  const feedbackInput = {
    componentId: "phy.resistor.axial.basic",
    feedbackType: "selected",
    customerId: "tenant-postgres",
    subject: "physics",
    lessonGoal: "resistance lesson"
  };

  const firstStore = createFeedbackStore();
  const firstResult = await roundTripFeedbackStore(firstStore, runtime, feedbackInput);

  assert.equal(firstResult.snapshot.backend, "postgres");
  assert.equal(firstResult.snapshot.backendMeta.storeKey, storeKey);
  assert.equal(firstResult.health.ok, true);
  assert.equal(firstResult.health.backend, "postgres");

  await firstStore.close();

  const secondStore = createFeedbackStore();
  try {
    await secondStore.configureBackend(runtime);
    const reloaded = secondStore.snapshot();
    const adjustment = secondStore.getAdjustment("phy.resistor.axial.basic", {
      customerId: "tenant-postgres",
      subject: "physics",
      lessonGoal: "resistance lesson"
    });

    assert.equal(reloaded.backend, "postgres");
    assert.equal(reloaded.backendMeta.storeKey, storeKey);
    assert.equal(reloaded.tenantGlobalScores["tenant-postgres"]["phy.resistor.axial.basic"].score, 6);
    assert.ok(adjustment.totalBoost > 0);
  } finally {
    await secondStore.close();
  }
});
