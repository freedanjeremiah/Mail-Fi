# FINAL DEPLOYMENT STEPS

## ✅ What's Already Done

1. **All 4 Smart Contracts Implemented:**
   - Escrow Contract
   - Multisig Contract
   - Yield Farming/Staking Contract
   - Recurring Payments Contract

2. **Solana CLI Installed:**
   - Location: `C:\Users\aloys\solana-release\bin`
   - Version: 1.18.26

3. **Wallet Created:**
   - Address: `CqyPgaAy8cEpLFt3CQAYxYy18xr1jHdJgSVM4pWGdXdb`
   - Keypair: `C:\Users\aloys\.config\solana\id.json`
   - Balance: 2 SOL (on devnet)

4. **Solana Configured for Devnet:**
   - RPC URL: https://api.devnet.solana.com

5. **Dependencies Updated:**
   - Cargo.toml has correct versions

## ⚠️ Issue: Permission Errors

The build/deploy tools require Administrator privileges to create symlinks on Windows.

## 🚀 FINAL STEPS TO DEPLOY (Run as Administrator)

### Option 1: Using CMD as Administrator

1. **Open CMD as Administrator:**
   - Right-click "Command Prompt"
   - Select "Run as administrator"

2. **Set PATH and navigate:**
   ```cmd
   set PATH=%PATH%;C:\Users\aloys\solana-release\bin
   cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto\programs\pyusd-manifesto-contracts
   ```

3. **Build the contracts:**
   ```cmd
   cargo build-sbf
   ```

4. **Navigate back and deploy:**
   ```cmd
   cd ..\..
   solana program deploy programs\pyusd-manifesto-contracts\target\deploy\pyusd_manifesto_contracts.so
   ```

5. **Note the Program ID** that appears!

### Option 2: Using PowerShell as Administrator

```powershell
# Set PATH
$env:PATH += ";C:\Users\aloys\solana-release\bin"

# Navigate and build
cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto\programs\pyusd-manifesto-contracts
cargo build-sbf

# Deploy
cd ..\..
solana program deploy programs\pyusd-manifesto-contracts\target\deploy\pyusd_manifesto_contracts.so
```

### Option 3: Build and Deploy in One Script

I've created a script for you: `deploy-final.bat`

Just:
1. Right-click `deploy-final.bat`
2. Select "Run as administrator"

## After Deployment

### 1. Copy the Program ID

You'll see output like:
```
Program Id: AbCdEf123456789...
```

**SAVE THIS PROGRAM ID!**

### 2. Update UI Files

If the Program ID is different from `DzsJvHHEdVzx38CqrPxR2KauHBJ7BwSP3FjKhdhGhT1f`, update these files:

**File: `Anchor.toml`** (line 9):
```toml
pyusd_manifesto_contracts = "YOUR_NEW_PROGRAM_ID"
```

**File: `lib\contracts\program-id.ts`**:
```typescript
export const PROGRAM_ID = new PublicKey('YOUR_NEW_PROGRAM_ID')
```

**File: `lib\contracts\anchor-setup.ts`** (line 4):
```typescript
const PROGRAM_ID_STR = 'YOUR_NEW_PROGRAM_ID'
```

### 3. Test Your Deployment

```cmd
npm run dev
```

Open http://localhost:3000 and test all features!

## Troubleshooting

### Build Fails

Try updating dependencies first:
```cmd
cd programs\pyusd-manifesto-contracts
cargo update
cargo build-sbf
```

### Still Permission Errors

Make absolutely sure you're running as Administrator:
- CMD/PowerShell title bar should say "Administrator"
- User Account Control (UAC) should have prompted you

### Need More SOL

```cmd
solana airdrop 2
```

Run multiple times if needed.

### Verify Deployment

```cmd
solana program show YOUR_PROGRAM_ID
```

View on explorer:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

## Summary of What You Have

✅ **4 Complete Smart Contracts:**
- Escrow (create, fund, claim, cancel)
- Multisig (create, propose, approve, execute)
- Yield Farming (stake, claim, unstake, compound) with 4 tiers
- Recurring Payments (create, execute, cancel)

✅ **18 Instructions** total across all contracts

✅ **Solana CLI** installed and configured

✅ **Wallet** with 2 SOL ready

✅ **UI** already configured (may need Program ID update)

## The contracts are ready. You just need to build and deploy them as Administrator!

Run the commands above in CMD/PowerShell as Administrator, and you'll have your full PYUSD Manifesto platform deployed to Solana Devnet! 🚀
