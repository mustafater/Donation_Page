#!/usr/bin/env bash
set -euo pipefail

SOURCE_ACCOUNT="${1:-${STELLAR_ACCOUNT:-default}}"
NETWORK="${STELLAR_NETWORK:-testnet}"
CONTRACT_ALIAS="${STELLAR_CONTRACT_ALIAS:-donation_registry}"
WASM_PATH="target/wasm32v1-none/release/donation_registry.wasm"

echo "Building donation registry contract..."
stellar contract build --manifest-path contracts/donation_registry/Cargo.toml

echo "Deploying to ${NETWORK} with source account '${SOURCE_ACCOUNT}'..."
CONTRACT_ID="$(
  stellar contract deploy \
    --wasm "${WASM_PATH}" \
    --source-account "${SOURCE_ACCOUNT}" \
    --network "${NETWORK}" \
    --alias "${CONTRACT_ALIAS}"
)"

echo "Donation registry contract id:"
echo "${CONTRACT_ID}"
echo
echo "Add this to your .env file:"
echo "PUBLIC_STELLAR_CONTRACT_ID=${CONTRACT_ID}"
