import { useRouter } from "next/router";
import { Button } from "../components/button";
import { ContentBox } from "../components/contentBox";
import { FooterButtons } from "../components/footerButtons";
import abi from "../constants/abi.json";
import {
  BLUE_TEAM_NUMBER,
  RED_TEAM_NUMBER,
  USE_MAINNET,
} from "../constants/utils";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { useCallback, useEffect } from "react";
import { zora, zoraSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";
import { HistoryData, handleHistoryDataRequest } from "./api/history";
import { GameHistoryItem } from "../components/gameHistoryItem";

const contractConfig = {
  address: process.env.NEXT_PUBLIC_CELLULAR_ENERGY_ADDRESS as `0x${string}`,
  abi,
  functionName: "claimRewards",
};

export default function Page({ history }: HistoryData) {
  const router = useRouter();
  const { address } = useAccount();
  const { data: playerTeam, isLoading } = useContractRead({
    ...contractConfig,
    functionName: "playerTeam",
    args: [address],
  });
  const numberOfGames = history.length;
  // const { config: blueConfig } = usePrepareContractWrite({
  //   ...contractConfig,
  //   args: [BLUE_TEAM_NUMBER],
  // });
  // const { config: redConfig } = usePrepareContractWrite({
  //   ...contractConfig,
  //   args: [RED_TEAM_NUMBER],
  // });
  // const { isLoading: isLoadingBlue, write: blueWrite } = useContractWrite({
  //   ...blueConfig,
  //   onSettled() {
  //     router.push("/game");
  //   },
  // });
  // const { isLoading: isLoadingRed, write: redWrite } = useContractWrite({
  //   ...redConfig,
  //   onSettled() {
  //     router.push("/game");
  //   },
  // });

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  });

  // const handleButtonClick = useCallback(
  //   (team: number) => () => {
  //     if (team === BLUE_TEAM_NUMBER) {
  //       blueWrite && blueWrite();
  //     } else {
  //       redWrite && redWrite();
  //     }
  //   },
  //   [blueWrite, redWrite]
  // );

  return (
    <div className="center">
      <ContentBox>
        <h1>GAME HISTORY</h1>
        <br />
        <p>
          There are <b>{numberOfGames}</b> completed games so far. If you've won
          any games, you can collect your rewards here.
        </p>
        <div>
          {!isLoading && !!address ? (
            history.map((game) => (
              <GameHistoryItem
                player={address}
                key={game.humanId}
                team={playerTeam as number}
                game={game}
              />
            ))
          ) : (
            <p>Loading...</p>
          )}
          <p></p>
        </div>
      </ContentBox>
      <FooterButtons>
        <Button theme="red" onClick={() => router.push("/game")}>
          Back to Game
        </Button>
      </FooterButtons>
    </div>
  );
}

export async function getServerSideProps() {
  const viemClient = createPublicClient({
    chain: USE_MAINNET ? zora : zoraSepolia,
    transport: http(),
  });

  const { history } = await handleHistoryDataRequest();

  return {
    props: { history },
  };
}
