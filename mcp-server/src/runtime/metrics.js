function incrementCounter(store, key, amount = 1) {
  store.set(key, (store.get(key) || 0) + amount);
}

function mapToObject(store) {
  return Object.fromEntries(Array.from(store.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function createMetricsStore() {
  const startedAt = Date.now();
  const requestsByRoute = new Map();
  const requestsByCustomer = new Map();
  const toolCalls = new Map();
  const errorCounts = new Map();
  const feedbackEvents = new Map();
  let activeSessions = 0;
  let totalSessionsCreated = 0;

  return {
    recordHttpRequest({ route, customerId, status, toolName }) {
      incrementCounter(requestsByRoute, `${route}:${status}`);
      if (customerId) incrementCounter(requestsByCustomer, customerId);
      if (toolName) incrementCounter(toolCalls, toolName);
      if (status >= 400) incrementCounter(errorCounts, String(status));
    },
    recordFeedbackEvent(feedbackType) {
      if (feedbackType) incrementCounter(feedbackEvents, String(feedbackType));
    },
    recordSessionCreated() {
      activeSessions += 1;
      totalSessionsCreated += 1;
    },
    recordSessionClosed() {
      activeSessions = Math.max(0, activeSessions - 1);
    },
    snapshot(extra = {}) {
      return {
        startedAt: new Date(startedAt).toISOString(),
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        activeSessions,
        totalSessionsCreated,
        requestsByRoute: mapToObject(requestsByRoute),
        requestsByCustomer: mapToObject(requestsByCustomer),
        toolCalls: mapToObject(toolCalls),
        feedbackEvents: mapToObject(feedbackEvents),
        errorCounts: mapToObject(errorCounts),
        ...extra
      };
    }
  };
}

export { createMetricsStore };
