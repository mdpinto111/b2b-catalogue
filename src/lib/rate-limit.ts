// Fixed-window, in-memory rate limiter. Good enough for a single instance; a
// multi-instance deployment would need a shared store such as Redis.
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return true;
  }
  w.count += 1;
  return w.count <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function resetRateLimits() {
  windows.clear();
}
