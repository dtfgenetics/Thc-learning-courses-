export function createFixedWindowRateLimiter({ limit = 120, windowMs = 60_000, now = () => Date.now() } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('rate limit must be a positive integer');
  if (!Number.isInteger(windowMs) || windowMs < 1) throw new Error('rate limit windowMs must be a positive integer');

  const buckets = new Map();

  return {
    check(key) {
      const timestamp = now();
      let bucket = buckets.get(key);
      if (!bucket || timestamp >= bucket.resetAt) {
        bucket = { count: 0, resetAt: timestamp + windowMs };
        buckets.set(key, bucket);
      }

      if (bucket.count >= limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: bucket.resetAt,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1000))
        };
      }

      bucket.count += 1;
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
        retryAfterSeconds: 0
      };
    },
    clear() {
      buckets.clear();
    }
  };
}
