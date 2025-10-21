import { NextResponse } from "next/server";

type SendBody = { type: "send"; to: string; amount: string };
type RequestBody = { type: "request"; amount: string; note?: string };

export async function POST(req: Request) {
  const data: any = await req.json().catch(() => ({}));
  const type = data?.type as string | undefined;

  if (type === "send") {
    const { to, amount } = data as SendBody;
    if (!to || !amount) {
      return NextResponse.json({ error: "to and amount are required" }, { status: 400 });
    }
    // TODO: Avail send implementation
    const txId = `tx_${Math.random().toString(36).slice(2, 10)}`;
    return NextResponse.json({ ok: true, to, amount, txId });
  }

  if (type === "request") {
    const { amount, note } = data as RequestBody;
    if (!amount) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 });
    }
    // Create a shareable request URL (for now, a dummy link with query params)
    const requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
    const url = new URL("https://mailfi.local/request");
    url.searchParams.set("id", requestId);
    url.searchParams.set("amount", amount);
    if (note) url.searchParams.set("note", note);
    return NextResponse.json({ ok: true, id: requestId, requestUrl: url.toString() });
  }

  return NextResponse.json({ error: "unsupported type; expected 'send' or 'request'" }, { status: 400 });
}
