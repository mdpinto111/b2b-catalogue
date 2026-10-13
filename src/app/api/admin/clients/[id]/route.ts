import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json();
  const data: Record<string, unknown> = {
    raisonSociale: String(b.raisonSociale),
    email: String(b.email).toLowerCase(),
    defaultDiscount: Math.max(0, Math.min(100, Number(b.defaultDiscount) || 0)),
    actif: b.actif !== false,
  };
  if (b.password) data.passwordHash = bcrypt.hashSync(String(b.password), 10);
  const client = await prisma.client.update({ where: { id: Number((await params).id) }, data });
  return NextResponse.json({ client });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.client.delete({ where: { id: Number((await params).id) } });
  return NextResponse.json({ ok: true });
}
