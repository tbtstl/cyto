import { hexToBigInt } from 'viem';
import abi from './abi.json'
export const USE_MAINNET = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';
export const GRID_SIZE = 64;
export const CELL_SIZE_BITS = 2;
export const MAX_CELL_VALUE = 3;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CELLULAR_ENERGY_ADDRESS as `0x${string}`;
export const BLUE_TEAM_NUMBER = 1;
export const RED_TEAM_NUMBER = 2;

export async function constructGridFromContractData(client, contractAddress): Promise<[number[][], BigInt[]]> {
    const grid: number[][] = Array.from(Array(GRID_SIZE), () => [...Array(GRID_SIZE).fill(0)]);
    const rowInputs: BigInt[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        const rowHex = await client.readContract({
            address: contractAddress,
            abi,
            functionName: 'board',
            args: [i]
        }) as `0x${string}`;
        const rowBigInt = hexToBigInt(rowHex);
        rowInputs.push(rowBigInt);
        for (let j = 0; j < GRID_SIZE; j++) {
            const bitPosition = (GRID_SIZE - 1 - j) * CELL_SIZE_BITS;
            const bitMask = BigInt(MAX_CELL_VALUE) << BigInt(bitPosition);

            grid[i][j] = parseInt(((rowBigInt & bitMask) >> BigInt(bitPosition)).toString());
        }
    }
    return [grid as number[][], rowInputs as BigInt[]];
}
