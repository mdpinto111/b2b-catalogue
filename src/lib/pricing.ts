import { prisma } from "./prisma";

export type PriceState = "base" | "global" | "override";

export type ResolvedPrice = {
  price: number; // centimes
  visible: boolean;
  state: PriceState;
};

// Core pricing rule, ALWAYS evaluated server-side.
// row = the exception stored for this client/product pair, if any.
export function resolvePrice(
  prixBase: number,
  defaultDiscount: number,
  row?: { prix: number | null; visible: boolean } | null
): ResolvedPrice {
  const visible = row ? row.visible : true;

  if (row && row.prix != null) {
    return { price: row.prix, visible, state: "override" };
  }
  if (defaultDiscount > 0) {
    return { price: Math.round(prixBase * (1 - defaultDiscount / 100)), visible, state: "global" };
  }
  return { price: prixBase, visible, state: "base" };
}

// Returns the products VISIBLE to a client, at THEIR prices.
export async function catalogForClient(clientId: number, categoryId?: number) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return [];

  const products = await prisma.product.findMany({
    where: { actif: true, ...(categoryId ? { categoryId } : {}) },
    include: {
      category: true,
      pricing: { where: { clientId } },
    },
    orderBy: [{ categoryId: "asc" }, { titre: "asc" }],
  });

  return products
    .map((p) => {
      const row = p.pricing[0] ?? null;
      const r = resolvePrice(p.prixBase, client.defaultDiscount, row);
      return {
        id: p.id,
        titre: p.titre,
        description: p.description,
        images: p.images,
        sku: p.sku,
        category: { id: p.category.id, nom: p.category.nom, slug: p.category.slug },
        price: r.price,
        visible: r.visible,
      };
    })
    .filter((p) => p.visible); // hidden products are never returned
}

// Resolves one product's price for a client (null when hidden).
export async function priceForClientProduct(clientId: number, productId: number) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true, pricing: { where: { clientId } } },
  });
  if (!client || !product || !product.actif) return null;

  const r = resolvePrice(product.prixBase, client.defaultDiscount, product.pricing[0] ?? null);
  if (!r.visible) return null;

  return {
    id: product.id,
    titre: product.titre,
    description: product.description,
    images: product.images,
    sku: product.sku,
    category: { id: product.category.id, nom: product.category.nom, slug: product.category.slug },
    price: r.price,
  };
}
