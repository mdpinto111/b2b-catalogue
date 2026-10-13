"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { LIMITS, MAX_CHIFFRES, type Chiffre } from "@/lib/site-content";

type Form = {
  titre: string;
  intro: string;
  imageId: number | null;
  adresse: string;
  telephone: string;
  email: string;
  horaires: string;
  chiffres: Chiffre[];
};

const emptyChiffres = (): Chiffre[] =>
  Array.from({ length: MAX_CHIFFRES }, () => ({ valeur: "", libelle: "" }));

const emptyForm: Form = {
  titre: "Qui sommes-nous",
  intro: "",
  imageId: null,
  adresse: "",
  telephone: "",
  email: "",
  horaires: "",
  chiffres: emptyChiffres(),
};

const inputClass = "rounded-md border border-zinc-300 px-3 py-1.5 text-sm";

export default function AdminSiteContent() {
  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/site-content")
      .then((r) => r.json())
      .then((d) => {
        if (d.content) {
          const chiffres = emptyChiffres();
          (d.content.chiffres || []).forEach((c: Chiffre, i: number) => {
            if (i < MAX_CHIFFRES) chiffres[i] = { valeur: c.valeur || "", libelle: c.libelle || "" };
          });
          setForm({ ...emptyForm, ...d.content, chiffres });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setChiffre(index: number, key: keyof Chiffre, value: string) {
    setForm((f) => ({
      ...f,
      chiffres: f.chiffres.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));
    setSaved(false);
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
      set("imageId", d.id);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Échec de l'enregistrement.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="px-4 py-6 text-sm text-zinc-500 sm:px-8">Chargement…</div>;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Qui sommes-nous</h1>
        <a
          href="/a-propos"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          Voir la page <ExternalLink size={14} />
        </a>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Cette page est publique : elle est visible sans connexion, y compris par vos prospects.
      </p>

      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Titre</span>
            <input
              value={form.titre}
              maxLength={LIMITS.titre}
              onChange={(e) => set("titre", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">
              Présentation
              <span className="ml-2 text-xs text-zinc-400">
                Laissez une ligne vide entre deux paragraphes
              </span>
            </span>
            <textarea
              value={form.intro}
              maxLength={LIMITS.intro}
              rows={8}
              onChange={(e) => set("intro", e.target.value)}
              placeholder="Notre maison sélectionne depuis 1994…"
              className={inputClass}
            />
            <span className="text-xs text-zinc-400">
              {form.intro.length} / {LIMITS.intro}
            </span>
          </label>

          <div className="mt-3 flex items-center gap-2">
            {form.imageId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/images/${form.imageId}`}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md object-cover"
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
              id="about-image-upload"
            />
            <label
              htmlFor="about-image-upload"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <Upload size={14} />{" "}
              {uploading ? "Envoi…" : form.imageId ? "Changer la photo" : "Choisir une photo"}
            </label>
            {form.imageId && (
              <button
                type="button"
                onClick={() => set("imageId", null)}
                className="text-xs text-zinc-400 hover:text-red-600"
              >
                Retirer
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium">Chiffres clés</h2>
          <div className="space-y-2">
            {form.chiffres.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <input
                  value={c.valeur}
                  maxLength={LIMITS.chiffre}
                  onChange={(e) => setChiffre(i, "valeur", e.target.value)}
                  placeholder="30 ans"
                  className={`${inputClass} w-32`}
                />
                <input
                  value={c.libelle}
                  maxLength={LIMITS.chiffre}
                  onChange={(e) => setChiffre(i, "libelle", e.target.value)}
                  placeholder="d'expérience"
                  className={`${inputClass} min-w-[12rem] flex-1`}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Laissez vides les encarts que vous ne voulez pas afficher.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium">Coordonnées et horaires</h2>
          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500">Adresse</span>
              <textarea
                value={form.adresse}
                maxLength={LIMITS.adresse}
                rows={2}
                onChange={(e) => set("adresse", e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-500">Téléphone</span>
                <input
                  value={form.telephone}
                  maxLength={LIMITS.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-500">Email</span>
                <input
                  value={form.email}
                  maxLength={LIMITS.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500">Horaires</span>
              <textarea
                value={form.horaires}
                maxLength={LIMITS.horaires}
                rows={3}
                onChange={(e) => set("horaires", e.target.value)}
                placeholder={"Lundi – vendredi : 8h – 18h\nSamedi : 9h – 12h"}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-emerald-700">Modifications enregistrées.</span>}
        </div>
      </div>
    </div>
  );
}
