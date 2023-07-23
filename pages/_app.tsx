import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import {
    zora,
    zoraTestnet
} from 'wagmi/chains';
import { USE_MAINNET } from '../constants/utils'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { AppProps } from 'next/app'

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [USE_MAINNET ? zora : zoraTestnet],
    [publicProvider()]
)

const { connectors } = getDefaultWallets({ appName: 'CELLULAR ENERGY', projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID as string, chains })

const config = createConfig({
    autoConnect: false,
    connectors,
    publicClient,
    webSocketPublicClient
})

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <WagmiConfig config={config}>
            <RainbowKitProvider chains={chains}>
                <Component {...pageProps} />
            </RainbowKitProvider>
        </WagmiConfig>
    )
}
