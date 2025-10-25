# Magic.link Email Wallet Integration

## 🔮 Overview

Mail-Fi now supports **email-based wallet authentication** using Magic.link instead of MetaMask. Users can sign in with their email address and get a wallet tied to that email, making cross-chain payments seamless without browser extensions.

## 🚀 Features

- **Email-based authentication**: No MetaMask required
- **Automatic wallet creation**: Wallet created on first login
- **Cross-chain payments**: Full Avail Nexus integration
- **Magic link login**: Secure email verification
- **Persistent sessions**: Stay logged in across sessions

## 🛠️ Setup

### 1. Get Magic.link API Keys

1. Go to [Magic.link Dashboard](https://dashboard.magic.link/)
2. Create a new project
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# Magic.link Configuration
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
MAGIC_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Update Magic Provider

In `src/app/components/magic-wallet-provider.tsx`, update the Magic instance:

```typescript
const magicInstance = new Magic(
  process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_test_1234567890',
  {
    network: {
      rpcUrl: 'https://sepolia.drpc.org', // Default to Ethereum Sepolia
      chainId: 11155111,
    },
  }
);
```

## 🎯 How It Works

### 1. User Flow
1. User clicks "Pay with Avail" in Gmail
2. Payment popup opens with Magic login
3. User enters email address
4. Magic sends verification email
5. User clicks magic link in email
6. Wallet is automatically created and connected
7. User can now make cross-chain payments

### 2. Technical Flow
1. **Magic SDK** initializes with publishable key
2. **Email authentication** via magic link
3. **Wallet creation** happens automatically
4. **Provider injection** into Nexus SDK
5. **Transaction signing** through Magic provider

## 🔧 Components

### MagicWalletProvider
- Manages Magic SDK instance
- Handles login/logout state
- Provides wallet context

### MagicLoginModal
- Email input form
- Magic link authentication
- Error handling

### MagicWalletBridge
- Connects Magic provider to Nexus SDK
- Handles SDK initialization
- Status indicators

## 🌐 Supported Networks

Magic.link works with all supported chains:

**Testnet:**
- Ethereum Sepolia
- Arbitrum Sepolia  
- Optimism Sepolia
- Base Sepolia
- Polygon Amoy
- And 40+ more chains

**Mainnet:**
- Ethereum
- Arbitrum
- Optimism
- Base
- Polygon
- And 25+ more chains

## 🔒 Security

- **Email verification**: Required for wallet access
- **Magic link authentication**: Secure, passwordless login
- **Private key management**: Handled by Magic.link
- **Session management**: Automatic token refresh

## 🚀 Usage Examples

### Gmail Integration
```
To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Subject: 0.001 USDC ethereum sepolia to optimism sepolia
```

1. Click "Pay with Avail"
2. Enter email: `user@example.com`
3. Check email for magic link
4. Click link to authenticate
5. Complete payment with email wallet

### Direct Usage
```typescript
import { useMagicWallet } from './components/magic-wallet-provider';

function MyComponent() {
  const { isLoggedIn, user, login, logout } = useMagicWallet();
  
  if (!isLoggedIn) {
    return <button onClick={() => login('user@example.com')}>Connect Email</button>;
  }
  
  return <div>Connected as {user.email}</div>;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Magic not initialized"**
   - Check `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` is set
   - Verify key format (starts with `pk_test_` or `pk_live_`)

2. **"Login failed"**
   - Check email format
   - Verify Magic.link project is active
   - Check network connectivity

3. **"Provider not found"**
   - Ensure Magic SDK is properly initialized
   - Check browser console for errors
   - Verify Magic.link dashboard settings

### Debug Mode

Enable debug logging:

```typescript
const magicInstance = new Magic(publishableKey, {
  network: { /* ... */ },
  // Add debug flag
  debug: true
});
```

## 📚 Resources

- [Magic.link Documentation](https://magic.link/docs)
- [Magic.link Dashboard](https://dashboard.magic.link/)
- [Magic SDK Reference](https://magic.link/docs/api-reference/client-side-sdks/web)
- [Email Authentication Guide](https://magic.link/docs/auth/email)

## 🎉 Benefits

- **No MetaMask required**: Email-based authentication
- **Better UX**: Seamless login experience  
- **Cross-platform**: Works on any device with email
- **Secure**: Enterprise-grade security
- **Scalable**: Handles millions of users
