
import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { zora, zoraTestnet } from 'viem/chains';
import path from 'path'
import { groth16 } from 'snarkjs';
import fs from 'fs';
import abi from '../../constants/abi.json';
import { USE_MAINNET, GRID_SIZE, CELL_SIZE_BITS, MAX_CELL_VALUE, CONTRACT_ADDRESS, constructGridFromContractData } from '../../constants/utils'
import axios from 'axios';


const VERIFICATION_KEY = '/tmp/verification_key.json'
const CIRCUIT_KEY = '/tmp/circuit_final.zkey'
const CIRCUIT_WASM = '/tmp/circuit.wasm'

export default async function handler(req: NextRequest, res: NextResponse<{ evolvedBoard: boolean }>) {
    const evolvedBoard = await handleEvolveBoardRequest()

    // @ts-ignore
    return res.json({ evolvedBoard })
}

const pathTo = (fn: string) => fn

async function handleEvolveBoardRequest() {
    const account = privateKeyToAccount(process.env.CELLULAR_ENERGY_VERIFIER_PK as `0x${string}`);
    const client = createWalletClient({
        account,
        chain: USE_MAINNET ? zora : zoraTestnet,
        transport: http()
    }).extend(publicActions)
    let evolvedBoard = false


    // First, check the time remaining in the round
    const roundEnd = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'roundEnd'
    }) as BigInt

    // If the game is still playable, no action is needed. 
    if (parseInt(roundEnd.toString()) > Date.now() / 1000) {
        console.log(`game is still playable for ${parseInt(roundEnd.toString()) - Date.now() / 1000} seconds`)
        return evolvedBoard
    } else {
        // Get the board state and deconstruct it into a 2D array
        console.log('constructing grid...');
        const [grid, rowInputs] = await constructGridFromContractData(client, CONTRACT_ADDRESS);
        // run game of life for one iteration, and return the rows as bigint strings
        console.log('generating output...')
        const rowOutputs = generateGameOfLifeOutput(grid as number[][]);

        console.log('downloading keys')
        await downloadSnarkFiles();

        // create the input JSON for snarkjs
        // console.log('writing snark input...')
        const snarkInput = {
            current: rowInputs.map(i => i.toString()),
            next: rowOutputs.map(i => i.toString())
        }

        console.log(fs.readdirSync(path.join(__dirname)));

        // use snarkjs to generate and verify the proof
        console.log('generating proof...')
        const { proof, publicSignals } = await generateProof(snarkInput);

        console.log('verifying proof...')
        await verifyProof(proof, publicSignals);

        console.log('generating calldata...')
        const rawCalldata = await groth16.exportSolidityCallData(proof, publicSignals);
        // snarkjs gives us a very unparsable output that we need to hand parse
        const calldataRegex = /(\[.+\]),(\[\[.+\]\]),(\[.*\]),(\[.*\])/;
        const calldata = rawCalldata.match(calldataRegex);
        if (!calldata || calldata.length !== 5) {
            throw new Error('calldata could not be parsed')
        }
        calldata.shift();
        const args = calldata.map((cd) => JSON.parse(cd));

        console.log('evolving board...')
        const { request } = await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'evolveBoardState',
            args
        })
        await client.writeContract(request)
        console.log('board evolved!')
        return true;
    }
}

function generateGameOfLifeOutput(grid: number[][]) {
    const newGrid = Array.from(Array(GRID_SIZE), () => [...Array(GRID_SIZE).fill(0)]);
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const neighbors = getNeighbors(grid, i, j);
            const cellValue = grid[i][j];
            if (neighbors.length < 2 || neighbors.length > 3) {
                newGrid[i][j] = 0;
            } else if (neighbors.length === 3 && cellValue === 0) {
                // If we're regenerating a dead cell, we want to pick the most common color
                newGrid[i][j] = neighbors.sort((a, b) =>
                    neighbors.filter(v => v === a).length
                    - neighbors.filter(v => v === b).length
                ).pop();
            } else {
                newGrid[i][j] = cellValue;
            }
        }
    }
    // Use the new computed grid to return the encoded output, an array of uint128 values;
    const outputBigInts: BigInt[] = []
    for (let i = 0; i < GRID_SIZE; i++) {
        // @ts-ignore TODO: fix tsconfig to allow bigint literals
        outputBigInts.push(0n);
        for (let j = 0; j < GRID_SIZE; j++) {
            const bitPosition = (GRID_SIZE - 1 - j) * CELL_SIZE_BITS;
            const cellValue = newGrid[i][j];

            const clearMask = ~(BigInt(MAX_CELL_VALUE) << BigInt(bitPosition));
            const setMask = BigInt(cellValue) << BigInt(bitPosition);
            // @ts-ignore
            const clearedRow = outputBigInts[i] & clearMask;
            const newRowValue = clearedRow | setMask;

            outputBigInts[i] = newRowValue;
        }
    }
    return outputBigInts;
}

function getNeighbors(grid: number[][], x: number, y: number) {
    const neighbors: number[] = [];
    for (let i = x - 1; i <= x + 1; i++) {
        if (i < 0 || i >= GRID_SIZE) {
            continue;
        }
        for (let j = y - 1; j <= y + 1; j++) {
            if (j < 0 || j >= GRID_SIZE) {
                continue;
            }
            if (i === x && j === y) {
                continue;
            }
            neighbors.push(grid[i][j]);
        }
    }
    return neighbors.filter(n => n !== 0);
}

async function generateProof(input: { current: string[], next: string[] }) {
    const { proof, publicSignals } = await groth16.fullProve(input, pathTo(CIRCUIT_WASM), pathTo(CIRCUIT_KEY));
    return { proof, publicSignals }
}

async function verifyProof(proof: string, publicSignals: string) {
    const verifier = JSON.parse(fs.readFileSync(pathTo(VERIFICATION_KEY), 'utf8'));
    const verified = await groth16.verify(verifier, publicSignals, proof);
    console.log({ verified })
    if (!verified) {
        console.error(`Proof not verified!`);
    }
}

async function downloadSnarkFiles() {
    const verificationKeyURL = process.env.VERIFICATION_KEY_URL as string
    const zkeyURL = process.env.ZKEY_URL as string
    const circuitWasmURL = process.env.CIRCUIT_WASM_URL as string


    // TODO: Promise.all and run these all in parallel
    await downloadFile(verificationKeyURL, VERIFICATION_KEY)
    await downloadFile(zkeyURL, CIRCUIT_KEY)
    await downloadFile(circuitWasmURL, CIRCUIT_WASM)
}

const downloadFile = async (url: string, name: string) => {
    const response = await axios.get(url, { responseType: 'stream' });
    const fileStream = response.data.pipe(fs.createWriteStream(name, { autoClose: true }));
    await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
    });
    console.log(`${name} downloaded successfully`);
}
