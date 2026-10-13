import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const clients = await prisma.client.findMany({
    orderBy: { raisonSociale: "asc" },
    include: { _count: { select: { pricing: true, orders: true } } },
  });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json();
  const client = await prisma.client.create({
    data: {
      raisonSociale: String(b.raisonSociale),
      email: String(b.email).toLowerCase(),
      passwordHash: bcrypt.hashSync(String(b.password || "changeme"), 10),
      defaultDiscount: Math.max(0, Math.min(100, Number(b.defaultDiscount) || 0)),
      actif: b.actif !== false,
    },
  });
  // Nothing to generate: a new client sees the whole catalogue at base price.
  return NextResponse.json({ client });
}
