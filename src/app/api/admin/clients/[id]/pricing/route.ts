import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { resolvePrice } from "@/lib/pricing";

// GET: every product with its resolved price for this client, and where that price comes from.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const clientId = Number((await params).id);
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const products = await prisma.product.findMany({
    orderBy: [{ categoryId: "asc" }, { titre: "asc" }],
    include: { category: true, pricing: { where: { clientId } } },
  });

  const rows = products.map((p) => {
    const row = p.pricing[0] ?? null;
    const r = resolvePrice(p.prixBase, client.defaultDiscount, row);
    return {
      productId: p.id,
      titre: p.titre,
      categorie: p.category.nom,
      prixBase: p.prixBase,
      prix: r.price,        // effective price shown
      override: row?.prix ?? null, // exception de prix (ou null)
      visible: r.visible,
      state: r.state,       // base | global | override
    };
  });

  return NextResponse.json({
    client: { id: client.id, raisonSociale: client.raisonSociale, defaultDiscount: client.defaultDiscount },
    rows,
  });
}

// PUT: bulk save. Only exceptions are stored.
// body: { defaultDiscount?, items: [{ productId, override:number|null, visible:boolean }] }
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const clientId = Number((await params).id);
  const b = await req.json();
  const items: { productId: number; override: number | null; visible: boolean }[] = Array.isArray(b.items)
    ? b.items
    : [];

  await prisma.$transaction(async (tx) => {
    if (b.defaultDiscount != null) {
      await tx.client.update({
        where: { id: clientId },
        data: { defaultDiscount: Math.max(0, Math.min(100, Number(b.defaultDiscount) || 0)) },
      });
    }

    for (const it of items) {
      const productId = Number(it.productId);
      const override = it.override == null ? null : Math.max(0, Math.round(Number(it.override)));
      const visible = it.visible !== false;

      // No exception left (base price and visible): delete the row if there is one
      if (override == null && visible) {
        await tx.clientProductPricing.deleteMany({ where: { clientId, productId } });
        continue;
      }

      await tx.clientProductPricing.upsert({
        where: { clientId_productId: { clientId, productId } },
        update: { prix: override, visible },
        create: { clientId, productId, prix: override, visible },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
