"use client";

import React from "react";
import { NexusProvider, useNexus, TransferButton } from "@avail-project/nexus-widgets";

function WalletBridge() {
  const { setProvider } = useNexus();
  React.useEffect(() => {
    const eth = (typeof window !== "undefined" && (window as any).ethereum) || null;
    if (eth) setProvider(eth);
  }, [setProvider]);
  return null;
}

export default function NexusPanelPage() {
  const [amount, setAmount] = React.useState("");
  return (
    <NexusProvider config={{ network: "testnet", debug: false }}>
      <WalletBridge />
      <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui", width: 360 }}>
        <h3 style={{ marginTop: 0 }}>Nexus Transfer</h3>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <TransferButton prefill={{ amount: amount || undefined }}>
          {({ onClick, isLoading }) => (
            <button onClick={onClick} disabled={isLoading}>
              {isLoading ? "Processing…" : "Open Nexus Transfer"}
            </button>
          )}
        </TransferButton>
      </div>
    </NexusProvider>
  );
}
