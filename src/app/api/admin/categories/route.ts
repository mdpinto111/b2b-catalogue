import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { nom, slug, imageUrl, position } = await req.json();
  const category = await prisma.category.create({
    data: { nom, slug, imageUrl: imageUrl || null, position: Number(position) || 0 },
  });
  return NextResponse.json({ category });
}
