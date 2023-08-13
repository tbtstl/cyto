import * as React from 'react'
import { useRouter } from 'next/router'
import { createPublicClient, formatEther, http } from 'viem';
import { USE_MAINNET, CONTRACT_ADDRESS, RED_TEAM_NUMBER, BLUE_TEAM_NUMBER } from '../constants/utils'
import { zora, zoraTestnet } from 'viem/chains';
import abi from '../constants/abi.json';
import { ContentBox } from '../components/contentBox'

import { FooterButtons } from '../components/footerButtons';
import { Button } from '../components/button';
import { GetStaticProps } from 'next';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface GameStats {
    currentGame: string,
    redScore: string,
    blueScore: string,
    prizePool: string
}

export default function Page(gameStats: GameStats) {
    const router = useRouter();
    const { openConnectModal } = useConnectModal();
    const { address } = useAccount()


    const tie = BigInt(gameStats.blueScore) === BigInt(gameStats.redScore);
    const teamBlueWinning = BigInt(gameStats.blueScore) > BigInt(gameStats.redScore);

    return (
        <div className='center'>
            <ContentBox >
                <h1>CELLULAR ENERGY</h1><br />
                <p>Welcome to CELLULAR ENERGY.</p>
                <p>
                    We are in game <b>{gameStats.currentGame}</b>.<br />
                    <span className="blue"><b>Team Blue</b></span>&nbsp;{!tie && teamBlueWinning ? 'is currently winning with ' : 'currently has '} <b>{gameStats.blueScore} points</b>.<br />
                    <span className="red"><b>Team Red</b></span>&nbsp;{!tie && !teamBlueWinning ? 'is currently winning with ' : 'currently has'} <b>{gameStats.redScore} points</b>.<br />
                    The current prize pool contains <b>{formatEther(BigInt(gameStats.prizePool))} ETH</b>.
                </p>
                <p>Connect to ZORA to join the game.</p>
            </ContentBox>
            <FooterButtons>
                <Button onClick={() => address ? router.push('/game') : openConnectModal && openConnectModal()}>
                    {address ? 'Play Game' : 'Connect to ZORA'}
                </Button>
                <Button onClick={() => { router.push('/how-to-play') }}>How to Play</Button>
            </FooterButtons>
        </div>
    )
}


export const getStaticProps: GetStaticProps<GameStats> = async () => {
    const client = createPublicClient({
        chain: USE_MAINNET ? zora : zoraTestnet,
        transport: http()
    })
    const contractConfig = { address: CONTRACT_ADDRESS, abi }

    const currentGame = (await client.readContract({ ...contractConfig, functionName: 'currentGame' }) as bigint).toString()
    const redScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [RED_TEAM_NUMBER, currentGame] }) as bigint).toString()
    const blueScore = (await client.readContract({ ...contractConfig, functionName: 'teamScore', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint).toString()
    const redContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [RED_TEAM_NUMBER, currentGame] }) as bigint
    const blueContributions = await client.readContract({ ...contractConfig, functionName: 'teamContributions', args: [BLUE_TEAM_NUMBER, currentGame] }) as bigint

    return { props: { currentGame, redScore, blueScore, prizePool: (redContributions + blueContributions).toString() }, revalidate: 60 }
}
