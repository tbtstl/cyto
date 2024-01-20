import { CONTRACT_ADDRESS } from "../../constants/utils";
import { MongoClient } from "mongodb";

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
