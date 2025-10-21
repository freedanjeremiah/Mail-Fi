import React from "react";
import { createRoot } from "react-dom/client";

const API_BASE = "http://localhost:3000"; // TODO: configure for production

type Tab = "send" | "request" | "invest" | "fund";

function App() {
  const [connected, setConnected] = React.useState(false);
  const [active, setActive] = React.useState<Tab>("send");
  const [to, setTo] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [requestAmount, setRequestAmount] = React.useState("");
  const [requestNote, setRequestNote] = React.useState("");
  const [invTitle, setInvTitle] = React.useState("");
  const [invGoal, setInvGoal] = React.useState("");
  const [invDesc, setInvDesc] = React.useState("");
  const [fundId, setFundId] = React.useState("");
  const [fundAmount, setFundAmount] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // Listen for messages from content script (e.g., pre-fill recipient from compose)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SET_RECIPIENT" && event.data.recipient) {
        setTo(event.data.recipient);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connect = async () => {
    // TODO: connect to Avail wallet / Nexus SDK
    setConnected(true);
  };

  const sendPayment = async () => {
    if (!connected) return alert("Connect wallet first");
    if (!to || !amount) return alert("Recipient and amount are required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "send", to, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send");
      alert(`Sent: txId=${json.txId}`);
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const createRequest = async () => {
    if (!connected) return alert("Connect wallet first");
    if (!requestAmount) return alert("Amount is required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "request", amount: requestAmount, note: requestNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create request");
      await navigator.clipboard.writeText(json.requestUrl);
      alert("Payment request link copied to clipboard");
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const createInvestment = async () => {
    if (!connected) return alert("Connect wallet first");
    if (!invTitle || !invGoal) return alert("Title and goal are required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/investments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: invTitle, goal: invGoal, description: invDesc }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create investment");
      alert(`Created investment: id=${json.id}`);
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const fundInvestment = async () => {
    if (!connected) return alert("Connect wallet first");
    if (!fundId || !fundAmount) return alert("Investment ID and amount are required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/investments/${encodeURIComponent(fundId)}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: fundAmount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to fund investment");
      alert(`Funded: txId=${json.txId}`);
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui", width: 340 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Mail‑Fi · Avail</h3>
      <button onClick={connect} style={{ marginBottom: 12 }} disabled={busy}>
        {connected ? "Wallet Connected" : "Connect Wallet"}
      </button>

      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["send", "request", "invest", "fund"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: active === t ? "#111827" : "white",
              color: active === t ? "white" : "#111827",
            }}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {active === "send" && (
        <div style={{ display: "grid", gap: 8 }}>
          <input placeholder="Recipient" value={to} onChange={(e) => setTo(e.target.value)} />
          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={sendPayment} disabled={busy}>Send</button>
        </div>
      )}

      {active === "request" && (
        <div style={{ display: "grid", gap: 8 }}>
          <input placeholder="Amount" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} />
          <input placeholder="Note (optional)" value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
          <button onClick={createRequest} disabled={busy}>Create request link</button>
        </div>
      )}

      {active === "invest" && (
        <div style={{ display: "grid", gap: 8 }}>
          <input placeholder="Title" value={invTitle} onChange={(e) => setInvTitle(e.target.value)} />
          <input placeholder="Goal amount" value={invGoal} onChange={(e) => setInvGoal(e.target.value)} />
          <textarea placeholder="Description" value={invDesc} onChange={(e) => setInvDesc(e.target.value)} />
          <button onClick={createInvestment} disabled={busy}>Create investment</button>
        </div>
      )}

      {active === "fund" && (
        <div style={{ display: "grid", gap: 8 }}>
          <input placeholder="Investment ID" value={fundId} onChange={(e) => setFundId(e.target.value)} />
          <input placeholder="Amount" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
          <button onClick={fundInvestment} disabled={busy}>Fund</button>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
