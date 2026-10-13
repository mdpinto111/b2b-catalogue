"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { euro } from "@/lib/money";

type Item = { id: number; titreSnapshot: string; prixUnitaireSnapshot: number; quantite: number; totalLigne: number };
type Order = { id: number; statut: string; total: number; note: string | null; createdAt: string; items: Item[] };

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
  }, [id]);

  if (!order) return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-zinc-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-600" size={28} />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Commande #{order.id} enregistrée</h1>
          <p className="text-sm text-zinc-500">Un email de confirmation vous a été envoyé.</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between border-b border-zinc-100 px-4 py-3 text-sm last:border-0">
            <span>
              {i.titreSnapshot} <span className="text-zinc-400">× {i.quantite}</span>
            </span>
            <span className="tnum font-medium">{euro(i.totalLigne)}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="tnum text-lg font-semibold">{euro(order.total)}</span>
        </div>
      </div>

      {order.note && <p className="mt-4 text-sm text-zinc-500">Note : {order.note}</p>}

      <Link href="/catalogue" className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
        Retour au catalogue
      </Link>
    </div>
  );
}
