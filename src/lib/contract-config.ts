// Mail-Fi Smart Contract Configuration
export const CONTRACT_CONFIG = {
  // Contract addresses by network
  addresses: {
    // Base Sepolia (testnet)
    "base-sepolia": {
      usdcInvestmentEscrow: "0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c", // Deployed USDC Investment Escrow contract
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      chainId: 84532
    },
    // Ethereum Sepolia (testnet)
    "ethereum-sepolia": {
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      chainId: 11155111
    },
    // Optimism Sepolia (testnet)
    "optimism-sepolia": {
      usdc: "0x5a719cf3C02dBea581bA2D922906B81fC0A61d1D",
      chainId: 11155420
    }
  },
  
  
  // USDC Investment Escrow ABI
  investmentEscrowAbi: [
    "function createProject(uint256 targetRaise, uint256 durationSeconds, uint256 valuation, uint256 equityOffered, uint256 minInvestment, uint256 maxInvestment, string calldata name, string calldata description, string calldata category, string calldata imageUrl) external",
    "function invest(uint256 id, uint256 amount) external",
    "function approveProject(uint256 id) external",
    "function rejectProject(uint256 id) external",
    "function releaseFunds(uint256 id) external",
    "function refund(uint256 id) external",
    "function getProject(uint256 id) external view returns (tuple(address founder, uint256 targetRaise, uint256 totalInvested, uint256 deadline, uint256 valuation, uint256 equityOffered, uint256 minInvestment, uint256 maxInvestment, bool released, uint8 status, string name, string description, string category, string imageUrl))",
    "function getAllProjects() external view returns (tuple(address founder, uint256 targetRaise, uint256 totalInvested, uint256 deadline, uint256 valuation, uint256 equityOffered, uint256 minInvestment, uint256 maxInvestment, bool released, uint8 status, string name, string description, string category, string imageUrl)[])",
    "function getInvestorInvestment(uint256 id, address investor) external view returns (uint256)",
    "function projectCount() external view returns (uint256)",
    "event ProjectCreated(uint256 indexed id, address indexed founder)",
    "event Invested(uint256 indexed id, address indexed investor, uint256 amount)",
    "event Approved(uint256 indexed id)",
    "event Rejected(uint256 indexed id)",
    "event Released(uint256 indexed id, uint256 total)",
    "event Refunded(uint256 indexed id, address indexed investor, uint256 amount)"
  ],
  
  // Default settings
  defaults: {
    requestDeadline: 7 * 24 * 60 * 60, // 7 days in seconds
    minAmount: 1000000, // 1 USDC (6 decimals)
    maxAmount: 1000000000000 // 1M USDC (6 decimals)
  }
};

// Helper functions
export function getUSDCAddress(network: string) {
  return (CONTRACT_CONFIG.addresses as any)[network]?.usdc;
}

export function getChainId(network: string) {
  return (CONTRACT_CONFIG.addresses as any)[network]?.chainId;
}

// Investment Escrow helper functions
export function getInvestmentEscrowAddress(network: string) {
  return (CONTRACT_CONFIG.addresses as any)[network]?.usdcInvestmentEscrow;
}

export function getInvestmentEscrowABI() {
  return CONTRACT_CONFIG.investmentEscrowAbi;
}
