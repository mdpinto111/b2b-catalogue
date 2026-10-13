"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Percent, RotateCcw, Eye, EyeOff, Copy, Save } from "lucide-react";
import { euro } from "@/lib/money";

type ClientLite = { id: number; raisonSociale: string; defaultDiscount: number };
type Row = {
  productId: number;
  titre: string;
  categorie: string;
  prixBase: number; // centimes
  override: number | null; // centimes ou null
  visible: boolean;
};

function computeEffective(row: Row, discount: number): { price: number; state: "base" | "global" | "override" } {
  if (row.override != null) return { price: row.override, state: "override" };
  if (discount > 0) return { price: Math.round(row.prixBase * (1 - discount / 100)), state: "global" };
  return { price: row.prixBase, state: "base" };
}

function PricingInner() {
  const params = useSearchParams();
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [pct, setPct] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the client list
  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((d) => {
        const list: ClientLite[] = (d.clients || []).map((c: any) => ({
          id: c.id, raisonSociale: c.raisonSociale, defaultDiscount: c.defaultDiscount,
        }));
        setClients(list);
        const fromUrl = Number(params.get("client"));
        setClientId(fromUrl || list[0]?.id || null);
      });
  }, [params]);

  // Load the price grid of the selected client
  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/admin/clients/${clientId}/pricing`)
      .then((r) => r.json())
      .then((d) => {
        setDiscount(d.client.defaultDiscount);
        setRows(
          (d.rows || []).map((r: any) => ({
            productId: r.productId, titre: r.titre, categorie: r.categorie,
            prixBase: r.prixBase, override: r.override, visible: r.visible,
          }))
        );
        setSelected(new Set());
        setDirty(false);
      });
  }, [clientId]);

  const filtered = useMemo(
    () => rows.filter((r) => r.titre.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const patchRow = (productId: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.productId === productId ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const toggleSel = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allSel = filtered.length > 0 && filtered.every((r) => selected.has(r.productId));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map((r) => r.productId)));

  const applyPct = () => {
    const v = parseFloat(pct);
    if (isNaN(v) || selected.size === 0) return;
    setRows((prev) =>
      prev.map((r) =>
        selected.has(r.productId) ? { ...r, override: Math.round(r.prixBase * (1 - v / 100)) } : r
      )
    );
    setPct(""); setSelected(new Set()); setDirty(true);
  };

  const resetSelected = () => {
    setRows((prev) => prev.map((r) => (selected.has(r.productId) ? { ...r, override: null } : r)));
    setSelected(new Set()); setDirty(true);
  };

  const doCopy = async () => {
    if (!copyFrom) return;
    const d = await fetch(`/api/admin/clients/${copyFrom}/pricing`).then((r) => r.json());
    const map = new Map<number, { override: number | null; visible: boolean }>(
      (d.rows || []).map((r: any) => [r.productId, { override: r.override, visible: r.visible }])
    );
    setRows((prev) =>
      prev.map((r) => {
        const src = map.get(r.productId);
        return src ? { ...r, override: src.override, visible: src.visible } : { ...r, override: null, visible: true };
      })
    );
    setCopyFrom(""); setDirty(true);
  };

  const save = async () => {
    if (!clientId) return;
    setSaving(true);
    await fetch(`/api/admin/clients/${clientId}/pricing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultDiscount: discount,
        items: rows.map((r) => ({ productId: r.productId, override: r.override, visible: r.visible })),
      }),
    });
    setSaving(false); setDirty(false);
  };

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tarifs par client</h1>
          <p className="text-sm text-zinc-500">Tout est au prix de base. Vous ne réglez que les écarts.</p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Save size={15} /> {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
        </button>
      </div>

      {/* Contexte */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Client</span>
          <select value={clientId ?? ""} onChange={(e) => setClientId(Number(e.target.value))}
            className="min-w-56 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.raisonSociale}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Remise par défaut</span>
          <div className="flex items-center gap-1.5">
            <input type="number" value={discount}
              onChange={(e) => { setDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0))); setDirty(true); }}
              className="w-20 rounded-md border border-zinc-300 px-3 py-1.5 text-sm tnum" />
            <span className="text-sm text-zinc-500">% sur tout</span>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Copier les tarifs de…</span>
          <div className="flex items-center gap-1.5">
            <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm">
              <option value="">Choisir…</option>
              {clients.filter((c) => c.id !== clientId).map((c) => <option key={c.id} value={c.id}>{c.raisonSociale}</option>)}
            </select>
            <button onClick={doCopy} disabled={!copyFrom}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-30">
              <Copy size={14} /> Copier
            </button>
          </div>
        </label>

        <label className="ml-auto flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Rechercher</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Produit"
            className="w-52 rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
        </label>
      </div>

      {/* Barre bulk */}
      <div className={`mb-3 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${selected.size ? "border-indigo-200 bg-indigo-50" : "border-zinc-200 bg-white"}`}>
        <span className="text-zinc-600">
          {selected.size ? <><b>{selected.size}</b> sélectionné(s)</> : "Cochez des produits pour agir en masse"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Percent size={14} className="text-zinc-400" />
          <input type="number" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="ex. 15" disabled={!selected.size}
            className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm tnum disabled:bg-zinc-100" />
          <button onClick={applyPct} disabled={!selected.size || pct === ""}
            className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white disabled:opacity-30">Appliquer −%</button>
          <button onClick={resetSelected} disabled={!selected.size}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 disabled:opacity-30">
            <RotateCcw size={13} /> Prix de base
          </button>
        </div>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <th className="w-10 px-3 py-2"><input type="checkbox" checked={allSel} onChange={toggleAll} className="accent-indigo-600" /></th>
              <th className="px-3 py-2 font-medium">Produit</th>
              <th className="px-3 py-2 font-medium">Prix de base</th>
              <th className="px-3 py-2 font-medium">Prix pour ce client</th>
              <th className="px-3 py-2 font-medium text-center">Visible</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const eff = computeEffective(r, discount);
              const sel = selected.has(r.productId);
              return (
                <tr key={r.productId} className={`border-b border-zinc-100 last:border-0 ${sel ? "bg-indigo-50/40" : ""}`}>
                  <td className="px-3 py-2"><input type="checkbox" checked={sel} onChange={() => toggleSel(r.productId)} className="accent-indigo-600" /></td>
                  <td className="px-3 py-2">
                    <span className={r.visible ? "" : "text-zinc-400 line-through"}>{r.titre}</span>
                    <span className="ml-2 text-xs text-zinc-400">{r.categorie}</span>
                  </td>
                  <td className="px-3 py-2 tnum text-zinc-400">{euro(r.prixBase)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={(eff.price / 100).toFixed(2)}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          patchRow(r.productId, { override: isNaN(v) ? null : Math.round(v * 100) });
                        }}
                        className={`w-24 rounded-md border px-2 py-1 text-right tnum focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          eff.state === "override" ? "border-indigo-300 font-semibold text-indigo-700" : "border-transparent bg-transparent text-zinc-400 hover:border-zinc-200"
                        }`}
                      />
                      {eff.state === "override" && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">négocié</span>}
                      {eff.state === "global" && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">−{discount}%</span>}
                      {eff.state === "base" && <span className="text-xs text-zinc-400">base</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => patchRow(r.productId, { visible: !r.visible })}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${r.visible ? "border-zinc-200 text-zinc-500 hover:bg-zinc-50" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
                      {r.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400">Aucun produit.</p>}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="px-8 py-6 text-sm text-zinc-400">Chargement…</div>}>
      <PricingInner />
    </Suspense>
  );
}
