import { NextRequest, NextResponse } from "next/server";
import { GAME_COLLECTION, ROUND_COLLECTION, getMongoDB } from "./utils";
import { Game } from "../../models/Game";
import { Round } from "../../models/Round";

export interface GameData {
  currentGame: string;
  currentRound: string;
  redScore: string;
  blueScore: string;
  grid: number[][];
  history: number[][][];
  prizePool: string;
  roundEnd: string;
  redContributions: string;
  blueContributions: string;
}

export default async function handler(
  req: NextRequest,
  res: NextResponse<GameData>
) {
  const gameData = await handleGameDataRequest();

  // @ts-ignore
  return res.json(gameData);
}

export async function handleGameDataRequest() {
  const [mongoDB, mongoClient] = await getMongoDB();
  const gameCollection = mongoDB.collection<Game>(GAME_COLLECTION);
  const roundCollection = mongoDB.collection<Round>(ROUND_COLLECTION);

  const currentGame = await gameCollection.findOne(
    {},
    { sort: { humanId: -1 } }
  );

  const currentRound = await roundCollection.findOne(
    {},
    { sort: { humanId: -1 } }
  );

  if (!currentGame || !currentRound) {
    throw new Error("No game or round found");
  }

  //   if (!roundEnd) {
  //     roundEnd = (
  //       (await client.readContract({
  //         ...contractConfig,
  //         functionName: "roundEnd",
  //       })) as bigint
  //     ).toString();
  //     await redis.set(rKey("roundEnd"), roundEnd, "EX", 10);
  //   }
  //   // Now that we know when the next round ends, let's set the round invariants to expire when the round ends
  //   const now = Math.floor(Date.now() / 1000);
  //   const exp = parseInt(roundEnd) > now ? parseInt(roundEnd) - now : 10;

  //   if (!currentGame) {
  //     currentGame = (
  //       (await client.readContract({
  //         ...contractConfig,
  //         functionName: "currentGame",
  //       })) as bigint
  //     ).toString();
  //     await redis.set(rKey("currentGame"), currentGame, "EX", exp);
  //   }
  //   if (!currentRound) {
  //     currentRound = (
  //       (await client.readContract({
  //         ...contractConfig,
  //         functionName: "currentRound",
  //       })) as bigint
  //     ).toString();
  //     await redis.set(rKey("currentRound"), currentRound, "EX", exp);
  //   }
  //   if (!redScore) {
  //     redScore = (
  //       (await client.readContract({
  //         ...contractConfig,
  //         functionName: "teamScore",
  //         args: [RED_TEAM_NUMBER, currentGame],
  //       })) as bigint
  //     ).toString();
  //     await redis.set(rKey("redScore"), redScore, "EX", exp);
  //   }
  //   if (!blueScore) {
  //     blueScore = (
  //       (await client.readContract({
  //         ...contractConfig,
  //         functionName: "teamScore",
  //         args: [BLUE_TEAM_NUMBER, currentGame],
  //       })) as bigint
  //     ).toString();
  //     await redis.set(rKey("blueScore"), blueScore, "EX", exp);
  //   }
  //   if (!redContributions) {
  //     redContributions = (await client.readContract({
  //       ...contractConfig,
  //       functionName: "teamContributions",
  //       args: [RED_TEAM_NUMBER, currentGame],
  //     })) as bigint;
  //     await redis.set(
  //       rKey("redContributions"),
  //       redContributions.toString(),
  //       "EX",
  //       10
  //     ); // leave at 10 since this is not round invariant
  //   }
  //   if (!blueContributions) {
  //     blueContributions = (await client.readContract({
  //       ...contractConfig,
  //       functionName: "teamContributions",
  //       args: [BLUE_TEAM_NUMBER, currentGame],
  //     })) as bigint;
  //     await redis.set(
  //       rKey("blueContributions"),
  //       blueContributions.toString(),
  //       "EX",
  //       10
  //     ); // leave at 10 since this is not round invariant
  //   }
  //   if (!grid) {
  //     let _;
  //     [grid, _] = await constructGridFromContractData(client, CONTRACT_ADDRESS);
  //     await redis.set(rKey("grid"), JSON.stringify(grid), "EX", 10); // leave at 10 since this is not round invariant
  //   }

  const history = await roundCollection
    .find(
      { gameId: currentGame.humanId },
      { sort: { humanId: -1 }, projection: { grid: 1, _id: 0 } }
    )
    .limit(100)
    .toArray();

  await mongoClient.close();

  return {
    currentGame,
    currentRound,
    history,
  };
}
