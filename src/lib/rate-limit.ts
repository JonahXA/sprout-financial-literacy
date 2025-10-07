/**
 * Simple in-memory rate limiter
 * For production, consider Redis-based solution like ioredis or upstash
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  max: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if request should be rate limited
 * @param key Unique identifier (e.g., IP address, user ID)
 * @param config Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No entry or entry expired - allow request
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    })

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      reset: now + config.windowMs
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.max) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      reset: entry.resetAt
    }
  }

  // Increment count and allow request
  entry.count++

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    reset: entry.resetAt
  }
}

/**
 * Get client identifier from request (IP or user ID)
 */
export function getClientId(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Clean up expired entries periodically to prevent memory leaks
 * Call this on a timer or in a background task
 */
export function cleanupExpiredEntries() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`)
  }
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

/**
 * Predefined rate limit configs
 */
export const RateLimits = {
  // Auth endpoints - strict
  AUTH: {
    max: 5,
    windowMs: 15 * 60 * 1000 // 5 attempts per 15 minutes
  },

  // Password reset - very strict
  PASSWORD_RESET: {
    max: 3,
    windowMs: 60 * 60 * 1000 // 3 attempts per hour
  },

  // API endpoints - moderate
  API: {
    max: 100,
    windowMs: 60 * 1000 // 100 requests per minute
  },

  // Quiz submissions - prevent spam
  QUIZ: {
    max: 10,
    windowMs: 60 * 1000 // 10 submissions per minute
  }
}
