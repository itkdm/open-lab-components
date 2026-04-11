import { createFeedbackBackend } from "./feedback-backends.js";

const FEEDBACK_WEIGHTS = {
  viewed: 1,
  clicked: 3,
  selected: 6,
  saved: 8,
  dismissed: -4,
  hidden: -7
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean).sort();
}

function normalizeTenantId(value) {
  return normalizeText(value) || "public";
}

function buildContextKey({ subject, lessonGoal, audience, interactionMode, preferredCategories, mustIncludeTags } = {}) {
  return JSON.stringify({
    subject: normalizeText(subject),
    lessonGoal: normalizeText(lessonGoal),
    audience: normalizeText(audience),
    interactionMode: normalizeText(interactionMode),
    preferredCategories: normalizeArray(preferredCategories).map(normalizeText),
    mustIncludeTags: normalizeArray(mustIncludeTags).map(normalizeText)
  });
}

function createAggregateRecord() {
  return {
    score: 0,
    lastUpdatedAt: new Date(0).toISOString()
  };
}

function decayScore(record, halfLifeDays, currentTime = Date.now()) {
  if (!record || !record.lastUpdatedAt) return 0;
  const previousTime = Date.parse(record.lastUpdatedAt);
  if (!Number.isFinite(previousTime)) return Number(record.score) || 0;
  const elapsedDays = Math.max(0, (currentTime - previousTime) / 86_400_000);
  const factor = Math.pow(0.5, elapsedDays / halfLifeDays);
  return (Number(record.score) || 0) * factor;
}

function nestedMapToObject(input) {
  return Object.fromEntries(
    Array.from(input.entries()).map(([key, value]) => [
      key,
      value instanceof Map ? nestedMapToObject(value) : value
    ])
  );
}

