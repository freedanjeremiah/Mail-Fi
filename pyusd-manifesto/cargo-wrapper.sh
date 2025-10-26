#!/bin/bash
# Strip +solana if present and use the solana cargo directly
args=("$@")
filtered_args=()
for arg in "${args[@]}"; do
  if [[ "$arg" != "+solana" ]]; then
    filtered_args+=("$arg")
  fi
done

exec ~/.cache/solana/v1.48/platform-tools/rust/bin/cargo.real "${filtered_args[@]}"
