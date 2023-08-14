import Redis, { RedisOptions } from 'ioredis';
import { CONTRACT_ADDRESS } from '../../constants/utils';

// Note: Server only
export function getRedisClient() {
    const options: RedisOptions = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '0'),
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
        }
    }

    const redis = new Redis(options);
    redis.on('error', (error: unknown) => {
        console.warn('[Redis] Error connecting', error);
    });
    return redis;
}

export const rKey = (key: string) => `${CONTRACT_ADDRESS}:${key}`
