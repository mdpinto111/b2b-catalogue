"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { euro } from "@/lib/money";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function order() {
    setErr("");
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantite: i.quantite })),
        note,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      clear();
      router.push(`/commande/${data.orderId}`);
    } else {
      setErr(data.error || "Une erreur est survenue.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-zinc-400">Votre panier est vide.</p>
        <Link href="/catalogue" className="mt-2 inline-block text-sm text-indigo-600">Retour au catalogue</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/cart" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft size={15} /> Retour au panier
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Validation de la commande</h1>

      <div className="rounded-lg border border-zinc-200 bg-white">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between border-b border-zinc-100 px-4 py-3 text-sm last:border-0">
            <span>
              {i.titre} <span className="text-zinc-400">× {i.quantite}</span>
            </span>
            <span className="tnum font-medium">{euro(i.prix * i.quantite)}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="tnum text-lg font-semibold">{euro(total)}</span>
        </div>
      </div>

      <label className="mt-6 block text-sm">
        <span className="text-zinc-500">Note (optionnel)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Instructions de livraison, remarques…"
        />
      </label>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={order}
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Envoi…" : "Commander"}
        </button>
      </div>
      <p className="mt-3 text-right text-xs text-zinc-400">Aucun paiement en ligne. Vous serez recontacté.</p>
    </div>
  );
}
