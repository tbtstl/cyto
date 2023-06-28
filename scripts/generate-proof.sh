#!/bin/bash

set -e

mkdir -p build

mkdir -p build/circom

# generate witness
node "build/circom/main_js/generate_witness.js" build/circom/main_js/main.wasm input.json build/circom/witness.wtns
        
# generate proof
snarkjs plonk prove build/circom/circuit_final.zkey build/circom/witness.wtns build/circom/proof.json build/circom/public.json

# verify proof
snarkjs plonk verify build/circom/verification_key.json build/circom/public.json build/circom/proof.json

# generate call
snarkjs zkey export soliditycalldata build/circom/public.json build/circom/proof.json > build/circom/call.txt
