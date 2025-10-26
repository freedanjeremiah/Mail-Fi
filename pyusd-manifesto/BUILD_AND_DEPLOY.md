# Build and Deploy Guide for PYUSD Manifesto Contracts

## Prerequisites Installation

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Solana CLI Tools
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

Verify installation:
```bash
solana --version
```

### 3. Install Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
```

Verify installation:
```bash
anchor --version
```

## Configuration

### 1. Set Solana to Devnet
```bash
solana config set --url https://api.devnet.solana.com
```

### 2. Create/Import Wallet
Create new wallet:
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

Or import existing wallet if you have one.

### 3. Get Devnet SOL
```bash
solana airdrop 2
```

Repeat if needed (you'll need SOL for deployment).

## Build the Contracts

### Option 1: Using Anchor (Recommended)
```bash
# From project root
anchor build
```

This will compile all contracts in the `programs/` directory.

### Option 2: Using Cargo Build-BPF
```bash
cd programs/pyusd-manifesto-contracts
cargo build-bpf
```

## Deploy the Contracts

### Using Anchor
```bash
# From project root
anchor deploy
```

This will:
1. Build the program
2. Deploy to devnet
3. Output the Program ID

### Manual Deployment
```bash
# If you built with cargo build-bpf
solana program deploy target/deploy/pyusd_manifesto_contracts.so
```

## After Deployment

### 1. Note Your Program ID
The deployment will output a Program ID like:
```
Program Id: <YOUR_NEW_PROGRAM_ID>
```

### 2. Update Anchor.toml
Edit `Anchor.toml` and replace the program ID on line 9:
```toml
[programs.devnet]
pyusd_manifesto_contracts = "<YOUR_NEW_PROGRAM_ID>"
```

### 3. Update UI Configuration
Update the program ID in your UI code:

**File: `lib/contracts/program-id.ts`**
```typescript
export const PROGRAM_ID = new PublicKey('<YOUR_NEW_PROGRAM_ID>');
```

**File: `lib/contracts/anchor-setup.ts`**
Update the PROGRAM_ID constant if it exists there as well.

## Verify Deployment

### Check Program Account
```bash
solana program show <YOUR_PROGRAM_ID>
```

### Check Account Info
```bash
solana account <YOUR_PROGRAM_ID>
```

## Testing the Contracts

### Run Anchor Tests (if you have test files)
```bash
anchor test
```

### Test from UI
1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000
3. Connect your wallet (make sure it's on Devnet)
4. Test each feature:
   - Escrow creation and funding
   - Multisig wallet creation
   - Staking/Yield farming
   - Recurring payments

## Contract Features Implemented

### 1. Escrow Contract
- **Create Escrow**: Lock funds with expiry time
- **Fund Escrow**: Transfer PYUSD to escrow
- **Claim Escrow**: Recipient claims before expiry
- **Cancel Escrow**: Creator refunds after expiry

### 2. Multisig Contract
- **Create Multisig**: Setup wallet with M-of-N signatures
- **Propose Transaction**: Any owner can propose
- **Approve Transaction**: Owners vote
- **Execute Transaction**: Execute when threshold met
- **Reject Transaction**: Cancel proposal

### 3. Yield Farming/Staking Contract
- **Initialize Pool**: Setup staking pool
- **Stake**: Lock PYUSD with lock periods (None/30d/90d/180d)
- **Claim Rewards**: Withdraw earned rewards
- **Unstake**: Withdraw staked amount after lock
- **Compound**: Reinvest rewards

**Tier System:**
- Bronze (100-999 PYUSD): 8% base APY
- Silver (1,000-9,999 PYUSD): 15% base APY
- Gold (10,000-49,999 PYUSD): 25% base APY
- Diamond (50,000+ PYUSD): 40% base APY

**Lock Multipliers:**
- None: 1.0x
- 30 days: 1.3x
- 90 days: 1.7x
- 180 days: 2.5x

### 4. Recurring Payments Contract
- **Create Recurring**: Setup scheduled payments
- **Execute Payment**: Process next payment
- **Cancel Recurring**: Stop future payments

**Intervals:**
- Daily
- Weekly
- Monthly

## Troubleshooting

### Build Errors
If you get dependency errors:
```bash
cd programs/pyusd-manifesto-contracts
cargo update
```

### Deployment Fails
- Ensure you have enough SOL: `solana balance`
- Get more SOL: `solana airdrop 2`
- Check network: `solana config get`

### Program Size Too Large
If program exceeds size limits:
```bash
# Build with optimizations
cargo build-bpf --release
```

### Account Creation Fails
Make sure your wallet has enough SOL for:
- Transaction fees
- Rent for PDA accounts

## Important Notes

1. **Token Program**: Contracts use SPL Token-2022 for PYUSD compatibility
2. **PDA Seeds**: All accounts use deterministic PDAs for easy retrieval
3. **Discriminators**: Each instruction has unique 8-byte discriminator matching UI
4. **Rent**: All PDA accounts are rent-exempt
5. **Security**: Proper signer checks and ownership validation

## Contract Architecture

```
lib.rs (Main entry point)
├── escrow.rs (Escrow logic)
├── multisig.rs (Multisig logic)
├── yield_farming.rs (Staking logic)
└── recurring.rs (Recurring payments logic)
```

## Mainnet Deployment

**WARNING**: Only deploy to mainnet after thorough testing!

1. Switch to mainnet:
   ```bash
   solana config set --url https://api.mainnet-beta.solana.com
   ```

2. Ensure sufficient SOL for deployment (~5-10 SOL)

3. Deploy:
   ```bash
   anchor deploy --provider.cluster mainnet
   ```

4. Update all UI references to mainnet program ID

## Support

If you encounter issues:
1. Check Solana program logs: `solana logs <PROGRAM_ID>`
2. Use `anchor test` for detailed error messages
3. Review transaction on Solana Explorer: https://explorer.solana.com/
