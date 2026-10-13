import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth";
import { catalogForClient } from "@/lib/pricing";

export async function GET(req: Request) {
  const { session, error } = await requireClient();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("category");
  const products = await catalogForClient(Number(session.sub), cat ? Number(cat) : undefined);
  return NextResponse.json({ products });
}
