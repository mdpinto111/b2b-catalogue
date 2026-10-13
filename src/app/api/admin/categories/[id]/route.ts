import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { nom, slug, imageUrl, position } = await req.json();
  const category = await prisma.category.update({
    where: { id: Number((await params).id) },
    data: { nom, slug, imageUrl: imageUrl || null, position: Number(position) || 0 },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.category.delete({ where: { id: Number((await params).id) } });
  return NextResponse.json({ ok: true });
}
