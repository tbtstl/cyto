import * as React from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/game.module.css'
import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { USE_MAINNET, CONTRACT_ADDRESS, RED_TEAM_NUMBER, BLUE_TEAM_NUMBER, GRID_SIZE, constructGridFromContractData } from '../constants/utils'
import { zora, zoraTestnet } from 'viem/chains';
import abi from '../constants/abi.json'
import { ContentBox } from '../components/contentBox'

import { FooterButtons } from '../components/footerButtons';
import { Button } from '../components/button';
import { GetStaticProps } from 'next';
import { useAccount, useContractRead } from 'wagmi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameBoard } from '../components/gameBoard';
import { useInterval } from '../hooks/useInterval';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface GameProps {
    currentGame: string,
    currentRound: string,
    currentSeason: string,
    redScore: string,
    blueScore: string,
    grid: number[][],
    prizePool: string
    roundEnd: string
}

type StagedCellKey = `${number}-${number}`
type StagedCellMapping = { [key: StagedCellKey]: boolean }
const stagedCellKey = (x: number, y: number) => `${x}-${y}` as StagedCellKey


export default function Page(props: GameProps) {
    const router = useRouter();
    const { address, isDisconnected } = useAccount()
    const { openConnectModal } = useConnectModal();
    const [timeToEvolution, setTimeToEvolution] = useState(timeRemaining(parseInt(props.roundEnd)));
    const { data: playerTeam } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'playerTeam',
        args: [address, props.currentSeason]
    })
    const [stagedCells, setStagedCells] = useState<StagedCellMapping>({})
    const numStagedChanges = useMemo(() => Object.keys(stagedCells).filter((k) => !!stagedCells[k as StagedCellKey]).length, [stagedCells]);

    useInterval(() => {
        const updatedTimeToEvolution = timeRemaining(parseInt(props.roundEnd));

        if (updatedTimeToEvolution !== timeToEvolution) {
            setTimeToEvolution(updatedTimeToEvolution)
        }
    }, 1000);

    const tie = BigInt(props.blueScore) === BigInt(props.redScore);
    const teamBlueWinning = BigInt(props.blueScore) > BigInt(props.redScore);
    const price = formatEther(BigInt(props.currentRound) * parseEther('0.0001'));

    const onCellClick = useCallback((x: number, y: number) => {
        if (!playerTeam) { return }
        setStagedCells({ ...stagedCells, [stagedCellKey(x, y)]: !stagedCells[stagedCellKey(x, y)] })
    }, [stagedCells, setStagedCells, playerTeam])


    // Mutate grid value to include staged cells
    const stagedGrid = useMemo(() => {
        let ret = JSON.parse(JSON.stringify(props.grid));
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (stagedCells[stagedCellKey(x, y)]) {
                    // We will use 3 and 4 to denote the staged cells, so a staged cell for team 1 will be 3, and a staged cell for team 2 will be 4
                    ret[x][y] = (playerTeam as number) + 2;
                } else {
                    ret[x][y] = props.grid[x][y]
                }
            }
        }
        return ret;
    }, [stagedCells, playerTeam])


    const PrimaryButton = () => {
        if (isDisconnected) {
            return <Button onClick={() => openConnectModal && openConnectModal()}>Connect Wallet</Button>
        } else if (!playerTeam) {
            return <Button onClick={() => { router.push('/join') }}>Join Team</Button>
        } else {
            return <Button onClick={() => { router.push('/join') }}>Place {numStagedChanges} {parseInt(playerTeam as string) === RED_TEAM_NUMBER ? 'RED' : 'BLUE'} cells</Button>
        }
    }

    return (
        <>
            <div className={`${styles.pageContainer}`}>
                <GameBoard grid={stagedGrid} cellClickCB={onCellClick} />
                <div>
                    <ContentBox>
                        <h1>CELLULAR ENERGY</h1>
                        <p>
                            This is game <b>{props.currentGame}</b> of <b>7</b>.<br />
                            <span className="blue"><b>Team Blue</b></span>&nbsp;{!tie && teamBlueWinning ? 'is currently winning with ' : 'currently has '} <b>{props.blueScore} points</b>.<br />
                            <span className="red"><b>Team Red</b></span>&nbsp;{!tie && !teamBlueWinning ? 'is currently winning with ' : 'currently has'} <b>{props.redScore} points</b>.<br />
                        </p>
                        {timeToEvolution === '0:00' ? (
                            <p><b>The board is currently evolving.</b></p>
                        ) : (
                            <p>The next evolution will occur in <b>{timeToEvolution}</b>.</p>
                        )}
                        <p>
                            Place a cell on the grid by clicking on an empty space. <br />
                            If it survives the next evolution, your team will earn a point.
                        </p>
                        <p>
                            The current cost to place a cell is <b>{price} ETH</b>.<br />
                            The current prize pool is <b>{formatEther(BigInt(props.prizePool))} ETH</b>.
                        </p>
                    </ContentBox>
                    <FooterButtons>
                        <PrimaryButton />
                        <Button onClick={() => { router.push('/how-to-play') }}>How to Play</Button>
                    </FooterButtons>
                </div>
            </div >
        </>
    )
}

const timeRemaining = (timestamp: number): string => {
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = timestamp - currentTime;

    if (remainingTime <= 0) {
        return '0:00';
    }

    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const getStaticProps: GetStaticProps<GameProps> = async () => {
    const client = createPublicClient({
        chain: USE_MAINNET ? zora : zoraTestnet,
        transport: http()
    })
    const contractConfig = { address: CONTRACT_ADDRESS, abi }

    const currentSeason = (await client.readContract({ ...contractConfig, functionName: 'season' }) as bigint).toString()
    const currentGame = (await client.readContract({ ...contractConfig, functionName: 'epoch' }) as bigint).toString()
    const currentRound = (await client.readContract({ ...contractConfig, functionName: 'round' }) as bigint).toString()
    const redScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [currentSeason, RED_TEAM_NUMBER] }) as bigint).toString()
    const blueScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [currentSeason, BLUE_TEAM_NUMBER] }) as bigint).toString()
    const redContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [RED_TEAM_NUMBER, currentSeason] }) as bigint
    const blueContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [BLUE_TEAM_NUMBER, currentSeason] }) as bigint
    const roundEnd = (await client.readContract({ ...contractConfig, functionName: 'roundEnd' }) as bigint).toString()
    const [grid, _] = await constructGridFromContractData(client, CONTRACT_ADDRESS)

    return { props: { currentGame, currentRound, currentSeason, redScore, blueScore, grid, prizePool: (redContributions + blueContributions).toString(), roundEnd: roundEnd }, revalidate: 1 }
}
