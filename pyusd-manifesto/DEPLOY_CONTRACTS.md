# Deploy PYUSD Manifesto Contracts to Solana Devnet

## ✅ Current Status

Your contracts are **ready to deploy**:
- ✅ Escrow contract - Complete
- ✅ Recurring payment contract - Complete
- ✅ Multisig wallet contract - Complete
- ✅ **Staking/Yield farming contract - Complete** (NEW!)
- ✅ All contracts compile successfully
- ✅ Updated to Anchor 0.32.1

## 🚀 Deployment Options

### **Option 1: GitHub Actions (Recommended)**

This is the easiest and most reliable method.

#### **Step 1: Add Deployment Keypair to GitHub Secrets**

```bash
# Copy your keypair
cat ~/.config/solana/id.json | pbcopy

# Or view it
cat ~/.config/solana/id.json
```

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SOLANA_DEPLOY_KEYPAIR`
5. Value: Paste the entire JSON keypair
6. Click **Add secret**

#### **Step 2: Trigger Deployment**

```bash
# Commit the workflow file
git add .github/workflows/deploy-contracts.yml
git commit -m "Add contract deployment workflow"
git push origin main

# Or manually trigger from GitHub Actions tab
```

#### **Step 3: Monitor Deployment**

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the deployment progress
4. Once complete, download artifacts

#### **Step 4: Download Artifacts**

After successful deployment:
1. Go to the completed workflow run
2. Scroll to **Artifacts** section
3. Download `program-artifacts.zip`
4. Extract and find:
   - `pyusd_manifesto_contracts.so` - The deployed program
   - `pyusd_manifesto_contracts.json` - The IDL file
   - `pyusd_manifesto_contracts-keypair.json` - Program keypair

---

### **Option 2: Local Deployment (If toolchain works)**

If you can get the Rust toolchain working:

```bash
# Set to devnet
solana config set --url https://api.devnet.solana.com

# Check balance (need ~5 SOL for deployment)
solana balance

# Request airdrop if needed
solana airdrop 2

# Build contracts
anchor build

# Deploy to devnet
anchor deploy

# View program ID
solana address -k target/deploy/pyusd_manifesto_contracts-keypair.json
```

---

### **Option 3: Use Solana Playground**

Upload and deploy via browser:

1. Go to https://beta.solpg.io/
2. Create new project with Anchor framework
3. Replace `lib.rs` with your contracts
4. Add other contract files (escrow.rs, staking.rs, etc.)
5. Build in browser
6. Deploy to devnet
7. Download IDL

---

## 📦 After Deployment

### **1. Get the Program ID**

From GitHub Actions output or:
```bash
solana address -k target/deploy/pyusd_manifesto_contracts-keypair.json
```

### **2. Update Program ID in Code**

If different from current ID (`Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`):

**Update Anchor.toml:**
```toml
[programs.devnet]
pyusd_manifesto_contracts = "YOUR_NEW_PROGRAM_ID"
```

**Update lib/contracts/types.ts:**
```typescript
export const PYUSD_MANIFESTO_PROGRAM_ID = new PublicKey('YOUR_NEW_PROGRAM_ID')
```

### **3. Copy IDL File**

```bash
# Copy the downloaded IDL
cp pyusd_manifesto_contracts.json lib/contracts/idl.json
```

### **4. Generate TypeScript Types**

```bash
# Install Anchor TypeScript
npm install @coral-xyz/anchor

# Types will be auto-generated from IDL
```

---

## 🔧 Integration with Frontend

After deployment, integrate the contracts:

### **For Staking:**

Replace `lib/staking-manager.ts` calls with actual program calls:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import idl from './contracts/idl.json'

// Initialize program
const program = new Program(idl, provider)

// Stake tokens
await program.methods
  .stake(amount, lockPeriod)
  .accounts({
    stakingPool,
    userStake,
    userTokenAccount,
    poolTokenAccount,
    user: wallet.publicKey,
    stakeMint,
    tokenProgram,
    associatedTokenProgram,
    systemProgram,
  })
  .rpc()

// Claim rewards
await program.methods
  .claimRewards()
  .accounts({...})
  .rpc()
```

### **For Escrow:**

Similar integration for escrow operations.

### **For Recurring Payments:**

Integrate recurring payment contract calls.

### **For Multisig:**

Integrate multisig wallet operations.

---

## 📊 Verify Deployment

### **Check Program on Solana Explorer:**

```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

### **Test Contract Functions:**

```bash
# Initialize staking pool (admin only)
anchor run initialize-staking-pool

# Test staking (from frontend or CLI)
```

---

## 🎯 Current Program Features

### **Staking Contract:**
- ✅ 4-tier system (Bronze, Silver, Gold, Diamond)
- ✅ Lock periods with multipliers
- ✅ Continuous reward calculation
- ✅ Auto-compound functionality
- ✅ Flexible unstaking

### **Escrow Contract:**
- ✅ Create payment requests
- ✅ Fund with tokens
- ✅ Claim before expiry
- ✅ Cancel after expiry

### **Recurring Payments:**
- ✅ Schedule automatic payments
- ✅ Execute on interval
- ✅ Cancel anytime

### **Multisig:**
- ✅ Multi-owner wallets
- ✅ Proposal system
- ✅ Threshold approvals

---

## 🔒 Security Notes

1. **Keypair Security:**
   - ✅ GitHub secret is encrypted
   - ✅ Only accessible during workflow
   - ⚠️ Never commit keypairs to repo

2. **Program Authority:**
   - Admin functions require authority signature
   - User functions require user signature
   - PDA accounts prevent unauthorized access

3. **Token Safety:**
   - All token transfers use CPI
   - PDAs hold custody, not external accounts
   - Lock periods enforced on-chain

---

## 📝 Deployment Checklist

- [ ] Contracts compile with `cargo check`
- [ ] Added `SOLANA_DEPLOY_KEYPAIR` to GitHub secrets
- [ ] Pushed deployment workflow to GitHub
- [ ] Monitored deployment in Actions tab
- [ ] Downloaded program artifacts
- [ ] Updated program ID in code (if changed)
- [ ] Copied IDL to `lib/contracts/idl.json`
- [ ] Tested on Solana Explorer
- [ ] Integrated with frontend
- [ ] Tested all contract functions

---

## 🆘 Troubleshooting

### **Build fails on ARM Mac:**
✅ Use GitHub Actions (Linux) - this avoids ARM toolchain issues

### **Insufficient SOL for deployment:**
```bash
solana airdrop 2
```

### **Program deployment fails:**
- Check if program ID already exists
- Ensure keypair has enough SOL
- Verify Anchor.toml configuration

### **IDL not generated:**
```bash
anchor build
# IDL is in target/idl/pyusd_manifesto_contracts.json
```

---

## 🎉 Success Criteria

After successful deployment:
- ✅ Program visible on Solana Explorer
- ✅ IDL file generated
- ✅ Program ID matches in all configs
- ✅ Can call contract functions from frontend
- ✅ All 4 features working (escrow, recurring, multisig, staking)

---

## 📞 Support

If you encounter issues:
- Check GitHub Actions logs
- Verify Solana CLI configuration
- Review Anchor documentation
- Test on Solana Playground first

**Ready to deploy? Start with GitHub Actions (Option 1)!** 🚀
