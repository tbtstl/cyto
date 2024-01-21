import React, { useEffect, useMemo } from "react";
import abi from "../constants/abi.json";
import {
  BLUE_TEAM_NUMBER,
  RED_TEAM_NUMBER,
  USE_MAINNET,
} from "../constants/utils";
import { useContractRead, useContractWrite } from "wagmi";
import { Game } from "../models/Game";
import { formatEther } from "viem";

const contractConfig = {
  address: process.env.NEXT_PUBLIC_CELLULAR_ENERGY_ADDRESS as `0x${string}`,
  abi,
};

export function GameHistoryItem({
  player,
  team,
  game,
}: {
  player: `0x${string}`;
  team: number;
  game: Game;
}) {
  const [loading, setLoading] = React.useState(true);
  const { data, isLoading, write } = useContractWrite({
    ...contractConfig,
    functionName: "claimRewards",
    args: [game.humanId, player],
  });
  const { data: claimableRewards, isLoading: isLoadingRewards } =
    useContractRead({
      ...contractConfig,
      functionName: "claimableRewards",
      args: [game.humanId, player],
    });
  const renderClaimButton = useMemo(
    () => (claimableRewards as bigint).toString() !== "0",
    [claimableRewards]
  );

  useEffect(() => {
    const fetchGame = async () => {};
  }, [player]);

  return (
    <p>
      Game {game.humanId} —{" "}
      <span
        className={
          game.blueScore > game.redScore
            ? "blue"
            : game.blueScore === game.redScore
            ? ""
            : "red"
        }
      >
        {game.blueScore}-{game.redScore}
        {game.blueScore > game.redScore
          ? " (Team Blue Wins)"
          : game.blueScore === game.redScore
          ? " (Tie)"
          : " (Team Red Wins)"}
      </span>
      {renderClaimButton && (
        <>
          <span>
            &nbsp;Reward: {formatEther(claimableRewards as bigint)} ETH
          </span>
          <span className="clickableText" onClick={() => write()}>
            &nbsp;Click to claim
          </span>
        </>
      )}
    </p>
  );
}
