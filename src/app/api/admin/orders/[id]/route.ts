import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { statut } = await req.json();
  const allowed = ["nouvelle", "traitee", "annulee"];
  if (!allowed.includes(statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  const order = await prisma.order.update({ where: { id: Number((await params).id) }, data: { statut } });
  return NextResponse.json({ order });
}
