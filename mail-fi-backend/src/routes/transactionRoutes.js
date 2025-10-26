const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Get balance for a wallet
router.get('/balance/:walletAddress', transactionController.getBalance.bind(transactionController));

// Transfer PYUSD to a contact
router.post('/transfer/contact', transactionController.transferToContact.bind(transactionController));

// Transfer PYUSD to any wallet address
router.post('/transfer/wallet', transactionController.transferToWallet.bind(transactionController));

// Get transaction details
router.get('/transaction/:signature', transactionController.getTransaction.bind(transactionController));

// Airdrop SOL (testnet only)
router.post('/airdrop', transactionController.airdropSOL.bind(transactionController));

module.exports = router;
