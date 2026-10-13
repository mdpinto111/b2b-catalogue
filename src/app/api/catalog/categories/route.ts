import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth";
import { catalogForClient } from "@/lib/pricing";

export async function GET() {
  const { session, error } = await requireClient();
  if (error) return error;
  const products = await catalogForClient(Number(session.sub));
  // Categories with at least one product visible to this client
  const map = new Map<number, { id: number; nom: string; slug: string; count: number }>();
  for (const p of products) {
    const c = map.get(p.category.id) ?? { ...p.category, count: 0 };
    c.count++;
    map.set(p.category.id, c);
  }
  return NextResponse.json({ categories: Array.from(map.values()) });
}
