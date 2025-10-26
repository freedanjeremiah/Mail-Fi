const solanaService = require('../services/solanaService');
const contactModel = require('../models/contact');

class TransactionController {
  // Get balance for a wallet
  async getBalance(req, res) {
    try {
      const { walletAddress } = req.params;

      const solBalance = await solanaService.getBalance(walletAddress);
      const pyusdBalance = await solanaService.getPYUSDBalance(walletAddress);

      res.json({
        success: true,
        data: {
          walletAddress,
          solBalance,
          pyusdBalance
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Transfer PYUSD to a contact
  async transferToContact(req, res) {
    try {
      const { contactId, amount } = req.body;

      if (!contactId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Contact ID and amount are required'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      // Find contact
      const contact = contactModel.findById(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      // Transfer PYUSD
      const result = await solanaService.transferPYUSD(
        contact.walletAddress,
        amount
      );

      res.json({
        success: true,
        data: {
          ...result,
          contact: {
            id: contact.id,
            name: contact.name,
            email: contact.email
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Transfer PYUSD to any wallet address
  async transferToWallet(req, res) {
    try {
      const { walletAddress, amount } = req.body;

      if (!walletAddress || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address and amount are required'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      // Transfer PYUSD
      const result = await solanaService.transferPYUSD(walletAddress, amount);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get transaction details
  async getTransaction(req, res) {
    try {
      const { signature } = req.params;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Transaction signature is required'
        });
      }

      const transaction = await solanaService.getTransaction(signature);

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Airdrop SOL (testnet only)
  async airdropSOL(req, res) {
    try {
      const { walletAddress, amount } = req.body;

      if (!walletAddress || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address and amount are required'
        });
      }

      if (amount <= 0 || amount > 2) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be between 0 and 2 SOL for testnet'
        });
      }

      const result = await solanaService.airdropSOL(walletAddress, amount);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new TransactionController();
