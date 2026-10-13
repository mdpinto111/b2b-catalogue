"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { euro } from "@/lib/money";

type Item = { id: number; titreSnapshot: string; quantite: number; totalLigne: number };
type Order = { id: number; statut: string; total: number; note: string | null; createdAt: string; items: Item[] };

const STATUTS: Record<string, string> = { nouvelle: "Nouvelle", traitee: "Traitée", annulee: "Annulée" };
const BADGE: Record<string, string> = {
  nouvelle: "bg-indigo-50 text-indigo-700",
  traitee: "bg-emerald-50 text-emerald-700",
  annulee: "bg-zinc-100 text-zinc-500",
};

export default function MesCommandes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/catalogue" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft size={15} /> Retour au catalogue
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Mes commandes</h1>

      {loading ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-400">Vous n’avez pas encore passé de commande.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2 tnum">{o.id}</td>
                    <td className="px-4 py-2 text-zinc-500">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-2 tnum text-right font-medium">{euro(o.total)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${BADGE[o.statut]}`}>{STATUTS[o.statut]}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-xs text-indigo-600">
                        {open === o.id ? "Fermer" : "Détail"}
                      </button>
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-zinc-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="space-y-1">
                          {o.items.map((i) => (
                            <div key={i.id} className="flex justify-between text-sm">
                              <span>{i.titreSnapshot} × {i.quantite}</span>
                              <span className="tnum">{euro(i.totalLigne)}</span>
                            </div>
                          ))}
                        </div>
                        {o.note && <p className="mt-2 text-sm text-zinc-500">Note : {o.note}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