function createFeedbackStore() {
  const tenantGlobalScores = new Map();
  const tenantContextScores = new Map();
  const tenantEventCounts = new Map();
  let persistencePath = null;
  let halfLifeDays = 30;
  let backend = createFeedbackBackend({ feedbackStoreBackend: "memory" });

  function getTenantGlobalMap(tenantId) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const existing = tenantGlobalScores.get(normalizedTenantId);
    if (existing) return existing;
    const created = new Map();
    tenantGlobalScores.set(normalizedTenantId, created);
    return created;
  }

  function getTenantContextMap(tenantId) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const existing = tenantContextScores.get(normalizedTenantId);
    if (existing) return existing;
    const created = new Map();
    tenantContextScores.set(normalizedTenantId, created);
    return created;
  }

  function getTenantEventMap(tenantId) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const existing = tenantEventCounts.get(normalizedTenantId);
    if (existing) return existing;
    const created = new Map();
    tenantEventCounts.set(normalizedTenantId, created);
    return created;
  }

  function serializeAggregateMap(input) {
    return Object.fromEntries(Array.from(input.entries()).map(([key, record]) => [key, record]));
  }

  function serialize() {
    return {
      halfLifeDays,
      backend: backend.kind,
      tenantGlobalScores: Object.fromEntries(
        Array.from(tenantGlobalScores.entries()).map(([tenantId, scores]) => [tenantId, serializeAggregateMap(scores)])
      ),
      tenantContextScores: Object.fromEntries(
        Array.from(tenantContextScores.entries()).map(([tenantId, contexts]) => [
          tenantId,
          Object.fromEntries(
            Array.from(contexts.entries()).map(([contextKey, scores]) => [contextKey, serializeAggregateMap(scores)])
          )
        ])
      ),
      tenantEventCounts: nestedMapToObject(tenantEventCounts)
    };
  }

  function hydrateAggregateMap(input = {}) {
    return new Map(
      Object.entries(input).map(([key, value]) => [
        key,
        {
          score: Number(value && value.score) || 0,
          lastUpdatedAt: value && value.lastUpdatedAt ? String(value.lastUpdatedAt) : new Date(0).toISOString()
        }
      ])
    );
  }

  function hydrate(payload = {}) {
    tenantGlobalScores.clear();
    tenantContextScores.clear();
    tenantEventCounts.clear();
    if (Number.isFinite(Number(payload.halfLifeDays)) && Number(payload.halfLifeDays) > 0) {
      halfLifeDays = Number(payload.halfLifeDays);
    }

    for (const [tenantId, scores] of Object.entries(payload.tenantGlobalScores || {})) {
      tenantGlobalScores.set(tenantId, hydrateAggregateMap(scores));
    }

    for (const [tenantId, contexts] of Object.entries(payload.tenantContextScores || {})) {
      tenantContextScores.set(
        tenantId,
        new Map(
          Object.entries(contexts || {}).map(([contextKey, scores]) => [contextKey, hydrateAggregateMap(scores)])
        )
      );
    }

    for (const [tenantId, counts] of Object.entries(payload.tenantEventCounts || {})) {
      tenantEventCounts.set(
        tenantId,
        new Map(Object.entries(counts || {}).map(([componentId, count]) => [componentId, Number(count) || 0]))
      );
    }
  }

  async function flush() {
    await backend.save(serialize());
  }

  async function configureBackend(runtime = {}) {
    if (backend && typeof backend.close === "function") {
      await backend.close();
    }
    backend = createFeedbackBackend(runtime);
    persistencePath =
      !runtime.feedbackStoreBackend || runtime.feedbackStoreBackend === "file" ? runtime.feedbackStorePath || null : null;
    const payload = await backend.load();
    if (payload) {
      hydrate(payload);
    } else {
      await flush();
    }
    return snapshot();
  }

  async function configureDecay(days) {
    if (Number.isFinite(Number(days)) && Number(days) > 0) {
      halfLifeDays = Number(days);
      await flush();
    }
    return snapshot();
  }

  function upsertAggregate(map, key, delta, currentTime) {
    const existing = map.get(key) || createAggregateRecord();
    const decayed = decayScore(existing, halfLifeDays, currentTime);
    const nextRecord = {
      score: decayed + delta,
      lastUpdatedAt: new Date(currentTime).toISOString()
    };
    map.set(key, nextRecord);
    return nextRecord;
  }

  async function recordFeedback(input = {}) {
    const componentId = String(input.componentId || "").trim();
    const feedbackType = String(input.feedbackType || "").trim().toLowerCase();
    const signalWeight = Number.isFinite(Number(input.signalWeight)) ? Number(input.signalWeight) : 1;
    const tenantId = normalizeTenantId(input.customerId || input.tenantId);
    const currentTime = Number.isFinite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now();

    if (!componentId) throw new Error("componentId is required");
    if (!Object.prototype.hasOwnProperty.call(FEEDBACK_WEIGHTS, feedbackType)) {
      throw new Error("Unsupported feedbackType");
    }

    const delta = FEEDBACK_WEIGHTS[feedbackType] * signalWeight;
    const contextKey = buildContextKey(input);
    const tenantGlobalMap = getTenantGlobalMap(tenantId);
    const tenantContextMap = getTenantContextMap(tenantId);
    const existingContext = tenantContextMap.get(contextKey) || new Map();
    const globalRecord = upsertAggregate(tenantGlobalMap, componentId, delta, currentTime);
    const contextRecord = upsertAggregate(existingContext, componentId, delta, currentTime);
    tenantContextMap.set(contextKey, existingContext);

    const eventMap = getTenantEventMap(tenantId);
    eventMap.set(componentId, (eventMap.get(componentId) || 0) + 1);
    await flush();

    return {
      tenantId,
      componentId,
      feedbackType,
      delta,
      contextKey,
      totalGlobalScore: globalRecord.score,
      totalContextScore: contextRecord.score,
      eventCount: eventMap.get(componentId)
    };
  }

  function getAdjustment(componentId, context = {}) {
    const normalizedComponentId = String(componentId || "").trim();
    const tenantId = normalizeTenantId(context.customerId || context.tenantId);
    const contextKey = buildContextKey(context);
    const currentTime = Number.isFinite(Number(context.timestamp)) ? Number(context.timestamp) : Date.now();
    const contextMap = getTenantContextMap(tenantId).get(contextKey);
    const contextRecord = contextMap ? contextMap.get(normalizedComponentId) : null;
    const globalRecord = getTenantGlobalMap(tenantId).get(normalizedComponentId);
    const contextBoost = contextRecord ? decayScore(contextRecord, halfLifeDays, currentTime) : 0;
    const globalBoost = globalRecord ? decayScore(globalRecord, halfLifeDays, currentTime) : 0;

    return {
      tenantId,
      contextKey,
      contextBoost,
      globalBoost,
      totalBoost: contextBoost * 3 + globalBoost,
      eventCount: getTenantEventMap(tenantId).get(normalizedComponentId) || 0,
      halfLifeDays
    };
  }

  function snapshot() {
    return {
      persistencePath,
      backend: backend.kind,
      backendMeta: backend.meta || null,
      halfLifeDays,
      tenantCount: tenantGlobalScores.size,
      trackedComponents: Array.from(tenantGlobalScores.values()).reduce((sum, scores) => sum + scores.size, 0),
      tenantGlobalScores: Object.fromEntries(
        Array.from(tenantGlobalScores.entries()).map(([tenantId, scores]) => [tenantId, serializeAggregateMap(scores)])
      ),
      tenantEventCounts: nestedMapToObject(tenantEventCounts)
    };
  }

  async function reset() {
    tenantGlobalScores.clear();
    tenantContextScores.clear();
    tenantEventCounts.clear();
    await flush();
  }

  return {
    configureBackend,
    configureDecay,
    recordFeedback,
    getAdjustment,
    snapshot,
    reset,
    async healthCheck() {
      try {
        if (backend && typeof backend.healthCheck === "function") {
          const detail = await backend.healthCheck();
          return {
            ok: true,
            backend: backend.kind,
            detail
          };
        }
        return {
          ok: true,
          backend: backend.kind,
          detail: null
        };
      } catch (error) {
        return {
          ok: false,
          backend: backend.kind,
          error: error && error.message ? error.message : String(error)
        };
      }
    },
    async close() {
      if (backend && typeof backend.close === "function") {
        await backend.close();
      }
    }
  };
}

const feedbackStore = createFeedbackStore();

export { FEEDBACK_WEIGHTS, buildContextKey, createFeedbackStore, feedbackStore };
