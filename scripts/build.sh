#!/bin/bash
set -e

mkdir -p build

if [ -f ./pot12_final.ptau ]; then
    echo "pot12_final.ptau already exists. Skipping."
else
    echo 'Creating pot12_final.ptau'
    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v;
    snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v;
    snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v;
fi

echo "Compiling: main..."

# compile circuit
mkdir -p build/circom

start=$SECONDS
circom circuits/main.circom --r1cs --wasm --sym -o build/circom
duration=$(( SECONDS - start ))
echo "Circuit compiled in $duration seconds"
snarkjs r1cs info build/circom/main.r1cs

# Start a new zkey and make a contribution
echo "Creating zkey..."
start=$SECONDS
snarkjs plonk setup build/circom/main.r1cs pot12_final.ptau build/circom/circuit_final.zkey
duration=$(( SECONDS - start ))
echo "Zkey created in $duration seconds"
# snarkjs zkey contribute build/circom/circuit_0000.zkey build/circom/circuit_final.zkey --name="1st Contributor Name" -v -e="$1"

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
