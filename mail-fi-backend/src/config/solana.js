const { Connection, clusterApiUrl, Keypair, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

// Solana network configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK);

// PYUSD mint address on Solana devnet/testnet
const PYUSD_MINT_ADDRESS = new PublicKey(
  process.env.PYUSD_MINT_ADDRESS || 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM'
);

// Create connection to Solana
const connection = new Connection(RPC_URL, 'confirmed');

// Get wallet keypair from environment
const getWalletKeypair = () => {
  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error('WALLET_PRIVATE_KEY not set in environment');
  }

  try {
    const privateKeyArray = JSON.parse(process.env.WALLET_PRIVATE_KEY);
    return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  } catch (error) {
    throw new Error('Invalid WALLET_PRIVATE_KEY format');
  }
};

module.exports = {
  connection,
  NETWORK,
  RPC_URL,
  PYUSD_MINT_ADDRESS,
  getWalletKeypair
};
