# Phantom Wallet Testing Guide

## ✅ Setup Complete for Phantom Wallet

Your Mail-Fi app is now optimized for Phantom wallet with:
- Auto-connect enabled
- Error logging for debugging
- Wallet state debug panel
- Console logging for all transactions

---

## 🧪 Testing Steps

### **Step 1: Open the App**
Visit: http://localhost:3000/escrow

### **Step 2: Check Debug Panel**
Look at the **bottom-right corner** of the page. You should see:

```
🔍 Wallet Debug Info
Connected: ❌ No (or ✅ Yes if auto-connected)
Connecting: No
PublicKey: ❌ Null (or ✅ Exists)
Wallet Name: None (or Phantom)
```

### **Step 3: Connect Phantom Wallet**

1. Click the **"Select Wallet"** button at the top
2. Choose **Phantom** from the list
3. Approve the connection in Phantom popup
4. **IMPORTANT**: Make sure Phantom is set to **Devnet**
   - Open Phantom
   - Click Settings (gear icon)
   - Go to "Developer Settings"
   - Change network to "Devnet"

### **Step 4: Verify Connection**

After connecting, the debug panel should show:
```
🔍 Wallet Debug Info
Connected: ✅ Yes
PublicKey: ✅ Exists
Address: [Your Solana address]
Wallet Name: Phantom
```

### **Step 5: Check Browser Console**

Open browser console (F12 or Cmd+Option+I) and look for:
```
✅ Wallet connected: [Your address]
Loading escrows for wallet: [Your address]
```

---

## 🐛 Troubleshooting

### **Issue: "Wallet is not connected" error even when connected**

**Check these in order:**

1. **Is Phantom actually connected?**
   - Look at debug panel - does it show PublicKey: ✅ Exists?
   - If NO: Click "Select Wallet" and connect again

2. **Is Phantom on the correct network?**
   - Open Phantom → Settings → Developer Settings
   - Must be on **Devnet** (not Mainnet)

3. **Did you approve the connection?**
   - Phantom will show a popup asking to connect
   - Click "Connect" or "Approve"

4. **Try refreshing the page**
   - Sometimes wallet state needs a refresh
   - Press Cmd+R (Mac) or Ctrl+R (Windows)

5. **Check console for errors**
   - Look for red error messages
   - Share them with me if you see any

### **Issue: Debug panel shows "Connected: ❌ No" but PublicKey exists**

This is actually **OKAY**! The important check is:
- ✅ **PublicKey: ✅ Exists** ← This is what matters!

The `connected` property can be unreliable in some wallet adapter versions.
Our code now only checks `publicKey` existence.

### **Issue: Transactions fail with "publicKey not found"**

**Console logs to check:**
```javascript
// When you click "Create Escrow", you should see:
Creating escrow with wallet: [Your address]
✅ Wallet connected: [Your address]

// If you see this instead:
Wallet is not connected. Please connect your wallet first.
```

**If you see the error:**
1. Disconnect wallet completely
2. Refresh page
3. Connect again
4. Wait 2-3 seconds before trying transaction

---

## 📊 What the Console Logs Mean

### **Good Signs ✅**
```
✅ Wallet connected: ABC123...
Loading escrows for wallet: ABC123...
Creating escrow with wallet: ABC123...
```

### **Bad Signs ❌**
```
Wallet is not connected. Please connect your wallet first.
Error: Invalid wallet publicKey
Cannot read properties of undefined (reading '_bn')
```

---

## 🔍 Debug Information to Share

If you're still having issues, please share:

1. **Screenshot of debug panel** (bottom-right corner)
2. **Browser console logs** (any red errors)
3. **What happens when you:**
   - Click "Select Wallet"
   - Approve connection in Phantom
   - Try to create an escrow

---

## 💡 Expected Behavior

### **When Wallet is Disconnected:**
- Debug panel shows PublicKey: ❌ Null
- Page shows "Connect Your Wallet" message
- No escrows loaded
- No errors in console

### **When Wallet is Connected:**
- Debug panel shows PublicKey: ✅ Exists with your address
- PYUSD balance displays
- Console shows: "✅ Wallet connected: [address]"
- Console shows: "Loading escrows for wallet: [address]"
- Escrows load automatically (may be empty if none exist)

### **When Creating Escrow:**
- Console shows: "Creating escrow with wallet: [address]"
- Status message: "Creating escrow on-chain..."
- Phantom popup appears asking to approve transaction
- After approval: Success message with transaction link

---

## 🎯 Next Steps

Once wallet connection is working:
1. Get some Devnet SOL from https://faucet.solana.com/
2. Get some PYUSD test tokens
3. Try creating an escrow
4. Test fund/claim/cancel operations

---

## 📝 Notes

- The app uses **Solana Devnet** (test network)
- All transactions are on testnet (no real money)
- PYUSD Mint: `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`
- Program ID: `DzsJvHHEdVzx38CqrPxR2KauHBJ7BwSP3FjKhdhGhT1f`

---

**Tell me what you see in the debug panel and console when you connect Phantom!**
