import { NextResponse } from "next/server";

// In a real app, persist to a database. Here we just echo and generate an id.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, goal, description } = body || {};

  if (!title || !goal) {
    return NextResponse.json({ error: "title and goal are required" }, { status: 400 });
  }

  const id = `inv_${Math.random().toString(36).slice(2, 10)}`;
  return NextResponse.json({ id, title, goal, description });
}
