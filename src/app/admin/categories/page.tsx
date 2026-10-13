"use client";
import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";

type Cat = { id: number; nom: string; slug: string; position: number; _count: { products: number } };

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [nom, setNom] = useState("");
  const [position, setPosition] = useState(0);

  function load() {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCats(d.categories || []));
  }
  useEffect(load, []);

  async function create() {
    if (!nom.trim()) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, slug: slugify(nom), position }),
    });
    setNom(""); setPosition(0); load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Catégories</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Nom</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Boissons"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm w-56" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Ordre</span>
          <input type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))}
            className="w-20 rounded-md border border-zinc-300 px-3 py-1.5 text-sm tnum" />
        </label>
        <button onClick={create} className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Slug</th>
              <th className="px-4 py-2 font-medium">Produits</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2 font-medium">{c.nom}</td>
                <td className="px-4 py-2 text-zinc-500">{c.slug}</td>
                <td className="px-4 py-2 tnum">{c._count.products}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(c.id)} className="text-zinc-400 hover:text-red-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cats.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400">Aucune catégorie.</p>}
      </div>
    </div>
  );
}
