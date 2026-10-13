"use client";
import Link from "next/link";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { euro } from "@/lib/money";

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/catalogue" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft size={15} /> Continuer mes achats
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Mon panier</h1>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">Votre panier est vide.</p>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white">
          {items.map((i) => (
            <div key={i.productId} className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4 last:border-0 sm:flex-nowrap sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{i.titre}</div>
                <div className="tnum text-sm text-zinc-500">{euro(i.prix)} / unité</div>
              </div>
              <input
                type="number"
                min={1}
                value={i.quantite}
                onChange={(e) => setQty(i.productId, Math.max(1, Number(e.target.value)))}
                className="w-16 shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-sm tnum"
              />
              <div className="tnum w-20 shrink-0 text-right font-semibold sm:w-24">{euro(i.prix * i.quantite)}</div>
              <button onClick={() => remove(i.productId)} className="shrink-0 text-zinc-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="tnum text-lg font-semibold">{euro(total)}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Link href="/checkout" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Passer la commande
          </Link>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-zinc-400">
        Les prix affichés sont vos prix. Le total est revérifié au moment de la commande.
      </p>
    </div>
  );
}
