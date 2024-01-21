import { NextRequest, NextResponse } from "next/server";
import { GAME_COLLECTION, ROUND_COLLECTION, getMongoDB } from "./utils";
import { Game } from "../../models/Game";
import { Round } from "../../models/Round";

export interface GameData {
  game: Game;
  round: Round;
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

  const game = await gameCollection.findOne(
    {},
    { sort: { humanId: -1 }, projection: { _id: 0 } }
  );

  const round = await roundCollection.findOne(
    {},
    { sort: { humanId: -1 }, projection: { _id: 0 } }
  );

  if (!game || !round) {
    throw new Error("No game or round found");
  }

  const history = await roundCollection
    .find(
      { gameId: game.humanId },
      { sort: { humanId: -1 }, projection: { grid: 1, _id: 0 } }
    )
    .limit(100)
    .toArray();

  await mongoClient.close();

  return {
    game,
    round,
    history,
  };
}
