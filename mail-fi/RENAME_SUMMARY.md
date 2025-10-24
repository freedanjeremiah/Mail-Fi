# Project Rename: Mail-Fi → PYUSD Manifesto

## Summary of Changes

All instances of "Mail-Fi" have been renamed to "PYUSD Manifesto" throughout the project.

## Files Updated

### Package Configuration
- `package.json`: name → `pyusd-manifesto-frontend`
- `package.json`: description → `PYUSD Manifesto - PYUSD Transaction Platform`

### Frontend Pages
- `app/page.tsx`: Main title → `💸 PYUSD Manifesto`
- `app/layout.tsx`: Metadata title → `PYUSD Manifesto - PYUSD Transactions`
- `app/escrow/page.tsx`: Title → `💸 PYUSD Manifesto - Escrow`
- `app/recurring/page.tsx`: Title → `💸 PYUSD Manifesto - Recurring Payments`
- `app/multisig/page.tsx`: Title → `💸 PYUSD Manifesto - Multisig Wallet`

### Smart Contracts
- `programs/mail-fi-contracts/` → `programs/pyusd-manifesto-contracts/`
- `Cargo.toml`: package name → `pyusd-manifesto-contracts`
- `Cargo.toml`: crate name → `pyusd_manifesto_contracts`
- `src/lib.rs`: module name → `pyusd_manifesto_contracts`
- Contract README updated

### Configuration
- `Anchor.toml`: 
  - Program keys: `mail_fi_contracts` → `pyusd_manifesto_contracts`
  - Workspace member path updated
  
### Libraries
- `lib/escrow-manager.ts`: localStorage key → `pyusd_manifesto_escrows`
- `lib/contracts/types.ts`: Program ID constant → `PYUSD_MANIFESTO_PROGRAM_ID`

### Documentation
- `README.md`: All references updated
- `BUILD_SOLUTION.md`: All references updated
- `DEPLOYMENT_GUIDE.md`: All references updated
- `CONTRACT_STATUS.md`: All references updated
- `SIMPLE_BUILD_SOLUTION.md`: All references updated

## Program ID

Program ID remains unchanged:
```
Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

## Next Steps

1. Test the application: `npm run dev`
2. Verify all pages display "PYUSD Manifesto" correctly
3. When ready to deploy contracts, use the new program name in deployment
