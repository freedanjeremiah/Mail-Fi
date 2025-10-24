export const TOKEN_MAPPING: Record<number, Record<string, { symbol: string; decimals: number }>> = {
  1: {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
  },
  10: {
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { symbol: 'USDC', decimals: 6 },
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { symbol: 'USDT', decimals: 6 },
  },
  42161: {
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { symbol: 'USDC', decimals: 6 },
  },
  999: {
    '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb': { symbol: 'USDT', decimals: 6 },
  },
};
