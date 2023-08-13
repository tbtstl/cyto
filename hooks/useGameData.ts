import useSWR, { Fetcher } from 'swr'
import { GameData } from '../pages/api/game'

const fetcher: Fetcher<GameData> = () => fetch('/api/game').then(res => res.json())

const fallbackData: GameData = {
    currentGame: '0',
    currentRound: '0',
    redScore: '0',
    blueScore: '0',
    grid: Array.from({ length: 64 }, () => Array(64).fill(0)),
    prizePool: '0',
    roundEnd: '0',
    redContributions: '0',
    blueContributions: '0'
}

export function useGameData() {
    const { data, error, isLoading } = useSWR(`/api/game`, fetcher, { refreshInterval: 10000 })

    return {
        data: data || fallbackData,
        isLoading,
        isError: error
    }
}
