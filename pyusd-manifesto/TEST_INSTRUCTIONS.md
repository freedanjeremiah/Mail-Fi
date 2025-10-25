# 🧪 Testing Instructions - _bn Error Fix

## Latest Fix Applied

Changed the Program constructor call order in `anchor-setup.ts`:

```typescript
// OLD (causing _bn error):
return new Program(idl, programAddress, provider)

// NEW (correct order):
return new Program(idl, provider, programAddress)
```

The issue was the **argument order**. Anchor 0.32.x expects:
1. IDL
2. Provider  
3. Program Address (optional)

---

## 🧪 Manual Testing Steps

### Step 1: Open Browser
Visit: **http://localhost:3000/escrow**

### Step 2: Open Browser Console
Press **F12** or **Cmd+Option+I**

### Step 3: Connect Phantom Wallet
1. Click "Select Wallet" button
2. Choose Phantom
3. Approve connection
4. **Verify Phantom is on Devnet**

### Step 4: Check Console Logs

**You should see:**
```
✅ Wallet connected: [your address]
Loading escrows for wallet: [your address]
```

**You should NOT see:**
```
❌ Cannot read properties of undefined (reading '_bn')
```

### Step 5: Check Debug Panel

Look at **bottom-right corner**:
```
🔍 Wallet Debug Info
Connected: ✅ Yes
PublicKey: ✅ Exists
Address: [Your Solana address]
Wallet Name: Phantom
```

### Step 6: Try Creating an Escrow

1. Fill in the form:
   - **Recipient Address**: Any valid Solana address (or use your own for testing)
   - **Amount**: 1 (or any amount)
   - **Expiry**: 7 days
   - **Description**: "Test escrow"

2. Click **"Create Escrow"**

3. **Check console** - should see:
   ```
   Creating escrow with wallet: [your address]
   ✅ Wallet connected: [your address]
   ```

4. **Phantom popup** should appear asking you to approve

5. **After approval** - should see success message

---

## 🐛 If You Still See _bn Error

The error might be coming from a different source. Check:

### 1. Clear Browser Cache
```bash
# Hard refresh
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)
```

### 2. Check Which Line is Failing

Look at the error stack trace:
```
at getProgram (lib/contracts/anchor-setup.ts:76:10)
```

Line 76 should be: `return new Program(idl, provider, programAddress)`

### 3. Verify IDL is Valid

The IDL might have issues. Check:
```bash
cat lib/contracts/idl.json | jq .
```

Should show valid JSON without errors.

### 4. Check Anchor Version

```bash
npm list @coral-xyz/anchor
```

Should show: `@coral-xyz/anchor@0.32.1`

---

## 📊 Expected vs Actual

### ✅ Expected Behavior:
- No `_bn` errors in console
- Wallet connects successfully
- Console shows: `✅ Wallet connected: [address]`
- Escrows load (or show "No escrows found")
- Create escrow button works
- Phantom popup appears for transactions

### ❌ If Still Broken:
- `_bn` error still appears
- Console shows error at line 76
- Transactions fail immediately
- No Phantom popup

---

## 🔧 Alternative Fix (If Still Failing)

If the error persists, we may need to:

1. **Downgrade Anchor** to 0.30.x
2. **Use a different IDL format**
3. **Mock the contract calls** for testing
4. **Use raw Solana transactions** instead of Anchor

Let me know which error you see and I'll apply the appropriate fix!

---

## 📝 What to Report

Please share:

1. **Screenshot of console** showing any errors
2. **Screenshot of debug panel** (bottom-right)
3. **Exact error message** if _bn error still appears
4. **Line number** where error occurs
5. **What happens** when you click "Create Escrow"

This will help me identify if it's:
- IDL format issue
- Anchor version issue  
- Program address issue
- Provider configuration issue

---

## 🎯 Success Criteria

Test is successful when:
- ✅ Page loads without errors
- ✅ Wallet connects without errors
- ✅ Console shows wallet address
- ✅ No `_bn` errors anywhere
- ✅ Create escrow form is clickable
- ✅ Phantom popup appears (even if transaction fails due to no funds)

The transaction itself may fail (no SOL, no PYUSD, etc.) but that's OK!
We just need to verify the **_bn error is gone** and **wallet connection works**.

---

**Server running at**: http://localhost:3000/escrow

**Test now and report back!** 🚀
