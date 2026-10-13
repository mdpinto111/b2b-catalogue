import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") || undefined;
  const orders = await prisma.order.findMany({
    where: { ...(statut ? { statut } : {}) },
    orderBy: { createdAt: "desc" },
    include: { client: true, items: true },
  });
  return NextResponse.json({ orders });
}
