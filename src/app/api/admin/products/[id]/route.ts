import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json();
  const product = await prisma.product.update({
    where: { id: Number((await params).id) },
    data: {
      categoryId: Number(b.categoryId),
      titre: String(b.titre),
      description: String(b.description || ""),
      images: Array.isArray(b.images) ? b.images : undefined,
      sku: b.sku ? String(b.sku) : null,
      prixBase: Number(b.prixBase),
      actif: b.actif !== false,
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    await prisma.product.delete({ where: { id: Number((await params).id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "Ce produit a des commandes associées et ne peut pas être supprimé. Désactivez-le à la place." },
        { status: 409 }
      );
    }
    throw e;
  }
}
