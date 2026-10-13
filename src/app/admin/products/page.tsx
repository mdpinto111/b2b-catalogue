"use client";
import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Pencil, X, Upload } from "lucide-react";
import { euro, toCents } from "@/lib/money";

type Cat = { id: number; nom: string };
type Prod = {
  id: number; titre: string; description: string; sku: string | null;
  prixBase: number; actif: boolean; images: string[]; category: { nom: string }; categoryId: number;
};

const emptyForm = { titre: "", description: "", sku: "", prix: "", categoryId: "", image: "", actif: true };

export default function AdminProducts() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products || []));
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCats(d.categories || []));
  }
  useEffect(load, []);

  function startEdit(p: Prod) {
    setEditingId(p.id);
    setForm({
      titre: p.titre,
      description: p.description,
      sku: p.sku || "",
      prix: (p.prixBase / 100).toString(),
      categoryId: String(p.categoryId),
      image: p.images[0] || "",
      actif: p.actif,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || "Échec de l'upload.");
        return;
      }
      setForm((f) => ({ ...f, image: d.url }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    if (!form.titre || !form.categoryId) return alert("Titre et catégorie requis.");
    const body = JSON.stringify({
      titre: form.titre,
      description: form.description,
      sku: form.sku || null,
      prixBase: toCents(form.prix),
      categoryId: Number(form.categoryId),
      images: form.image ? [form.image] : [],
      actif: form.actif,
    });
    if (editingId) {
      await fetch(`/api/admin/products/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
    } else {
      await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    }
    cancelEdit();
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Suppression impossible.");
      return;
    }
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Produits</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <input placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">Catégorie…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <input placeholder="Prix de base (€)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm tnum" />
        <input placeholder="SKU (optionnel)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        <div className="flex items-center gap-2 md:col-span-2">
          {form.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload} className="hidden" id="product-image-upload" />
          <label htmlFor="product-image-upload"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50">
            <Upload size={14} /> {uploading ? "Envoi…" : form.image ? "Changer la photo" : "Choisir un fichier"}
          </label>
          {form.image && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))}
              className="text-xs text-zinc-400 hover:text-red-600">
              Retirer
            </button>
          )}
        </div>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="col-span-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm md:col-span-3" rows={2} />
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
          Produit actif (visible au catalogue)
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button onClick={save} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
            {editingId ? <Pencil size={15} /> : <Plus size={15} />}
            {editingId ? "Enregistrer les modifications" : "Ajouter le produit"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600">
              <X size={15} /> Annuler
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Produit</th>
              <th className="px-4 py-2 font-medium">Catégorie</th>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium text-right">Prix de base</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-b border-zinc-100 last:border-0 ${editingId === p.id ? "bg-zinc-50" : ""}`}>
                <td className="px-4 py-2 font-medium">{p.titre}</td>
                <td className="px-4 py-2 text-zinc-500">{p.category.nom}</td>
                <td className="px-4 py-2 text-zinc-500">{p.sku || "—"}</td>
                <td className="px-4 py-2 tnum text-right">{euro(p.prixBase)}</td>
                <td className="px-4 py-2 text-zinc-500">{p.actif ? "Actif" : "Inactif"}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => startEdit(p)} className="text-zinc-400 hover:text-indigo-600"><Pencil size={15} /></button>
                    <button onClick={() => remove(p.id)} className="text-zinc-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400">Aucun produit.</p>}
      </div>
    </div>
  );
}
