import Redis, { RedisOptions } from 'ioredis';
import { createPublicClient, http } from "viem";
import { BLUE_TEAM_NUMBER, CONTRACT_ADDRESS, RED_TEAM_NUMBER, USE_MAINNET } from "../../constants/utils";
import { zora, zoraTestnet } from "viem/chains";
import abi from '../../constants/abi.json'
import { constructGridFromContractData } from '../../constants/utils'
import { NextRequest, NextResponse } from "next/server";

export interface GameData {
    currentGame: string,
    currentRound: string,
    redScore: string,
    blueScore: string,
    grid: number[][],
    prizePool: string
    roundEnd: string
    redContributions: string,
    blueContributions: string
}

export default async function handler(req: NextRequest, res: NextResponse<GameData>) {
    const gameData = await handleGameDataRequest()

    // @ts-ignore
    return res.json(gameData)
}

function getRedisClient() {
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

export async function handleGameDataRequest() {
    const client = createPublicClient({
        chain: USE_MAINNET ? zora : zoraTestnet,
        transport: http()
    })
    const contractConfig = { address: CONTRACT_ADDRESS, abi }

    const redis = getRedisClient();
    const rKey = (key: string) => `${CONTRACT_ADDRESS}:${key}`

    let currentGame = await redis.get(rKey('currentGame'));
    let currentRound = await redis.get(rKey('currentRound'));
    let redScore = await redis.get(rKey('redScore'));
    let blueScore = await redis.get(rKey('blueScore'));
    let redContributions = BigInt(await redis.get(rKey('redContributions')) || '0');
    let blueContributions = BigInt(await redis.get(rKey('blueContributions')) || '0');
    let roundEnd = await redis.get(rKey('roundEnd'));
    let grid = await redis.get(rKey('grid')).then(result => result ? JSON.parse(result) : null);

    const cachedResults = { currentGame, currentRound, redScore, blueScore, redContributions, blueContributions, roundEnd, grid }
    for (const [k, v] of Object.entries(cachedResults)) {
        if (!v) {
            console.log(`[Redis] Cache miss for ${k}`)
        }
    }

    if (!roundEnd) {
        roundEnd = (await client.readContract({ ...contractConfig, functionName: 'roundEnd' }) as bigint).toString()
        await redis.set(rKey('roundEnd'), roundEnd, 'EX', 10)
    }
    // Now that we know when the next round ends, let's set the round invariants to expire when the round ends
    const now = Math.floor(Date.now() / 1000);
    const exp = parseInt(roundEnd) > now ? parseInt(roundEnd) - now : 10;

    if (!currentGame) {
        currentGame = (await client.readContract({ ...contractConfig, functionName: 'currentGame' }) as bigint).toString()
        await redis.set(rKey('currentGame'), currentGame, 'EX', exp)
    }
    if (!currentRound) {
        currentRound = (await client.readContract({ ...contractConfig, functionName: 'currentRound' }) as bigint).toString()
        await redis.set(rKey('currentRound'), currentRound, 'EX', exp)
    }
    if (!redScore) {
        redScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [RED_TEAM_NUMBER, currentGame] }) as bigint).toString()
        await redis.set(rKey('redScore'), redScore, 'EX', exp)
    }
    if (!blueScore) {
        blueScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint).toString()
        await redis.set(rKey('blueScore'), blueScore, 'EX', exp)
    }
    if (!redContributions) {
        redContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [RED_TEAM_NUMBER, currentGame] }) as bigint
        await redis.set(rKey('redContributions'), redContributions.toString(), 'EX', 10) // leave at 10 since this is not round invariant
    }
    if (!blueContributions) {
        blueContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint
        await redis.set(rKey('blueContributions'), blueContributions.toString(), 'EX', 10) // leave at 10 since this is not round invariant
    }
    if (!grid) {
        let _;
        [grid, _] = await constructGridFromContractData(client, CONTRACT_ADDRESS)
        await redis.set(rKey('grid'), JSON.stringify(grid), 'EX', 10) // leave at 10 since this is not round invariant
    }

    return { currentGame, currentRound, redScore, blueScore, grid, prizePool: (redContributions + blueContributions).toString(), roundEnd: roundEnd, redContributions: redContributions.toString(), blueContributions: blueContributions.toString() }
}
