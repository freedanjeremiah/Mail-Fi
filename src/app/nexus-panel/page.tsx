"use client";

import React from "react";
import {
  NexusProvider,
  useNexus,
  TransferButton,
  BridgeButton,
  BridgeAndExecuteButton,
} from "@avail-project/nexus-widgets";
import { parseUnits } from "viem";

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
  const [recipient, setRecipient] = React.useState<string | null>(null);
  const transferOpenRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev?.data?.type === 'SET_RECIPIENT' && ev.data.recipient) {
        setRecipient(ev.data.recipient as string);
        return;
      }

      // New message type: open the panel and prefill the transfer modal
      if (ev?.data?.type === 'OPEN_PANEL_AND_PREFILL') {
        const r = ev.data.recipient as string | undefined;
        const a = ev.data.amount as string | number | undefined;
        if (r && /^0x[0-9a-fA-F]{40}$/.test(r)) {
          setRecipient(r);
        }
        if (a !== undefined && a !== null) {
          setAmount(String(a));
        }
        // Give React a tick to apply state, then trigger the TransferButton
        setTimeout(() => {
          try {
            transferOpenRef.current?.();
          } catch (e) {
            // swallow any errors from attempting to open
          }
        }, 50);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
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
        <div style={{ marginBottom: 8, fontSize: 13, color: '#374151' }}>
          {recipient ? <span>Prefilled recipient: <strong>{recipient}</strong></span> : <span>No recipient prefilled</span>}
        </div>
        {
          // Ensure recipient matches simple 0x hex address pattern before casting to the SDK's typed address shape
        }
        <TransferButton
          prefill={{
            amount: amount || undefined,
            recipient: (recipient && /^0x[0-9a-fA-F]{40}$/.test(recipient)
              ? (recipient as `0x${string}`)
              : undefined),
          }}
        >
          {({ onClick, isLoading }) => {
            // expose the onClick so external code (postMessage) can open the Transfer modal
            transferOpenRef.current = onClick;
            return (
              <button onClick={onClick} disabled={isLoading}>
                {isLoading ? "Processing…" : "Open Nexus Transfer"}
              </button>
            );
          }}
        </TransferButton>
        <hr style={{ margin: "12px 0" }} />

        <div style={{ marginBottom: 8 }}>
          <h4 style={{ margin: "8px 0" }}>Bridge</h4>
          <BridgeButton
            prefill={{
              // Example prefill values; you can change these or accept from postMessage
              chainId: 421614,
              token: "USDC",
              amount: "1",
            }}
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={onClick}
                disabled={isLoading}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                {isLoading ? "Bridging…" : "Bridge 1 USDC to Arbitrum Sepolia"}
              </button>
            )}
          </BridgeButton>
        </div>

        <div style={{ marginTop: 8 }}>
          <BridgeAndExecuteButton
            contractAddress="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"
            contractAbi={
              [
                {
                  name: "supply",
                  type: "function",
                  stateMutability: "nonpayable",
                  inputs: [
                    { name: "asset", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "onBehalfOf", type: "address" },
                    { name: "referralCode", type: "uint16" },
                  ],
                  outputs: [],
                },
              ] as const
            }
            functionName="supply"
            buildFunctionParams={(token, amount, chainId, userAddress) => {
              const decimals = (window as any).TOKEN_METADATA?.[token]?.decimals ?? 6;
              const amountWei = parseUnits(amount, decimals);
              const tokenAddress = (window as any).TOKEN_CONTRACT_ADDRESSES?.[token]?.[chainId];
              return {
                functionParams: [tokenAddress, amountWei, userAddress, 0],
              };
            }}
            prefill={{ toChainId: 421614, token: "USDC" }}
          >
            {({ onClick, isLoading, disabled }) => (
              <button
                onClick={onClick}
                disabled={isLoading || disabled}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                {isLoading ? "Processing…" : "Bridge & Supply to Aave"}
              </button>
            )}
          </BridgeAndExecuteButton>
        </div>
      </div>
    </NexusProvider>
  );
}
