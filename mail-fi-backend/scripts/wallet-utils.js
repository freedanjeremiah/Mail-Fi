const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

console.log('\n=== Solana Wallet Utilities ===\n');

// Option 1: Generate a new wallet
console.log('Option 1: Generate New Wallet');
console.log('------------------------------');
const newWallet = Keypair.generate();
console.log('Public Key (Wallet Address):', newWallet.publicKey.toString());
console.log('Private Key (Base58):', bs58.encode(newWallet.secretKey));
console.log('Private Key (Array - for .env):', JSON.stringify(Array.from(newWallet.secretKey)));

console.log('\n\nOption 2: Convert Phantom Private Key');
console.log('--------------------------------------');
console.log('If you have a private key from Phantom (base58 string),');
console.log('you can convert it by running:');
console.log('node scripts/convert-key.js YOUR_BASE58_PRIVATE_KEY');

console.log('\n\nTo use in .env file:');
console.log('-------------------');
console.log('Copy the "Private Key (Array - for .env)" value above and paste it in your .env file:');
console.log('WALLET_PRIVATE_KEY=' + JSON.stringify(Array.from(newWallet.secretKey)));

console.log('\n\nIMPORTANT: Save your private key securely!');
console.log('For TESTING ONLY: Use the generated wallet above');
console.log('For PRODUCTION: Never share or commit your private key\n');
