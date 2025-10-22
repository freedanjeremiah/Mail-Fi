const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Mail-Fi Backend Server is running`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.SOLANA_NETWORK || 'devnet'}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET    /                                - Health check`);
  console.log(`   GET    /api/contacts                    - Get all contacts`);
  console.log(`   POST   /api/contacts                    - Create contact`);
  console.log(`   GET    /api/contacts/:id                - Get contact by ID`);
  console.log(`   PUT    /api/contacts/:id                - Update contact`);
  console.log(`   DELETE /api/contacts/:id                - Delete contact`);
  console.log(`   GET    /api/contacts/wallet/:address    - Get contact by wallet`);
  console.log(`   GET    /api/transactions/balance/:address - Get wallet balance`);
  console.log(`   POST   /api/transactions/transfer/contact - Transfer to contact`);
  console.log(`   POST   /api/transactions/transfer/wallet  - Transfer to wallet`);
  console.log(`   GET    /api/transactions/transaction/:sig - Get transaction`);
  console.log(`   POST   /api/transactions/airdrop         - Airdrop SOL (testnet)`);
  console.log(`\n✅ Server ready!\n`);
});
