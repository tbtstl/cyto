import * as React from 'react'
import { SWRConfig } from 'swr'
import { useRouter } from 'next/router'
import styles from '../styles/game.module.css'
import { formatEther, parseEther } from 'viem';
import {
  CONTRACT_ADDRESS,
  RED_TEAM_NUMBER,
  GRID_SIZE,
  CHAIN_ID,
} from "../constants/utils";
import abi from "../constants/abi.json";
import { ContentBox } from "../components/contentBox";

import { FooterButtons } from "../components/footerButtons";
import { Button } from "../components/button";
import { GetServerSideProps, GetStaticProps } from "next";
import {
  useAccount,
  useContractRead,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameBoard } from "../components/gameBoard";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { useGameData } from "../hooks/useGameData";
import { GameData, handleGameDataRequest } from "./api/game";
import { InfoContent } from "../components/infoContent";

type StagedCellKey = `${number}-${number}`;
type StagedCellMapping = { [key: StagedCellKey]: boolean };
const stagedCellKey = (x: number, y: number) => `${x}-${y}` as StagedCellKey;
const gamePrice = (stagedChanges: number) =>
  parseEther("0.001") * BigInt(stagedChanges);

function GamePage() {
  const { data: gameData } = useGameData();
  const router = useRouter();
  const { address, isDisconnected } = useAccount();
  const { chain } = useNetwork();
  const { chains, pendingChainId, switchNetwork } = useSwitchNetwork();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [viewedRound, setViewedRound] = useState(gameData.round.humanId);
  const { data: playerTeam } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "playerTeam",
    args: [address],
  });
  const [stagedCells, setStagedCells] = useState<StagedCellMapping>({});
  const numStagedChanges = useMemo(
    () =>
      Object.keys(stagedCells).filter((k) => !!stagedCells[k as StagedCellKey])
        .length,
    [stagedCells]
  );
  const stagedCellsArgs = useMemo(() => {
    return Object.keys(stagedCells)
      .filter((k) => !!stagedCells[k as StagedCellKey])
      .map((k) => {
        const [x, y] = k.split("-").map((n) => parseInt(n));
        return [x, y];
      });
  }, [stagedCells]);
  const { config, error } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: "injectCells",
    value: gamePrice(numStagedChanges),
    onSuccess: () => {
      // TODO: REFRESH GRID
    },
    args: [stagedCellsArgs, numStagedChanges],
  });
  const { isLoading, isSuccess, write } = useContractWrite(config);

  const onCellClick = useCallback(
    (x: number, y: number) => {
      if (viewedRound !== gameData.round.humanId) {
        // No-op if a user clicks on a cell in a previous round
        return;
      }
      if (!playerTeam || gameData.round.grid[x][y] !== 0) {
        return;
      }
      setStagedCells({
        ...stagedCells,
        [stagedCellKey(x, y)]: !stagedCells[stagedCellKey(x, y)],
      });
    },
    [stagedCells, setStagedCells, playerTeam, viewedRound, gameData]
  );

  useEffect(() => {
    if (chain?.id !== CHAIN_ID && !!switchNetwork) {
      switchNetwork(CHAIN_ID);
    }
  }, [chain, switchNetwork]);

  // Mutate grid value to include staged cells
  const stagedGrid = useMemo(() => {
    let ret = JSON.parse(JSON.stringify(gameData.round.grid));
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (stagedCells[stagedCellKey(x, y)]) {
          // We will use 3 and 4 to denote the staged cells, so a staged cell for team 1 will be 3, and a staged cell for team 2 will be 4
          ret[x][y] = (playerTeam as number) + 2;
        } else {
          ret[x][y] = gameData.round.grid[x][y];
        }
      }
    }
    return ret;
  }, [stagedCells, playerTeam, gameData]);

  const handleGridViewClick = useCallback(
    (value: number) => () => {
      if (value === 0 || value === gameData.round.humanId + 1) {
        // Out of bounds, no-op
        return;
      }
      setViewedRound(value);
    },
    [setViewedRound, gameData]
  );

  const currentVisibleGrid = useMemo(() => {
    const grids = [
      ...gameData.history.map((r) => r.grid).reverse(),
      stagedGrid,
    ];
    return grids[viewedRound - 1];
  }, [stagedGrid, viewedRound, gameData]);

  const PrimaryButton = () => {
    if (isDisconnected) {
      return (
        <Button onClick={() => openConnectModal && openConnectModal()}>
          Connect Wallet
        </Button>
      );
    } else if (!playerTeam) {
      return (
        <Button
          onClick={() => {
            router.push("/join");
          }}
        >
          Join Team
        </Button>
      );
    } else if (isLoading) {
      return <Button onClick={() => {}}>Confirm in Wallet</Button>;
    } else if (isSuccess) {
      return <Button onClick={() => {}}>Success!</Button>;
    } else {
      return (
        <Button
          onClick={() => {
            write && write();
          }}
          disabled={numStagedChanges === 0}
        >
          Place {numStagedChanges}{" "}
          {parseInt(playerTeam as string) === RED_TEAM_NUMBER ? "RED" : "BLUE"}{" "}
          cells
        </Button>
      );
    }
  };

  return (
    <>
      <div className={`${styles.pageContainer}`}>
        <div>
          <GameBoard
            grid={currentVisibleGrid}
            cellClickCB={onCellClick}
            clickable={!!address && viewedRound === gameData.round.humanId}
          />
          <FooterButtons>
            <Button
              onClick={handleGridViewClick(viewedRound - 1)}
              disabled={viewedRound === 1}
            >
              ←
            </Button>
            <Button
              onClick={handleGridViewClick(viewedRound + 1)}
              disabled={viewedRound === gameData.round.humanId}
            >
              →
            </Button>
            <p>
              Round {viewedRound}
              {viewedRound === gameData.round.humanId ? " (active)" : ""}
            </p>
          </FooterButtons>
        </div>
        <div>
          <InfoContent gameData={gameData} />
          <FooterButtons>
            <PrimaryButton />
            <Button
              onClick={() => {
                router.push("/how-to-play");
              }}
            >
              How to Play
            </Button>
            {address && (
              <>
                <Button
                  onClick={() => {
                    router.push("/history");
                  }}
                >
                  History
                </Button>
                <Button
                  onClick={() => {
                    disconnect();
                  }}
                >
                  Log Out
                </Button>
              </>
            )}
          </FooterButtons>
        </div>
      </div>
    </>
  );
}

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

export default function Page({ fallback }: { [key: string]: GameData }) {
  return (
    <SWRConfig value={{ fallback }}>
      <GamePage />
    </SWRConfig>
  );
}

export const getServerSideProps: GetServerSideProps<{
  fallback: { [key: string]: GameData };
}> = async () => {
  const gameData = await handleGameDataRequest();

  return {
    props: {
      fallback: {
        "/api/game": gameData,
      },
    },
  };
};
