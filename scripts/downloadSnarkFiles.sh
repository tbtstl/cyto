#!/bin/bash

# Download the snark files from the server
VERIFICATION_KEY_LOCAL_PATH="verification_key.json"
CIRCUIT_KEY_LOCAL_PATH="circuit_final.zkey"
CIRCUIT_WASM_LOCAL_PATH="circuit.wasm"

echo "Downloading verification key..."
curl -o $VERIFICATION_KEY_LOCAL_PATH $VERIFICATION_KEY_URL;
echo "Downloaded verification key to $VERIFICATION_KEY_LOCAL_PATH"

echo "Downloading circuit key..."
curl -o $CIRCUIT_KEY_LOCAL_PATH $CIRCUIT_KEY_URL;
echo "Downloaded circuit key to $CIRCUIT_KEY_LOCAL_PATH"

echo "Downloading circuit wasm..."
curl -o $CIRCUIT_WASM_LOCAL_PATH $CIRCUIT_WASM_URL;
echo "Downloaded circuit wasm to $CIRCUIT_WASM_LOCAL_PATH"

echo "Finished downloading snark files"
