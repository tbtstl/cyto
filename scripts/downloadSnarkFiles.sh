#!/bin/bash

# Download the snark files from the server
VERIFICATION_KEY_LOCAL_PATH="verification_key.json"
CIRCUIT_KEY_LOCAL_PATH="circuit_final.zkey"
CIRCUIT_WASM_LOCAL_PATH="circuit.wasm"
API_ROUTE=".next/server/pages/api"

echo "Downloading verification key from $VERIFICATION_KEY_URL"
curl -o $API_ROUTE/$VERIFICATION_KEY_LOCAL_PATH $VERIFICATION_KEY_URL;
echo "Downloaded verification key to $API_ROUTE/$VERIFICATION_KEY_LOCAL_PATH"

echo "Downloading circuit key..."
curl -o $API_ROUTE/$CIRCUIT_KEY_LOCAL_PATH $ZKEY_URL;
echo "Downloaded circuit key to $API_ROUTE/$CIRCUIT_KEY_LOCAL_PATH"

echo "Downloading circuit wasm..."
curl -o $API_ROUTE/$CIRCUIT_WASM_LOCAL_PATH $CIRCUIT_WASM_URL;
echo "Downloaded circuit wasm to $API_ROUTE/$CIRCUIT_WASM_LOCAL_PATH"

echo "Finished downloading snark files"
echo "$(ls $API_ROUTE/)"
