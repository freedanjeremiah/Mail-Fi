const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Get the private key from command line argument
const privateKeyBase58 = process.argv[2];

if (!privateKeyBase58) {
  console.log('\nUsage: node scripts/convert-key.js YOUR_BASE58_PRIVATE_KEY\n');
  console.log('This script converts a base58 private key (from Phantom) to array format for .env\n');
  process.exit(1);
}

try {
  // Decode base58 private key
  const privateKeyBytes = bs58.decode(privateKeyBase58);

  // Create keypair from private key
  const keypair = Keypair.fromSecretKey(privateKeyBytes);

  console.log('\n=== Wallet Information ===\n');
  console.log('Public Key (Wallet Address):', keypair.publicKey.toString());
  console.log('\nPrivate Key (Array format for .env):');
  console.log('WALLET_PRIVATE_KEY=' + JSON.stringify(Array.from(keypair.secretKey)));
  console.log('\n✅ Copy the line above to your .env file\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\nMake sure you provided a valid base58 private key from Phantom wallet\n');
  process.exit(1);
}
