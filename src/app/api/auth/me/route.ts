import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth";

export async function GET() {
  const s = await getClientSession();
  if (!s) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, name: s.name, id: s.sub });
}
