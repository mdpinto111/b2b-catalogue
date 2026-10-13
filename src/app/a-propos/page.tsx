import Link from "next/link";
import { ArrowLeft, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getClientSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";

// Reads the database on every request: no prerender at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Qui sommes-nous — Catalogue B2B",
  description: "Découvrez notre boutique, nos coordonnées et nos horaires.",
};

export default async function AProposPage() {
  const [session, content] = await Promise.all([getClientSession(), getSiteContent()]);
  const paragraphes = content.intro.split(/\n\s*\n/).filter((p) => p.trim());
  const coordonnees = [
    { icon: MapPin, label: "Adresse", value: content.adresse },
    { icon: Phone, label: "Téléphone", value: content.telephone },
    { icon: Mail, label: "Email", value: content.email },
    { icon: Clock, label: "Horaires", value: content.horaires },
  ].filter((c) => c.value.trim());

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {session ? (
        <Link
          href="/catalogue"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft size={15} /> Retour au catalogue
        </Link>
      ) : (
        <Link
          href="/login"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft size={15} /> Accéder à mon espace client
        </Link>
      )}

      <h1 className="mb-6 text-lg font-semibold tracking-tight">{content.titre}</h1>

      {content.hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/site-content/image"
          alt={content.titre}
          className="mb-6 max-h-80 w-full rounded-lg border border-zinc-200 object-cover"
        />
      )}

      <div className="space-y-4 text-sm leading-relaxed text-zinc-700">
        {paragraphes.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>

      {content.chiffres.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {content.chiffres.map((c, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
              <div className="text-xl font-semibold tracking-tight text-indigo-600">{c.valeur}</div>
              <div className="mt-1 text-sm text-zinc-500">{c.libelle}</div>
            </div>
          ))}
        </div>
      )}

      {coordonnees.length > 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Nous trouver</h2>
          <dl className="space-y-3">
            {coordonnees.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
                  <dd className="whitespace-pre-line text-sm text-zinc-700">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
