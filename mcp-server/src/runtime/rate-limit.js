function createRateLimiter() {
  const buckets = new Map();

  function check(customerId, policy) {
    const now = Date.now();
    const windowStart = now - 60_000;
    const max = Math.max(1, policy.requestsPerMinute + (policy.burst || 0));
    const existing = buckets.get(customerId) || [];
    const recent = existing.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= max) {
      buckets.set(customerId, recent);
      const oldestRelevant = recent[0] || now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestRelevant + 60_000 - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        limit: max,
        remaining: 0
      };
    }

    recent.push(now);
    buckets.set(customerId, recent);
    return {
      allowed: true,
      limit: max,
      remaining: Math.max(0, max - recent.length)
    };
  }

  function snapshot(policyByCustomer = {}) {
    const now = Date.now();
    const windowStart = now - 60_000;

    return Object.fromEntries(
      Array.from(buckets.entries()).map(([customerId, timestamps]) => {
        const recent = timestamps.filter((timestamp) => timestamp > windowStart);
        const policy = policyByCustomer[customerId] || {};
        const limit = Math.max(1, Number(policy.requestsPerMinute || 0) + Number(policy.burst || 0) || 1);
        return [
          customerId,
          {
            limit,
            used: recent.length,
            remaining: Math.max(0, limit - recent.length),
            retryAfterSeconds: recent.length >= limit ? Math.max(1, Math.ceil(((recent[0] || now) + 60_000 - now) / 1000)) : 0
          }
        ];
      })
    );
  }

  return { check, snapshot };
}

export { createRateLimiter };
