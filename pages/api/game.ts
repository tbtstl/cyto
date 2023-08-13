import { createPublicClient, http } from "viem";
import { BLUE_TEAM_NUMBER, CONTRACT_ADDRESS, RED_TEAM_NUMBER, USE_MAINNET } from "../../constants/utils";
import { zora, zoraTestnet } from "viem/chains";
import abi from '../../constants/abi.json'
import { constructGridFromContractData } from '../../constants/utils'
import { NextRequest, NextResponse } from "next/server";

export interface GameData {
    currentGame: string,
    currentRound: string,
    redScore: string,
    blueScore: string,
    grid: number[][],
    prizePool: string
    roundEnd: string
    redContributions: string,
    blueContributions: string
}

export default async function handler(req: NextRequest, res: NextResponse<GameData>) {
    const gameData = await handleGameDataRequest()

    // @ts-ignore
    return res.json(gameData)
}

async function handleGameDataRequest() {
    const client = createPublicClient({
        chain: USE_MAINNET ? zora : zoraTestnet,
        transport: http()
    })

    const contractConfig = { address: CONTRACT_ADDRESS, abi }
    const currentGame = (await client.readContract({ ...contractConfig, functionName: 'currentGame' }) as bigint).toString()
    const currentRound = (await client.readContract({ ...contractConfig, functionName: 'currentRound' }) as bigint).toString()
    const redScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [RED_TEAM_NUMBER, currentGame] }) as bigint).toString()
    const blueScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint).toString()
    const redContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [RED_TEAM_NUMBER, currentGame] }) as bigint
    const blueContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint
    const roundEnd = (await client.readContract({ ...contractConfig, functionName: 'roundEnd' }) as bigint).toString()
    const [grid, _] = await constructGridFromContractData(client, CONTRACT_ADDRESS)

    return { currentGame, currentRound, redScore, blueScore, grid, prizePool: (redContributions + blueContributions).toString(), roundEnd: roundEnd, redContributions: redContributions.toString(), blueContributions: blueContributions.toString() }
}
