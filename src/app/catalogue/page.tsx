"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { euro } from "@/lib/money";

type Cat = { id: number; nom: string; count: number };
type Prod = { id: number; titre: string; description: string; images: string[]; price: number; category: { id: number; nom: string } };

export default function CataloguePage() {
  const { add } = useCart();
  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/categories")
      .then((r) => r.json())
      .then((d) => setCats(d.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = activeCat ? `?category=${activeCat}` : "";
    fetch(`/api/catalog/products${q}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold tracking-tight">Nos produits</h1>

      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat(null)}
          className={`rounded-full border px-3 py-1 text-sm ${
            activeCat === null ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700"
          }`}
        >
          Tout
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              activeCat === c.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            {c.nom} <span className="text-xs opacity-60">({c.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {search ? "Aucun produit ne correspond à votre recherche." : "Aucun produit disponible."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <div key={p.id} className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
              <Link href={`/catalogue/product/${p.id}`} className="block">
                <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-zinc-100 text-zinc-300">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.titre} className="h-full w-full rounded-md object-cover" />
                  ) : (
                    <span className="text-sm">Sans photo</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">{p.category.nom}</div>
                <div className="font-medium">{p.titre}</div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{p.description}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <span className="tnum font-semibold">{euro(p.price)}</span>
                <button
                  onClick={() => add({ productId: p.id, titre: p.titre, prix: p.price })}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
