"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useTransactionPopup } from '@blockscout/app-sdk';

export function BlockscoutFloatingButtonSimple() {
  const { address, isConnected } = useAccount();
  const { openPopup } = useTransactionPopup();

  if (!isConnected || !address) {
    return null;
  }

  const showTransactionHistory = () => {
    openPopup({
      chainId: "84532", // Base Sepolia
      address: address
    });
  };

  return (
    <button
      onClick={showTransactionHistory}
      className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
      title="View Transaction History"
    >
      <span className="text-xl">📊</span>
    </button>
  );
}
