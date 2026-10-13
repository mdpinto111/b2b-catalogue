"use client";
import { Fragment, useEffect, useState } from "react";
import { Download } from "lucide-react";
import writeExcelFile from "write-excel-file/browser";
import { euro } from "@/lib/money";

type Item = { id: number; titreSnapshot: string; quantite: number; prixUnitaireSnapshot: number; totalLigne: number };
type Order = {
  id: number;
  statut: string;
  total: number;
  note: string | null;
  createdAt: string;
  client: { raisonSociale: string; email: string };
  items: Item[];
};

const STATUTS: Record<string, string> = { nouvelle: "Nouvelle", traitee: "Traitée", annulee: "Annulée" };
const BADGE: Record<string, string> = {
  nouvelle: "bg-indigo-50 text-indigo-700",
  traitee: "bg-emerald-50 text-emerald-700",
  annulee: "bg-zinc-100 text-zinc-500",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  function load() {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(d.orders || []));
  }
  useEffect(load, []);

  async function setStatut(id: number, statut: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    load();
  }

  // Native .xlsx rather than CSV: Excel guesses the encoding of a CSV file, and
  // depending on the version it gets accented characters wrong.
  const XLSX_HEADER = ["Commande", "Date", "Client", "Email", "Statut", "Produit", "Quantité", "Prix unitaire (€)", "Total ligne (€)", "Total commande (€)", "Note"];

  const EURO = '#,##0.00 "€"';
  type Cell = string | number | { value: number; format: string };

  function orderToRows(o: Order): Cell[][] {
    const date = new Date(o.createdAt).toLocaleDateString("fr-FR");
    return o.items.map((i) => [
      o.id,
      date,
      o.client.raisonSociale,
      o.client.email,
      STATUTS[o.statut],
      i.titreSnapshot,
      i.quantite,
      { value: i.prixUnitaireSnapshot / 100, format: EURO },
      { value: i.totalLigne / 100, format: EURO },
      { value: o.total / 100, format: EURO },
      o.note || "",
    ]);
  }

  async function downloadXlsx(filename: string, rows: Cell[][]) {
    const widths = [10, 12, 22, 24, 10, 26, 9, 15, 13, 15, 30];
    await writeExcelFile([XLSX_HEADER, ...rows], {
      columns: widths.map((width) => ({ width })),
      sheet: "Commandes",
    }).toFile(filename);
  }

  function exportOrder(o: Order) {
    downloadXlsx(`commande-${o.id}.xlsx`, orderToRows(o));
  }

  function exportAll() {
    downloadXlsx("commandes.xlsx", orders.flatMap(orderToRows));
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Commandes</h1>
        <button
          onClick={exportAll}
          disabled={orders.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={14} /> Exporter tout (Excel)
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <Fragment key={o.id}>
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-2 tnum">{o.id}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{o.client.raisonSociale}</div>
                    <div className="text-xs text-zinc-400">{o.client.email}</div>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-2 tnum text-right font-medium">{euro(o.total)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${BADGE[o.statut]}`}>{STATUTS[o.statut]}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => exportOrder(o)} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800">
                        <Download size={12} /> Excel
                      </button>
                      <button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-xs text-indigo-600">
                        {open === o.id ? "Fermer" : "Détail"}
                      </button>
                    </div>
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="bg-zinc-50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="mb-2 space-y-1">
                        {o.items.map((i) => (
                          <div key={i.id} className="flex justify-between text-sm">
                            <span>{i.titreSnapshot} × {i.quantite}</span>
                            <span className="tnum">{euro(i.totalLigne)}</span>
                          </div>
                        ))}
                      </div>
                      {o.note && <p className="mb-2 text-sm text-zinc-500">Note : {o.note}</p>}
                      <div className="flex gap-2">
                        {Object.entries(STATUTS).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setStatut(o.id, k)}
                            className={`rounded-md border px-3 py-1 text-xs ${
                              o.statut === k ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400">Aucune commande.</p>}
      </div>
    </div>
  );
}
