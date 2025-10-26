"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useTransactionPopup } from '@blockscout/app-sdk';

export function BlockscoutFloatingButton() {
  const { address, isConnected } = useAccount();
  const { openPopup } = useTransactionPopup();

  const showTransactionHistory = () => {
    if (address) {
      openPopup({
        chainId: "84532", // Base Sepolia
        address: address
      });
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40">
      <button 
        onClick={showTransactionHistory}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-bold uppercase text-xs tracking-wider"
      >
        📊 Transaction History
      </button>
    </div>
  );
}
