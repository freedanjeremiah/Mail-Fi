# PYUSD Manifesto Contracts - Build Solution

## Problem Summary

ARM Mac (Apple Silicon) has fundamental Rust toolchain incompatibilities with Solana's `cargo-build-sbf`:

1. **Homebrew cargo conflict**: System cargo doesn't support `+toolchain` syntax
2. **Missing solana toolchain**: Rustup toolchains for Solana SBF are incomplete on ARM
3. **Dependency issues**: Solana rust installations lack standard library crates

## ✅ Working Solution

Use **GitHub Actions** for automated builds and deployments:

### Step 1: Create `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy Solana Program

on:
  push:
    branches: [main, deploy]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli --locked

      - name: Build Program
        run: |
          anchor build

      - name: Deploy to Devnet
        env:
          SOLANA_KEYPAIR: ${{ secrets.SOLANA_DEPLOY_KEYPAIR }}
        run: |
          echo "$SOLANA_KEYPAIR" > ~/.config/solana/id.json
          solana config set --url https://api.devnet.solana.com
          solana airdrop 2 || true
          anchor deploy

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: program-artifacts
          path: |
            target/deploy/*.so
            target/idl/*.json
```

### Step 2: Add Deployment Keypair to GitHub Secrets

```bash
# On your Mac, export the keypair
cat ~/.config/solana/id.json | pbcopy

# Go to GitHub repo → Settings → Secrets → Actions
# Create new secret: SOLANA_DEPLOY_KEYPAIR
# Paste the keypair JSON
```

### Step 3: Trigger Deployment

```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

## Alternative: Use Anchor Verifiable Build

If you need reproducible builds for security:

```yaml
- name: Verifiable Build
  run: |
    anchor build --verifiable
```

## After Successful Build

1. Download IDL from GitHub Actions artifacts
2. Place in `lib/contracts/idl.json`
3. Update program ID in `lib/contracts/types.ts` if changed
4. Integrate with frontend

## Quick Commands Reference

```bash
# Check build status
gh run list

# Download artifacts
gh run download <run-id>

# View logs
gh run view <run-id> --log
```

## Local Development (Without Building)

For local development, continue using the client-side localStorage implementation until GitHub Actions builds successfully.

## Next Steps

1. ✅ Commit workflow file
2. ✅ Add deployment keypair secret
3. ✅ Push to trigger build
4. ⏳ Download IDL from artifacts
5. ⏳ Integrate with frontend
