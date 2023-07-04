import * as React from 'react'
import { useRouter } from 'next/router'
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

export default function Page() {
    const router = useRouter();
    const { address, isDisconnected } = useAccount()

    useEffect(() => {
        if (isDisconnected) {
            router.push('/')
        }
    }, [isDisconnected])


    return (
        <div className='center'>
            welcome, {address}
        </div>
    )
}


