"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { euro } from "@/lib/money";

type Prod = { id: number; titre: string; description: string; images: string[]; price: number; category: { nom: string } };

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { add } = useCart();
  const [p, setP] = useState<Prod | null>(null);
  const [qty, setQty] = useState(1);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/catalog/products/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setP(d.product))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="text-sm text-zinc-500">Produit indisponible.</p>;
  if (!p) return <p className="text-sm text-zinc-400">Chargement…</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft size={15} /> Retour
      </button>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
          {p.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={p.titre} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <span>Sans photo</span>
          )}
        </div>
        <div>
          <div className="text-xs text-zinc-400">{p.category.nom}</div>
          <h1 className="text-xl font-semibold tracking-tight">{p.titre}</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{p.description}</p>
          <div className="mt-6 tnum text-2xl font-semibold">{euro(p.price)}</div>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-md border border-zinc-300 px-3 py-2 text-sm tnum"
            />
            <button
              onClick={() => {
                add({ productId: p.id, titre: p.titre, prix: p.price }, qty);
                router.push("/cart");
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
