# PYUSD Manifesto Smart Contracts

Solana smart contracts for the PYUSD Manifesto payment platform, built with Anchor framework.

## Features

### 1. Escrow/Payment Request Contract
Create secure payment requests with escrow protection.

**Instructions:**
- `create_escrow` - Create a new escrow payment request
- `fund_escrow` - Fund an escrow with tokens
- `claim_escrow` - Recipient claims funds before expiry
- `cancel_escrow` - Creator cancels and gets refund after expiry

**Use Cases:**
- Request payment for services
- Secure peer-to-peer transactions
- Time-limited payment requests
- Automatic refunds for unclaimed payments

### 2. Recurring Payment Contract
Set up automatic recurring payments at regular intervals.

**Instructions:**
- `create_recurring_payment` - Set up recurring payment schedule
- `execute_recurring_payment` - Execute next payment in schedule
- `cancel_recurring_payment` - Cancel future payments

**Use Cases:**
- Subscriptions
- Rent payments
- Monthly allowances
- Salary payments

### 3. Multi-Signature Wallet Contract
Create wallets requiring multiple approvals for transactions.

**Instructions:**
- `create_multisig` - Create new multisig wallet
- `propose_transaction` - Propose a new transaction
- `approve_transaction` - Approve a proposed transaction
- `execute_transaction` - Execute transaction after threshold met
- `reject_transaction` - Reject and close a transaction

**Use Cases:**
- Business accounts
- Shared family wallets
- DAO treasuries
- Enhanced security for large transfers

## Architecture

```
programs/mail-fi-contracts/
├── src/
│   ├── lib.rs              # Main program entry point
│   ├── escrow.rs           # Escrow contract logic
│   ├── recurring_payment.rs # Recurring payment logic
│   └── multisig.rs         # Multisig wallet logic
└── Cargo.toml
```

## Building

```bash
# Install Anchor (if not already installed)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Build the program
anchor build

# Run tests
anchor test
```

## Deployment

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Security Considerations

1. **Escrow Contract:**
   - Time-based expiry prevents indefinite locks
   - Only authorized parties can claim/cancel
   - Funds safely returned after expiry

2. **Recurring Payments:**
   - Payer must manually execute each payment
   - Can be cancelled anytime
   - No automatic withdrawal from wallet

3. **Multisig Wallet:**
   - Threshold validation prevents single-point failure
   - Maximum 10 owners for gas efficiency
   - Transactions require minimum approvals

## Token Support

These contracts support **Token-2022 (SPL Token-2022)** including:
- Transfer hooks
- Confidential transfers
- Transfer fees
- Permanent delegate
- All Token-2022 extensions

Specifically optimized for **PYUSD** on Solana devnet.

## Frontend Integration

The contracts are integrated with the Next.js frontend:
- `/app/escrow/page.tsx` - Escrow UI
- `/app/recurring/page.tsx` - Recurring payments UI
- `/app/multisig/page.tsx` - Multisig wallet UI
- `/lib/contracts/` - TypeScript SDK

## Error Codes

```rust
EscrowExpired           // Escrow has passed expiry time
EscrowNotExpired        // Cannot cancel before expiry
Unauthorized            // Caller not authorized
AlreadyFunded           // Escrow already funded
NotFunded               // Escrow not funded yet
PaymentNotDue           // Recurring payment interval not reached
AllPaymentsCompleted    // All recurring payments done
InsufficientApprovals   // Not enough multisig approvals
AlreadyExecuted         // Transaction already executed
InvalidThreshold        // Invalid multisig threshold
TooManyOwners           // Too many multisig owners
AlreadyApproved         // Owner already approved
NotAnOwner              // Caller not a multisig owner
```

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- All tests pass
- Code follows Rust best practices
- Security considerations documented
- Frontend integration tested
