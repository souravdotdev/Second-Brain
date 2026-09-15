import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
