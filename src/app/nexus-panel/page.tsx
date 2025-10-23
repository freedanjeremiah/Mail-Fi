"use client";

import React from "react";
import { NexusProvider, useNexus, TransferButton } from "@avail-project/nexus-widgets";
import { BridgeTest } from '../components/bridge-test';

function WalletBridge() {
  const { setProvider } = useNexus();
  React.useEffect(() => {
    const eth = (typeof window !== "undefined" && (window as any).ethereum) || null;
    if (eth) setProvider(eth);
  }, [setProvider]);
  return null;
}

function SdkInspector() {
  const { sdk } = useNexus();
  const [dump, setDump] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sdk) return;
    try {
      const s: any = sdk;
      const cfg = {
        // use any-casts to avoid accessing protected internals in TS
        isInitialized: typeof s._isInitialized === 'function' ? !!s._isInitialized() : undefined,
        networkConfig: s._networkConfig || s.networkConfig || null,
        // some readable fields (attempt to surface a list of chain ids / keys)
        chainList: s.chainList ? (s.chainList.chains ? Object.keys(s.chainList.chains) : undefined) : undefined,
      };
      setDump(JSON.stringify(cfg, null, 2));
      console.debug('[NEXUS-INSPECTOR] sdk snapshot', cfg);
    } catch (e) {
      console.error('[NEXUS-INSPECTOR] failed to read sdk', e);
    }
  }, [sdk]);

  return (
    <div style={{ marginTop: 12, fontSize: 12, color: '#444' }}>
      <strong>SDK Inspector</strong>
      <div style={{ marginTop: 6 }}>
        <button
          onClick={() => {
            console.debug('[NEXUS-INSPECTOR] full sdk object:', sdk);
            alert('SDK snapshot printed to console');
          }}
        >
          Dump SDK to console
        </button>
      </div>
      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto', background: '#f6f6f6', padding: 8 }}>
        {dump ?? 'SDK not available yet'}
      </pre>
    </div>
  );
}

// Simple client-side error boundary to capture render errors from NexusProvider
function ErrorCatcher({ children, onError }: { children: React.ReactNode; onError: (err: any) => void }) {
  // Error boundaries must be class components; create one inline
  class C extends React.Component<{ children: React.ReactNode }, { error: any }> {
    constructor(props: any) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: any) {
      return { error };
    }
    componentDidCatch(error: any, info: any) {
      try {
        onError && onError(error || info || { error, info });
      } catch (e) {
        // ignore
      }
    }
    render() {
      if (this.state.error) return null;
      return this.props.children as any;
    }
  }
  return <C>{children}</C>;
}

export default function NexusPanelPage() {
  const [amount, setAmount] = React.useState("");
  const [renderError, setRenderError] = React.useState<any>(null);
  return (
    <>
      {renderError ? (
        <div style={{ padding: 16, color: 'crimson' }}>
          <h3>Runtime error while rendering NexusProvider</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(renderError, Object.getOwnPropertyNames(renderError), 2)}</pre>
        </div>
      ) : (
        <ErrorCatcher onError={(err: any) => setRenderError(err)}>
          <NexusProvider config={{ network: "testnet", debug: false }}>
            <WalletBridge />
            <SdkInspector />
            <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui", width: 420 }}>
              <h3 style={{ marginTop: 0 }}>Nexus Transfer</h3>
              <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <TransferButton prefill={{ chainId: 11155420, token: 'USDC', amount: amount || undefined }}>
                {({ onClick, isLoading }) => (
                  <button onClick={onClick} disabled={isLoading}>
                    {isLoading ? "Processing…" : "Open Nexus Transfer"}
                  </button>
                )}
              </TransferButton>
              <div style={{ marginTop: 18 }}>
                <BridgeTest />
              </div>
            </div>
          </NexusProvider>
        </ErrorCatcher>
      )}
    </>
  );
}
