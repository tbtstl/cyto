import * as React from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/game.module.css'
import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { USE_MAINNET, CONTRACT_ADDRESS, RED_TEAM_NUMBER, BLUE_TEAM_NUMBER } from '../constants/utils'
import { zora, zoraTestnet } from 'viem/chains';
import abi from '../constants/abi.json'
import { ContentBox } from '../components/contentBox'

import { FooterButtons } from '../components/footerButtons';
import { Button } from '../components/button';
import { GetStaticProps } from 'next';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { GameBoard } from '../components/gameBoard';
import { useInterval } from '../hooks/useInterval';

interface GameProps {
    currentGame: string,
    currentRound: string,
    redScore: string,
    blueScore: string,
    prizePool: string
    roundEnd: string
}

export default function Page(props: GameProps) {
    const router = useRouter();
    const { address, isDisconnected } = useAccount()
    const [timeToEvolution, setTimeToEvolution] = useState(timeRemaining(parseInt(props.roundEnd)));

    useEffect(() => {
        if (isDisconnected) {
            router.push('/')
        }
    }, [isDisconnected])

    useInterval(() => {
        const updatedTimeToEvolution = timeRemaining(parseInt(props.roundEnd));

        if (updatedTimeToEvolution !== timeToEvolution) {
            setTimeToEvolution(updatedTimeToEvolution)
        }
    }, 1000);

    const tie = BigInt(props.blueScore) === BigInt(props.redScore);
    const teamBlueWinning = BigInt(props.blueScore) > BigInt(props.redScore);
    const price = formatEther(BigInt(props.currentRound) * parseEther('0.0001'));

    return (
        <>
            <div className={`center ${styles.pageContainer}`}>
                <GameBoard />
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
                        <Button onClick={() => { router.push('/join') }}>Join Team</Button>
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

    const currentSeason = (await client.readContract({ ...contractConfig, functionName: 'season' })).toString()
    const currentGame = (await client.readContract({ ...contractConfig, functionName: 'epoch' })).toString()
    const currentRound = (await client.readContract({ ...contractConfig, functionName: 'round' })).toString()
    const redScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [currentSeason, RED_TEAM_NUMBER] })).toString()
    const blueScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [currentSeason, BLUE_TEAM_NUMBER] })).toString()
    const redContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [RED_TEAM_NUMBER, currentSeason] }) as bigint
    const blueContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [BLUE_TEAM_NUMBER, currentSeason] }) as bigint
    const roundEnd = (await client.readContract({ ...contractConfig, functionName: 'roundEnd' })).toString()


    return { props: { currentGame, currentRound, redScore, blueScore, prizePool: (redContributions + blueContributions).toString(), roundEnd: roundEnd }, revalidate: 60 }
}
