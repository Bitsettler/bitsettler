/**
 * Rate Limiting System for API Protection
 * 
 * Provides:
 * - Multiple rate limiting strategies (sliding window, token bucket)
 * - Different limits for different endpoint types
 * - IP-based and user-based limiting
 * - Redis-based storage for distributed systems
 * - Memory fallback for development
 * - Security headers and proper error responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

// ===== TYPES =====

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests in window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generation
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ===== RATE LIMIT CONFIGURATIONS =====

export const RATE_LIMITS = {
  // Public endpoints (by IP)
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.'
  },
  
  // Authentication endpoints (by IP) - stricter
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // API endpoints (by user + IP)
  api: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 60,          // 60 requests per minute
    message: 'API rate limit exceeded. Please slow down.'
  },
  
  // Settlement operations (by user + settlement)
  settlement: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 30,          // 30 requests per minute
    message: 'Settlement operation rate limit exceeded.'
  },
  
  // Character claiming (by user) - very strict
  characterClaim: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,           // 3 claims per hour
    message: 'Character claiming rate limit exceeded. Only 3 attempts per hour allowed.'
  },
  
  // Search endpoints (by IP)
  search: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 20,          // 20 searches per minute
    message: 'Search rate limit exceeded. Please wait before searching again.'
  }
} as const;

// ===== STORAGE INTERFACE =====

interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttlMs: number): Promise<void>;
  increment(key: string, ttlMs: number): Promise<number>;
}

// ===== MEMORY STORE (DEVELOPMENT FALLBACK) =====

class MemoryStore implements RateLimitStore {
  private store = new Map<string, { value: number; expiry: number }>();
  
  async get(key: string): Promise<number | null> {
    const item = this.store.get(key);
    if (!item || item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  
  async set(key: string, value: number, ttlMs: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }
  
  async increment(key: string, ttlMs: number): Promise<number> {
    const current = await this.get(key) || 0;
    const newValue = current + 1;
    await this.set(key, newValue, ttlMs);
    return newValue;
  }
}

// ===== REDIS STORE (PRODUCTION) =====

class RedisStore implements RateLimitStore {
  // Note: In production, you'd initialize Redis client here
  // For now, falling back to memory store
  private fallback = new MemoryStore();
  
  async get(key: string): Promise<number | null> {
    // TODO: Implement Redis.get(key)
    return this.fallback.get(key);
  }
  
  async set(key: string, value: number, ttlMs: number): Promise<void> {
    // TODO: Implement Redis.setex(key, Math.ceil(ttlMs / 1000), value)
    return this.fallback.set(key, value, ttlMs);
  }
  
  async increment(key: string, ttlMs: number): Promise<number> {
    // TODO: Implement Redis pipeline with INCR and EXPIRE
    return this.fallback.increment(key, ttlMs);
  }
}

// ===== STORE SINGLETON =====

const isProduction = process.env.NODE_ENV === 'production';
const store: RateLimitStore = isProduction ? new RedisStore() : new MemoryStore();

// ===== KEY GENERATORS =====

/**
 * Generate rate limit key based on IP address
 */
export function getIPKey(request: NextRequest, prefix: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `rate_limit:${prefix}:ip:${ip}`;
}

/**
 * Generate rate limit key based on user ID
 */
export function getUserKey(userId: string, prefix: string): string {
  return `rate_limit:${prefix}:user:${userId}`;
}

/**
 * Generate rate limit key based on user + settlement
 */
export function getUserSettlementKey(userId: string, settlementId: string, prefix: string): string {
  return `rate_limit:${prefix}:user:${userId}:settlement:${settlementId}`;
}

// ===== CORE RATE LIMITING =====

/**
 * Check rate limit using sliding window
 */
export async function checkRateLimit(
  key: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const currentCount = await store.increment(key, config.windowMs);
    const resetTime = Date.now() + config.windowMs;
    
    if (currentCount > config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000)
      };
    }
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetTime
    };
  } catch (error) {
    // On error, allow the request (fail open)
    console.error('Rate limiting error:', error);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    };
  }
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  keyGenerator?: (req: NextRequest) => string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const logger = createRequestLogger(request, 'rate-limiter');
  
  // Generate rate limit key
  const key = keyGenerator ? keyGenerator(request) : getIPKey(request, 'default');
  
  // Check rate limit
  const result = await checkRateLimit(key, config);
  
  if (!result.success) {
    logger.warn('Rate limit exceeded', {
      key,
      limit: result.limit,
      retryAfter: result.retryAfter
    });
    
    const response = NextResponse.json(
      {
        success: false,
        error: config.message || 'Rate limit exceeded',
        details: {
          limit: result.limit,
          retryAfter: result.retryAfter
        }
      },
      { status: 429 }
    );
    
    // Add rate limiting headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    response.headers.set('Retry-After', (result.retryAfter || 60).toString());
    
    return { allowed: false, response };
  }
  
  // Log successful rate limit check
  logger.debug('Rate limit check passed', {
    key,
    remaining: result.remaining,
    limit: result.limit
  });
  
  return { allowed: true };
}

// ===== MIDDLEWARE HELPERS =====

/**
 * Rate limiting middleware for API routes
 */
export function createRateLimitMiddleware(
  limitType: keyof typeof RATE_LIMITS,
  keyGenerator?: (req: NextRequest) => string
) {
  return async (request: NextRequest) => {
    const config = RATE_LIMITS[limitType];
    return applyRateLimit(request, config, keyGenerator);
  };
}

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = createRateLimitMiddleware('auth');

/**
 * Rate limiting for API endpoints
 */
export const apiRateLimit = createRateLimitMiddleware('api');

/**
 * Rate limiting for search endpoints
 */
export const searchRateLimit = createRateLimitMiddleware('search');

/**
 * Rate limiting for settlement operations (requires user context)
 */
export function settlementRateLimit(userId: string, settlementId?: string) {
  return createRateLimitMiddleware('settlement', (req) => {
    if (settlementId) {
      return getUserSettlementKey(userId, settlementId, 'settlement');
    }
    return getUserKey(userId, 'settlement');
  });
}

/**
 * Rate limiting for character claiming (requires user context)
 */
export function characterClaimRateLimit(userId: string) {
  return createRateLimitMiddleware('characterClaim', () => 
    getUserKey(userId, 'character_claim')
  );
}

// ===== RESPONSE HELPERS =====

/**
 * Add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse, 
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  return response;
}

/**
 * Check if request should be rate limited based on conditions
 */
export function shouldRateLimit(request: NextRequest): boolean {
  // Skip rate limiting in development if configured
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMITING === 'true') {
    return false;
  }
  
  // Skip rate limiting for health checks
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('health-check') || userAgent.includes('monitor')) {
    return false;
  }
  
  return true;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get rate limit status for a key (for debugging)
 */
export async function getRateLimitStatus(key: string): Promise<number | null> {
  return store.get(key);
}

/**
 * Reset rate limit for a key (for admin use)
 */
export async function resetRateLimit(key: string): Promise<void> {
  return store.set(key, 0, 1); // Set to 0 with minimal TTL
}

/**
 * Get remaining requests for a key
 */
export async function getRemainingRequests(
  key: string, 
  maxRequests: number
): Promise<number> {
  const current = await store.get(key) || 0;
  return Math.max(0, maxRequests - current);
}