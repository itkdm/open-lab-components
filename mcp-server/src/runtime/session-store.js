async function closeSession(session) {
  if (!session) return;
  try {
    await session.transport.close();
  } catch {
    // Best-effort cleanup for already-closed transports.
  }
}

function createSessionStore({ ttlMs = 30 * 60 * 1000, maxSessionsPerCustomer = 5, onExpired } = {}) {
  const sessions = new Map();

  function now() {
    return Date.now();
  }

  function touch(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    session.lastSeenAt = now();
    return session;
  }

  function activeCountForCustomer(customerId) {
    let count = 0;
    for (const session of sessions.values()) {
      if (session.customerId === customerId) count += 1;
    }
    return count;
  }

  async function deleteSession(sessionId, reason = "closed") {
    const session = sessions.get(sessionId);
    if (!session) return false;
    sessions.delete(sessionId);
    await closeSession(session);
    if (typeof onExpired === "function") onExpired(session, reason);
    return true;
  }

  async function cleanupExpiredSessions() {
    const cutoff = now() - ttlMs;
    const expiredSessionIds = [];

    for (const [sessionId, session] of sessions.entries()) {
      if (session.lastSeenAt < cutoff) expiredSessionIds.push(sessionId);
    }

    for (const sessionId of expiredSessionIds) {
      await deleteSession(sessionId, "expired");
    }
  }

  function createSession(sessionId, value) {
    if (activeCountForCustomer(value.customerId) >= maxSessionsPerCustomer) {
      return { ok: false, code: "session_limit_exceeded" };
    }

    const currentTime = now();
    sessions.set(sessionId, {
      ...value,
      createdAt: currentTime,
      lastSeenAt: currentTime
    });
    return { ok: true, session: sessions.get(sessionId) };
  }

  function getSession(sessionId) {
    return sessions.get(sessionId) || null;
  }

  async function closeAll() {
    const sessionIds = Array.from(sessions.keys());
    for (const sessionId of sessionIds) {
      await deleteSession(sessionId, "shutdown");
    }
  }

  function snapshot() {
    return {
      total: sessions.size,
      byCustomer: Array.from(sessions.values()).reduce((acc, session) => {
        acc[session.customerId] = (acc[session.customerId] || 0) + 1;
        return acc;
      }, {})
    };
  }

  return {
    createSession,
    getSession,
    touch,
    deleteSession,
    cleanupExpiredSessions,
    closeAll,
    snapshot
  };
}

export { createSessionStore };
