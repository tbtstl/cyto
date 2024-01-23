import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { zora } from "wagmi/chains";
import { USE_MAINNET } from '../constants/utils'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { AppProps } from 'next/app'
import { zoraSepolia } from "viem/chains";
import Head from "next/head";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [USE_MAINNET ? zora : zoraSepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "CYTO",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID as string,
  chains,
});

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <Head>
          <title>CYTO</title>
          <meta
            name="description"
            content="CYTO is a game of cellular evolution"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
