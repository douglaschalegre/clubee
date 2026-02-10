import { NextResponse } from "next/server";

const DEFAULT_WINDOW_MS = 60_000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  request: Request;
  identifier?: string | null;
  limit: number;
  windowMs?: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __clubeeRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__clubeeRateLimitStore) {
    globalThis.__clubeeRateLimitStore = new Map();
  }
  return globalThis.__clubeeRateLimitStore;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export function checkRateLimit({
  request,
  identifier,
  limit,
  windowMs = DEFAULT_WINDOW_MS,
}: RateLimitOptions): NextResponse | null {
  const key = identifier ? `user:${identifier}` : `ip:${getClientIp(request)}`;
  const now = Date.now();
  const store = getStore();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;
  store.set(key, entry);

  if (entry.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Muitas requisições" },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }

  return null;
}
