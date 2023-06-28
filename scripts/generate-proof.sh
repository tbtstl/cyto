#!/bin/bash

set -e

mkdir -p build

mkdir -p build/circom

# generate witness
echo "Generating witness..."
start=$SECONDS
node "build/circom/main_js/generate_witness.js" build/circom/main_js/main.wasm input.json build/circom/witness.wtns
duration=$(( SECONDS - start ))
echo "Witness generated in $duration seconds"
        
# generate proof
echo "Generating proof..."
start=$SECONDS
snarkjs plonk prove build/circom/circuit_final.zkey build/circom/witness.wtns build/circom/proof.json build/circom/public.json
duration=$(( SECONDS - start ))
echo "Proof generated in $duration seconds"

# verify proof
echo "Verifying proof..."
start=$SECONDS
snarkjs plonk verify build/circom/verification_key.json build/circom/public.json build/circom/proof.json
duration=$(( SECONDS - start ))
echo "Proof verified in $duration seconds"

# generate call
echo "Generating call..."
start=$SECONDS
snarkjs zkey export soliditycalldata build/circom/public.json build/circom/proof.json > build/circom/call.txt
duration=$(( SECONDS - start ))
echo "Call generated in $duration seconds"
