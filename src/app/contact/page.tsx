"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const SUJET_MAX = 200;
const MESSAGE_MAX = 5000;

export default function ContactPage() {
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = sujet.trim() !== "" && message.trim() !== "" && !submitting;

  async function send() {
    setErr("");
    setSubmitting(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sujet, message }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setSujet("");
      setMessage("");
      setSent(true);
    } else {
      setErr(data.error || "Une erreur est survenue.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/catalogue" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft size={15} /> Retour au catalogue
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Nous contacter</h1>

      {sent ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="font-medium">Message envoyé</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Nous vous répondrons à l’adresse email de votre compte.
          </p>
          <button onClick={() => setSent(false)} className="mt-4 text-sm text-indigo-600">
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-500">
            Une question sur un produit, un prix ou une commande ? Écrivez-nous, nous vous répondrons à
            l’adresse email de votre compte.
          </p>

          <label className="block text-sm">
            <span className="text-zinc-500">Sujet</span>
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              maxLength={SUJET_MAX}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Disponibilité d’un produit, demande de devis…"
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="text-zinc-500">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={MESSAGE_MAX}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Votre message…"
            />
          </label>

          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

          <div className="mt-6 flex justify-end">
            <button
              onClick={send}
              disabled={!canSubmit}
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
