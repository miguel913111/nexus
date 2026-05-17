import Redis from 'ioredis';
import { PLANS, PlanType } from '@nexus-ia/types';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting: requests per minute
export async function checkRateLimit(apiKey: string, plan: PlanType): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = PLANS[plan];
  const key = `ratelimit:req:${apiKey}`;
  const window = 60; // 1 minute
  
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  const allowed = current <= config.rateLimitPerMin;
  const ttl = await redis.ttl(key);
  
  return {
    allowed,
    remaining: Math.max(0, config.rateLimitPerMin - current),
    resetIn: ttl > 0 ? ttl : window
  };
}

// Check if user has enough credits for estimated tokens
export async function checkCredits(apiKey: string, estimatedTokens: number): Promise<{ allowed: boolean; remaining: number }> {
  const key = `credits:${apiKey}`;
  const creditsStr = await redis.get(key);
  
  if (!creditsStr) {
    // Fallback to DB
    return { allowed: true, remaining: -1 };
  }
  
  const credits = parseInt(creditsStr, 10);
  return {
    allowed: credits >= estimatedTokens,
    remaining: credits
  };
}

// Deduct credits from Redis cache
export async function deductCredits(apiKey: string, tokens: number): Promise<void> {
  const key = `credits:${apiKey}`;
  await redis.decrby(key, tokens);
}

// Cache user credits in Redis
export async function cacheCredits(apiKey: string, credits: number): Promise<void> {
  const key = `credits:${apiKey}`;
  await redis.setex(key, 300, credits.toString()); // 5 min cache
}

export async function clearRateLimit(apiKey: string): Promise<void> {
  await redis.del(`ratelimit:req:${apiKey}`);
}
