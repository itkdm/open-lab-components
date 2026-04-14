function incrementCounter(store, key, amount = 1) {
  store.set(key, (store.get(key) || 0) + amount);
}

function mapToObject(store) {
  return Object.fromEntries(Array.from(store.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function buildAdminWriteSummary(store) {
  const summary = {};
  for (const [key, count] of store.entries()) {
    const [action, outcome, category] = String(key).split(":");
    if (!summary[action]) summary[action] = {};
    if (!summary[action][outcome]) summary[action][outcome] = {};
    summary[action][outcome][category || "none"] = count;
  }
  return Object.fromEntries(Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)));
}

function buildCounterSummary(store) {
  return Object.fromEntries(Array.from(store.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function createMetricsStore() {
  const startedAt = Date.now();
  const requestsByRoute = new Map();
  const requestsByCustomer = new Map();
  const requestsByTool = new Map();
  const requestsByToolStatus = new Map();
  const errorCounts = new Map();
  const feedbackEvents = new Map();
  const adminWrites = new Map();
  const remoteMcpErrors = new Map();
  const remoteMcpErrorCodes = new Map();
  let activeSessions = 0;
  let totalSessionsCreated = 0;

  return {
    recordHttpRequest({ route, customerId, status, toolName }) {
      incrementCounter(requestsByRoute, `${route}:${status}`);
      if (customerId) incrementCounter(requestsByCustomer, customerId);
      if (toolName) {
        incrementCounter(requestsByTool, toolName);
        incrementCounter(requestsByToolStatus, `${toolName}:${status}`);
      }
      if (status >= 400) incrementCounter(errorCounts, String(status));
    },
    recordFeedbackEvent(feedbackType) {
      if (feedbackType) incrementCounter(feedbackEvents, String(feedbackType));
    },
    recordAdminWrite({ action, outcome, category }) {
      if (!action || !outcome) return;
      incrementCounter(adminWrites, `${action}:${outcome}:${category || "none"}`);
    },
    recordRemoteMcpError({ category, code }) {
      incrementCounter(remoteMcpErrors, category || "runtime");
      if (code) incrementCounter(remoteMcpErrorCodes, String(code));
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
        requestsByTool: mapToObject(requestsByTool),
        requestsByToolStatus: mapToObject(requestsByToolStatus),
        feedbackEvents: mapToObject(feedbackEvents),
        adminWrites: mapToObject(adminWrites),
        adminWriteSummary: buildAdminWriteSummary(adminWrites),
        remoteMcpErrors: mapToObject(remoteMcpErrors),
        remoteMcpErrorSummary: buildCounterSummary(remoteMcpErrors),
        remoteMcpErrorCodes: mapToObject(remoteMcpErrorCodes),
        errorCounts: mapToObject(errorCounts),
        ...extra
      };
    }
  };
}

export { createMetricsStore };
