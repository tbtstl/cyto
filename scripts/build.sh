#!/bin/bash
set -e

mkdir -p build

if [ -f ./pot20_final.ptau ]; then
    echo "pot20_final.ptau already exists. Skipping download."
else
    echo 'Downloading pot20...'
    curl https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau -o pot20_final.ptau
fi

echo "Compiling: main..."

# compile circuit
mkdir -p build/circom

start=$SECONDS
circom circuits/main.circom --r1cs --wasm --sym -o build/circom
duration=$(( SECONDS - start ))
echo "Circuit compiled in $duration seconds"
snarkjs r1cs info build/circom/main.r1cs

# Create a new zkey
echo "Creating zkey..."
start=$SECONDS
snarkjs plonk setup circuit.r1cs pot20_final.ptau circuit_final.zkey
duration=$(( SECONDS - start ))
echo "Zkey created in $duration seconds"

echo "Exporting verification key..."
start=$SECONDS
snarkjs zkey export verificationkey build/circom/circuit_final.zkey build/circom/verification_key.json
duration=$(( SECONDS - start ))
echo "Verification key exported in $duration seconds"

# generate solidity contract
mkdir -p contracts/
echo "Generating solidity contract..."
start=$SECONDS
snarkjs zkey export solidityverifier build/circom/circuit_final.zkey contracts/verifier.sol
duration=$(( SECONDS - start ))
echo "Solidity contract generated in $duration seconds"
