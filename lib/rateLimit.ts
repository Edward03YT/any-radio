interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      const recent = record.timestamps.filter(ts => now - ts < WINDOW_MS);
      if (recent.length === 0) {
        rateLimitStore.delete(ip);
      } else {
        rateLimitStore.set(ip, { timestamps: recent });
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { timestamps: [] };

  // Keep only timestamps within the current sliding window
  const validTimestamps = record.timestamps.filter(ts => now - ts < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    const oldest = validTimestamps[0];
    const resetInSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(ip, { timestamps: validTimestamps });

  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - validTimestamps.length,
    resetInSeconds: Math.ceil(WINDOW_MS / 1000),
  };
}
