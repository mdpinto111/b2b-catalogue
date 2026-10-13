import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireClient();
  if (error) return error;
  const order = await prisma.order.findFirst({
    where: { id: Number((await params).id), clientId: Number(session.sub) },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ order });
}
