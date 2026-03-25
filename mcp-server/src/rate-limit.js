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
      return {
        allowed: false,
        retryAfterSeconds: 60
      };
    }

    recent.push(now);
    buckets.set(customerId, recent);
    return {
      allowed: true,
      remaining: Math.max(0, max - recent.length)
    };
  }

  return { check };
}

export { createRateLimiter };
