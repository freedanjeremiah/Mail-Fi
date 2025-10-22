const {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint
} = require('@solana/spl-token');
const { connection, PYUSD_MINT_ADDRESS, getWalletKeypair } = require('../config/solana');

class SolanaService {
  /**
   * Get SOL balance for a wallet
   */
  async getBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get PYUSD token balance for a wallet
   */
  async getPYUSDBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: PYUSD_MINT_ADDRESS }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      return balance;
    } catch (error) {
      throw new Error(`Failed to get PYUSD balance: ${error.message}`);
    }
  }

  /**
   * Transfer PYUSD tokens to another wallet
   */
  async transferPYUSD(recipientAddress, amount) {
    try {
      const payer = getWalletKeypair();
      const recipient = new PublicKey(recipientAddress);

      // Get mint info to determine decimals
      const mintInfo = await getMint(connection, PYUSD_MINT_ADDRESS);
      const decimals = mintInfo.decimals;

      // Get or create token accounts
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        PYUSD_MINT_ADDRESS,
        payer.publicKey
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        PYUSD_MINT_ADDRESS,
        recipient
      );

      // Calculate amount with decimals
      const transferAmount = amount * Math.pow(10, decimals);

      // Create transfer instruction
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          payer.publicKey,
          transferAmount
        )
      );

      // Send transaction
      const signature = await connection.sendTransaction(transaction, [payer]);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      return {
        signature,
        from: payer.publicKey.toString(),
        to: recipientAddress,
        amount: amount,
        status: 'confirmed'
      };
    } catch (error) {
      throw new Error(`Failed to transfer PYUSD: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature) {
    try {
      const transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Airdrop SOL (testnet only)
   */
  async airdropSOL(walletAddress, amount) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await connection.confirmTransaction(signature, 'confirmed');

      return {
        signature,
        amount,
        status: 'confirmed'
      };
    } catch (error) {
      throw new Error(`Failed to airdrop SOL: ${error.message}`);
    }
  }
}

module.exports = new SolanaService();
