# Cellular

## Build
Setup Circom
```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh # only required if rust is not already installed

git clone https://github.com/iden3/circom.git

cd circom

cargo build --release
cargo install --path circom

npm install -g snarkjs@latest
```

Install dependencies
```bash
yarn
```

Build the circuits
```bash
yarn build
```

## Verify a Proof
Verify with your shell
```bash
yarn gen-proof
```

(Smart contract verification example coming soon)
