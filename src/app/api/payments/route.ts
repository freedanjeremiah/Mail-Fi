import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  // TODO: Validate and call Avail Nexus / wallet backend
  // Example placeholder response
  return NextResponse.json({ ok: true, echo: data });
}
