import { NextRequest, NextResponse } from "next/server";
import { GAME_COLLECTION, ROUND_COLLECTION, getMongoDB } from "./utils";
import { Game } from "../../models/Game";

export interface HistoryData {
  history: Game[];
}

export default async function handler(
  req: NextRequest,
  res: NextResponse<HistoryData>
) {
  const historyData = await handleHistoryDataRequest();

  // @ts-ignore
  return res.json(historyData);
}

export async function handleHistoryDataRequest() {
  const [mongoDB, mongoClient] = await getMongoDB();
  const gameCollection = mongoDB.collection<Game>(GAME_COLLECTION);
  const games = await gameCollection
    .find({}, { sort: { humanId: -1 }, projection: { _id: 0 } })
    .toArray();

  const [current, ...history] = games;

  await mongoClient.close();

  return {
    history,
  };
}
