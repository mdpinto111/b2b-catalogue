import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const products = await prisma.product.findMany({
    orderBy: { titre: "asc" },
    include: { category: true },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json();
  const product = await prisma.product.create({
    data: {
      categoryId: Number(b.categoryId),
      titre: String(b.titre),
      description: String(b.description || ""),
      images: Array.isArray(b.images) ? b.images : [],
      sku: b.sku ? String(b.sku) : null,
      prixBase: Number(b.prixBase), // centimes
      actif: b.actif !== false,
    },
  });
  return NextResponse.json({ product });
}
