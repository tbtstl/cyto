import * as React from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/game.module.css'
import { createPublicClient, formatEther, http } from 'viem';
import { USE_MAINNET, CONTRACT_ADDRESS, RED_TEAM_NUMBER, BLUE_TEAM_NUMBER } from '../constants/utils'
import { zora, zoraTestnet } from 'viem/chains';
import abi from '../constants/abi.json'
import { ContentBox } from '../components/contentBox'

import { FooterButtons } from '../components/footerButtons';
import { Button } from '../components/button';
import { GetStaticProps } from 'next';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { GameBoard } from '../components/gameBoard';

export default function Page() {
    const router = useRouter();
    const { address, isDisconnected } = useAccount()

    useEffect(() => {
        if (isDisconnected) {
            router.push('/')
        }
    }, [isDisconnected])


    return (
        <>
            <div className={`center ${styles.pageContainer}`}>
                <GameBoard />
                <ContentBox>
                    <h1>CELLULAR ENERGY</h1>
                    <p>
                        This is game <b>4</b> of <b>7</b>.<br />
                        <span className='blue'><b>Team Blue</b></span> is currently winning this season with <b>44 points</b>.
                        <span className='red'><b>Team Red</b></span> currently has <b>32 points</b>.
                    </p>
                    <p>The next evolution will occur in <b>3:45</b></p>
                    <p>
                        Place a cell on the grid by clicking on an empty space. <br />
                        If it survives the next evolution, your team will earn a point.
                    </p>
                    <p>
                        The current cost to place a cell is <b>0.0004 ETH</b>.<br />
                        You've contributed <b>14%</b> of the cells on your team. <br />
                        The current prize pool is <b>0.19 ETH</b>.
                    </p>
                </ContentBox>
            </div>
        </>
    )
}


