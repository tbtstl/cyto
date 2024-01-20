import Redis, { RedisOptions } from 'ioredis';
import { CONTRACT_ADDRESS } from '../../constants/utils';
import { MongoClient } from "mongodb";

// Note: Server only
export function getRedisClient() {
  const options: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "0"),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
    showFriendlyErrorStack: true,
    enableAutoPipelining: true,
    maxRetriesPerRequest: 0,
    retryStrategy: (times: number) => {
      if (times > 3) {
        throw new Error(`[Redis] Could not connect after ${times} attempts`);
      }

      return Math.min(times * 200, 1000);
    },
  };

  const redis = new Redis(options);
  redis.on("error", (error: unknown) => {
    console.warn("[Redis] Error connecting", error);
  });
  return redis;
}

export const rKey = (key: string) => `${CONTRACT_ADDRESS}:${key}`;

export const GAME_COLLECTION = "games";
export const ROUND_COLLECTION = "rounds";
export const ACTIVITY_ITEMS_COLLECTION = "activityItems";

export async function getMongoDB() {
  const url = process.env.MONGO_URL as string;
  const client = new MongoClient(url);

  await client.connect();

  const db = client.db(process.env.MONGO_DB_NAME as string);
  return db;
}
