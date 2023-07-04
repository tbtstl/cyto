import { type Chain } from '@wagmi/core/chains';
export const USE_MAINNET = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';
export const GRID_SIZE = 64;
export const CELL_SIZE_BITS = 2;
export const MAX_CELL_VALUE = 3;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CELLULAR_ENERGY_ADDRESS as `0x${string}`;
export const BLUE_TEAM_NUMBER = 1;
export const RED_TEAM_NUMBER = 2;

// Temporary until SSL certs on testnet rpc are fixed
export const zoraTestnet: Chain = {
    id: 999,
    name: 'Zora Goerli Testnet',
    network: 'zora-goerli',
    nativeCurrency: {
        decimals: 18,
        name: 'Zora Goerli',
        symbol: 'ETH',
    },
    rpcUrls: {
        public: { http: ['https://testnet.rpc.zora.co'] },
        default: { http: ['wss://testnet.rpc.zora.co'] },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://testnet.explorer.zora.energy' },
    },
    contracts: {
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 189123,
        },
    },
    testnet: true,

}
