import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth";
import { priceForClientProduct } from "@/lib/pricing";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireClient();
  if (error) return error;
  const product = await priceForClientProduct(Number(session.sub), Number((await params).id));
  if (!product) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ product });
}
