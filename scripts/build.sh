#!/bin/bash
set -e

mkdir -p build

if [ -f ./pot19_final.ptau ]; then
    echo "pot19_final.ptau already exists. Skipping download."
else
    echo 'Downloading pot19...'
    curl https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_19.ptau -o pot19_final.ptau
fi

# compile circuit
mkdir -p build/circom

echo "Compiling: main..."
start=$SECONDS
circom circuits/main.circom --r1cs --wasm --sym -o build/circom
duration=$(( SECONDS - start ))
echo "Circuit compiled in $duration seconds"
snarkjs r1cs info build/circom/main.r1cs

# Create a new zkey
echo "Creating zkey..."
start=$SECONDS
snarkjs groth16 setup build/circom/main.r1cs pot19_final.ptau build/circom/circuit_0000.zkey
echo "Making contributions..."
snarkjs zkey contribute build/circom/circuit_0000.zkey build/circom/circuit_0001.zkey --name="1st Contributor Name" -v -e=$(openssl rand -base64 45)
snarkjs zkey contribute build/circom/circuit_0001.zkey build/circom/circuit_0002.zkey --name="Second contribution Name" -v -e=$(openssl rand -base64 45)
echo "Adding beacon entropy..."
snarkjs zkey beacon build/circom/circuit_0002.zkey build/circom/circuit_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"
# snarkjs plonk setup build/circom/main.r1cs pot19_final.ptau build/circom/circuit_final.zkey
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
snarkjs zkey export solidityverifier build/circom/circuit_final.zkey src/BoardVerifier.sol
duration=$(( SECONDS - start ))
echo "Solidity contract generated in $duration seconds"
