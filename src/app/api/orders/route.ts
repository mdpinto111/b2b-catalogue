import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth";
import { resolvePrice } from "@/lib/pricing";
import { sendOrderEmails } from "@/lib/email";

const MAX_LINES = 200;
const MAX_QUANTITY = 10_000;

// GET: order history of the signed-in client
export async function GET() {
  const { session, error } = await requireClient();
  if (error) return error;
  const orders = await prisma.order.findMany({
    where: { clientId: Number(session.sub) },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ orders });
}

// POST: place an order.
// The browser only sends { productId, quantite }. Every price is recomputed from
// the database and frozen into a snapshot on the order line.
export async function POST(req: Request) {
  const { session, error } = await requireClient();
  if (error) return error;

  const clientId = Number(session.sub);
  const body = await req.json();
  const rawItems: { productId: number; quantite: number }[] = Array.isArray(body.items) ? body.items : [];
  const note: string | null = body.note ? String(body.note).slice(0, 1000) : null;

  if (rawItems.length > MAX_LINES) {
    return NextResponse.json({ error: "Trop de lignes dans la commande" }, { status: 400 });
  }

  const cleaned = rawItems
    .map((i) => ({
      productId: Number(i.productId),
      quantite: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(i.quantite) || 0))),
    }))
    .filter((i) => Number.isInteger(i.productId) && i.productId > 0);

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || !client.actif) return NextResponse.json({ error: "Compte inactif" }, { status: 403 });

  // Load the products and this client's pricing exceptions
  const productIds = cleaned.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, actif: true },
    include: { pricing: { where: { clientId } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Build the order lines with server-side prices
  const itemsToCreate: {
    productId: number;
    titreSnapshot: string;
    prixUnitaireSnapshot: number;
    quantite: number;
    totalLigne: number;
  }[] = [];

  for (const item of cleaned) {
    const p = byId.get(item.productId);
    if (!p) return NextResponse.json({ error: `Produit ${item.productId} indisponible` }, { status: 400 });
    const r = resolvePrice(p.prixBase, client.defaultDiscount, p.pricing[0] ?? null);
    if (!r.visible) {
      return NextResponse.json({ error: `Produit ${item.productId} non disponible pour ce compte` }, { status: 403 });
    }
    itemsToCreate.push({
      productId: p.id,
      titreSnapshot: p.titre,
      prixUnitaireSnapshot: r.price,
      quantite: item.quantite,
      totalLigne: r.price * item.quantite,
    });
  }

  const total = itemsToCreate.reduce((s, l) => s + l.totalLigne, 0);

  // Order and lines are created atomically
  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        clientId,
        statut: "nouvelle",
        total,
        note,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });
  });

  // Emails go out AFTER the commit: an email failure never loses the order
  try {
    await sendOrderEmails({
      orderId: order.id,
      clientNom: client.raisonSociale,
      clientEmail: client.email,
      note,
      total,
      lines: itemsToCreate.map((l) => ({
        titre: l.titreSnapshot,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaireSnapshot,
        totalLigne: l.totalLigne,
      })),
    });
  } catch (e) {
    console.error("Échec envoi emails commande", order.id, e);
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
