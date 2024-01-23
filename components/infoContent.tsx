import { formatEther } from "viem";
import { ContentBox } from "./contentBox";
import { useAccount, useContractRead } from "wagmi";
import { CONTRACT_ADDRESS, RED_TEAM_NUMBER } from "../constants/utils";
import abi from "../constants/abi.json";
import { useMemo } from "react";
import { GameData } from "../pages/api/game";

export const InfoContent = ({ gameData }: { gameData: GameData }) => {
  const tie =
    BigInt(gameData.game.blueScore) === BigInt(gameData.game.redScore);
  const teamBlueWinning =
    BigInt(gameData.game.blueScore) > BigInt(gameData.game.redScore);
  const { address } = useAccount();
  const { data: playerContributions } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "playerContributions",
    args: [address, gameData.game.humanId],
  });
  const { data: playerTeam } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "playerTeam",
    args: [address],
  });

  const contributionPercentage = useMemo(() => {
    if (playerContributions && playerTeam) {
      return (
        playerTeam === RED_TEAM_NUMBER
          ? (parseInt(playerContributions.toString()) /
              gameData.game.redContributions) *
            100
          : (parseInt(playerContributions.toString()) /
              gameData.game.blueContributions) *
            100
      ).toFixed(2);
    } else {
      return null;
    }
  }, [playerContributions]);

  return (
    <ContentBox>
      <h1>CYTO</h1>
      <p>
        This is game <b>{gameData.game.humanId}</b>, round{" "}
        <b>{gameData.round.humanId}</b> of <b>96</b>.<br />
        <span className="blue">
          <b>Team Blue</b>
        </span>
        &nbsp;
        {!tie && teamBlueWinning
          ? "is currently winning with "
          : "currently has "}{" "}
        <b>{gameData.game.blueScore} points</b>.<br />
        <span className="red">
          <b>Team Red</b>
        </span>
        &nbsp;
        {!tie && !teamBlueWinning
          ? "is currently winning with "
          : "currently has"}{" "}
        <b>{gameData.game.redScore} points</b>.<br />
      </p>
      {gameData.round.roundEnd < Date.now() / 1000 ? (
        <p>
          <b>The board is currently evolving.</b>
        </p>
      ) : (
        <p>
          The next evolution will occur at{" "}
          <b>{formatTime(gameData.round.roundEnd)}</b>.
        </p>
      )}
      <p>
        Place a cell on the grid by clicking on an empty space. <br />
        If it survives the next evolution, your team will earn a point.
      </p>
      <p>
        The current prize pool is{" "}
        <b>
          {formatEther(
            BigInt(
              gameData.game.blueContributions + gameData.game.redContributions
            )
          )}{" "}
          ETH
        </b>
        .
        {contributionPercentage && (
          <>
            <br />
            You've contributed <b>{contributionPercentage}%</b> to your team's
            prize pool.
          </>
        )}
      </p>
    </ContentBox>
  );
};

const formatTime = (timestamp: number): string => {
  // Convert the timestamp to milliseconds
  const date = new Date(timestamp * 1000);

  // Extract hours, minutes, and AM/PM
  let hours = date.getHours();
  const minutes = ("0" + date.getMinutes()).slice(-2); // Ensure 2 digits
  const ampm = hours >= 12 ? "pm" : "am";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return hours + ":" + minutes + ampm;
};
