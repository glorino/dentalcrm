import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let ratelimitClient: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

export function getRatelimit(): Ratelimit | null {
  if (ratelimitClient) return ratelimitClient;
  const redis = getRedis();
  if (!redis) return null;
  ratelimitClient = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
  });
  return ratelimitClient;
}

export async function checkRateLimit(
  key: string,
  limit: number = 10,
  window: string = "60 s"
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const ratelimit = getRatelimit();
  if (!ratelimit) {
    return { allowed: true, remaining: 999, reset: Date.now() + 60000 };
  }

  const result = await ratelimit.limit(key);
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
