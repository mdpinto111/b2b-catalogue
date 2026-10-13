"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Tag } from "lucide-react";

type Client = {
  id: number; raisonSociale: string; email: string; defaultDiscount: number; actif: boolean;
  _count: { pricing: number; orders: number };
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ raisonSociale: "", email: "", password: "", defaultDiscount: 0 });

  function load() {
    fetch("/api/admin/clients").then((r) => r.json()).then((d) => setClients(d.clients || []));
  }
  useEffect(load, []);

  async function create() {
    if (!form.raisonSociale || !form.email) return alert("Raison sociale et email requis.");
    await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ raisonSociale: "", email: "", password: "", defaultDiscount: 0 });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer ce client ? (ses commandes seront conservées)")) return;
    await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Clients</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Un nouveau client voit tout le catalogue au prix de base. Ajustez ses prix dans « Tarifs par client ».
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <input placeholder="Raison sociale" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        <input placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="Remise %" value={form.defaultDiscount}
            onChange={(e) => setForm({ ...form, defaultDiscount: Number(e.target.value) })}
            className="w-24 rounded-md border border-zinc-300 px-3 py-1.5 text-sm tnum" />
          <span className="text-sm text-zinc-500">%</span>
        </div>
        <button onClick={create} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white md:col-span-1">
          <Plus size={15} /> Créer le client
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Remise</th>
              <th className="px-4 py-2 font-medium">Écarts</th>
              <th className="px-4 py-2 font-medium">Commandes</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2 font-medium">{c.raisonSociale}</td>
                <td className="px-4 py-2 text-zinc-500">{c.email}</td>
                <td className="px-4 py-2 tnum">{c.defaultDiscount > 0 ? `−${c.defaultDiscount}%` : "—"}</td>
                <td className="px-4 py-2 tnum">{c._count.pricing}</td>
                <td className="px-4 py-2 tnum">{c._count.orders}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/pricing?client=${c.id}`} className="inline-flex items-center gap-1 text-xs text-indigo-600">
                      <Tag size={13} /> Tarifs
                    </Link>
                    <button onClick={() => remove(c.id)} className="text-zinc-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400">Aucun client.</p>}
      </div>
    </div>
  );
}
