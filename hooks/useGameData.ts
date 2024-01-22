import useSWR, { Fetcher } from 'swr'
import { GameData } from '../pages/api/game'
import { handleEvolveBoardRequest } from "../pages/api/evolve";

const fetcher: Fetcher<GameData> = () => {
  console.log("refreshing game data");
  fetch("/api/refresh")
    .then((res) => {
      if (res.status === 429) {
        console.log("job already running, did not refresh game data");
      } else if (res.status === 200) {
        console.log("refreshed game data");
      }
    })
    .catch((e) =>
      console.log("did not refresh game data, unexpected error", e)
    );
  console.log("fetching game data");
  return fetch("/api/game").then((res) => res.json());
};

const fallbackData: GameData = {
  game: {
    humanId: 0,
    blueScore: 0,
    redScore: 0,
    blueContributions: 0,
    redContributions: 0,
  },
  round: {
    humanId: 0,
    gameId: 0,
    grid: Array.from({ length: 64 }, () => Array(64).fill(0)),
    roundEnd: 0,
  },
  history: [],
};

export function useGameData() {
  const { data, error, isLoading } = useSWR(`/api/game`, fetcher, {
    refreshInterval: 1000,
  });

  return {
    data: data || fallbackData,
    isLoading,
    isError: error,
  };
}
