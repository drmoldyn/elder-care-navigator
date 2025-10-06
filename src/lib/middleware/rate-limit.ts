import { NextRequest } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// Simple in-memory rate limiter (replace with Redis/Upstash for production)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  max: number;
  /**
   * Window size in milliseconds
   */
  windowMs: number;
  /**
   * Identifier to use for rate limiting (defaults to IP)
   */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Simple token bucket rate limiter
 * Returns true if request should be allowed, false if rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientIP(request);

  const now = Date.now();
  const bucket = store[key];

  // First request or bucket expired
  if (!bucket || now > bucket.resetAt) {
    store[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: store[key].resetAt,
    };
  }

  // Increment count
  bucket.count++;

  if (bucket.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.max - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * Extract client IP from request headers
 * Supports common proxy headers (X-Forwarded-For, X-Real-IP)
 */
function getClientIP(request: NextRequest): string {
  // Check common proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default if IP can't be determined
  return "unknown";
}

/**
 * Cleanup expired buckets (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}

// Auto-cleanup every 10 minutes in production
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
}
