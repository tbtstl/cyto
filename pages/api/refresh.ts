import { RefreshJob } from "../../models/RefreshJob";
import {
  GAME_COLLECTION,
  REFRESH_JOBS_COLLECTION,
  ROUND_COLLECTION,
  getMongoDB,
} from "./utils";
import {
  http,
  getEventSignature,
  createPublicClient,
  PublicClient,
} from "viem";
import { zora, zoraSepolia } from "viem/chains";
import {
  BLUE_TEAM_NUMBER,
  CONTRACT_ADDRESS,
  RED_TEAM_NUMBER,
  USE_MAINNET,
  constructGridFromContractData,
} from "../../constants/utils";
import abi from "../../constants/abi.json";
import { WalletClient } from "wagmi";
import { Game } from "../../models/Game";
import { Round } from "../../models/Round";
import { NextApiRequest, NextApiResponse } from "next";

const GAME_RESET_SIGNATURE = getEventSignature("event GameReset(uint256 game)");
const NEW_TEAM_JOINED_SIGNATURE = getEventSignature(
  "event NewTeamJoined(address indexed player, uint8 indexed team)"
);
const NEW_CELL_SIGNATURE = getEventSignature(
  "event NewCell(uint8 indexed x, uint8 indexed y, uint8 indexed team, address player);"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const [db, mongoClient] = await getMongoDB();
  const jobsCollection = db.collection<RefreshJob>(REFRESH_JOBS_COLLECTION);
  const job = await jobsCollection.findOne({}, { sort: { jobStartedAt: -1 } });

  if (job?.jobRunning) {
    res.status(429).json({ error: "Job already running" });
  }

  console.log("starting job");
  await jobsCollection.updateOne(
    {},
    {
      $set: {
        jobRunning: true,
        jobStartedAt: Date.now(),
      },
    },
    { upsert: true }
  );

  await mongoClient.close();

  const viemClient = createPublicClient({
    chain: USE_MAINNET ? zora : zoraSepolia,
    transport: http(),
  });

  await refreshBoardState(viemClient as any);
  //   await createActivityItems(
  //     viemClient,
  //     job?.latestFetchedBlockHeight ||
  //       parseInt(process.env.DEPLOYED_BLOCK_HEIGHT as string)
  //   );

  await mongoClient.connect();

  await jobsCollection.updateOne(
    {},
    {
      $set: {
        jobRunning: false,
      },
    }
  );

  await mongoClient.close();

  return res.json();
}

async function refreshBoardState(viemClient: PublicClient) {
  const contractConfig = { address: CONTRACT_ADDRESS, abi };
  const currentGameId = (await viemClient.readContract({
    ...contractConfig,
    functionName: "currentGame",
  })) as bigint;
  const currentRoundId = (await viemClient.readContract({
    ...contractConfig,
    functionName: "currentRound",
  })) as bigint;
  const redScore = (await viemClient.readContract({
    ...contractConfig,
    functionName: "teamScore",
    args: [RED_TEAM_NUMBER, currentGameId],
  })) as bigint;
  const blueScore = (await viemClient.readContract({
    ...contractConfig,
    functionName: "teamScore",
    args: [BLUE_TEAM_NUMBER, currentGameId],
  })) as bigint;
  const redContributions = (await viemClient.readContract({
    ...contractConfig,
    functionName: "teamContributions",
    args: [RED_TEAM_NUMBER, currentGameId],
  })) as bigint;
  const blueContributions = (await viemClient.readContract({
    ...contractConfig,
    functionName: "teamContributions",
    args: [BLUE_TEAM_NUMBER, currentGameId],
  })) as bigint;
  const roundEnd = (await viemClient.readContract({
    ...contractConfig,
    functionName: "roundEnd",
  })) as bigint;
  const [grid, _] = await constructGridFromContractData(
    viemClient as any,
    CONTRACT_ADDRESS
  );
  // First, fetch the latest game and round, making sure their human IDs match.

  const [db, client] = await getMongoDB();
  const gameCollection = db.collection<Game>(GAME_COLLECTION);
  const roundCollection = db.collection<Round>(ROUND_COLLECTION);

  const gameUpdate = {
    $set: {
      redScore: parseInt(redScore.toString()),
      blueScore: parseInt(blueScore.toString()),
      redContributions: parseInt(redContributions.toString()),
      blueContributions: parseInt(blueContributions.toString()),
      humanId: parseInt(currentGameId.toString()),
    },
  };
  const roundUpdate = {
    $set: {
      grid,
      humanId: parseInt(currentRoundId.toString()),
      gameId: parseInt(currentGameId.toString()),
      roundEnd: parseInt(roundEnd.toString()),
    },
  };

  console.log("updating game and round", gameUpdate.$set, {
    ...roundUpdate.$set,
    grid: "...",
  });
  await gameCollection.findOneAndUpdate(
    { humanId: parseInt(currentGameId.toString()) },
    gameUpdate,
    { upsert: true, returnDocument: "after" }
  );
  await roundCollection.findOneAndUpdate(
    {
      humanId: parseInt(currentRoundId.toString()),
    },
    roundUpdate,
    { upsert: true, returnDocument: "after" }
  );

  await client.close();

  // We already store the latest round and game in the database, so we just need to update the scores, contributions, and grid
}

async function createActivityItems(
  viemClient: PublicClient,
  latestFetchedBlockHeight: number
) {
  const filter = await viemClient.createEventFilter({
    address: CONTRACT_ADDRESS,
    fromBlock: BigInt(latestFetchedBlockHeight),
  });

  const logs = await viemClient.getFilterLogs({ filter });

  // TODO: Iterate through each log and handle it depending on the first topic
  for (const log of logs) {
    const topic = log.topics[0];
    if (topic === GAME_RESET_SIGNATURE) {
    }
  }
}
