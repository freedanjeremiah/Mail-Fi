import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [connected, setConnected] = React.useState(false);
  const [to, setTo] = React.useState("");
  const [amount, setAmount] = React.useState("");

  const connect = async () => {
    // TODO: connect to Avail wallet / Nexus SDK
    setConnected(true);
  };

  const sendPayment = async () => {
    if (!connected) return alert("Connect wallet first");
    // TODO: call your Next.js API route to initiate Avail payment
    // await fetch("/api/payments", { method:"POST", body: JSON.stringify({ to, amount }) })
    alert(`Pretend sending ${amount} to ${to} on Avail`);
  };

  return (
    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
      <h3 style={{ marginTop: 0 }}>Mail‑Fi · Avail</h3>
      <button onClick={connect} style={{ marginBottom: 12 }}>
        {connected ? "Wallet Connected" : "Connect Wallet"}
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="Recipient" value={to} onChange={e => setTo(e.target.value)} />
        <input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={sendPayment}>Send</button>
      </div>

      <hr style={{ margin: "16px 0" }} />
      <button onClick={() => alert("Invest flow TBD")}>Invest</button>
      <button onClick={() => alert("Fund project flow TBD")}>Fund Project</button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
