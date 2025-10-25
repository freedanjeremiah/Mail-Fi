import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: { id: string } } | any
) {
  const { id } = (context && context.params) || {};
  const body = await req.json().catch(() => ({}));
  const { amount } = body || {};

  if (!id || !amount) {
    return NextResponse.json({ error: "id and amount are required" }, { status: 400 });
  }

  // Placeholder tx id
  const txId = `tx_${Math.random().toString(36).slice(2, 10)}`;
  return NextResponse.json({ ok: true, id, amount, txId });
}
