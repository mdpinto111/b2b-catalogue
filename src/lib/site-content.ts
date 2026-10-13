import { prisma } from "./prisma";

export type Chiffre = { valeur: string; libelle: string };

export type SiteContentView = {
  titre: string;
  intro: string;
  hasImage: boolean;
  adresse: string;
  telephone: string;
  email: string;
  horaires: string;
  chiffres: Chiffre[];
};

// Field length caps, shared between the admin form and the API route.
export const LIMITS = {
  titre: 120,
  intro: 5000,
  adresse: 300,
  telephone: 40,
  email: 200,
  horaires: 500,
  chiffre: 40,
} as const;

export const MAX_CHIFFRES = 4;

// Shown until the owner fills in the back-office, so the public page is never blank.
export const FALLBACK: SiteContentView = {
  titre: "Qui sommes-nous",
  intro:
    "Notre présentation arrive très bientôt.\n\nEn attendant, n'hésitez pas à nous contacter : nous répondons à toutes vos questions sur notre catalogue et nos conditions.",
  hasImage: false,
  adresse: "",
  telephone: "",
  email: "",
  horaires: "",
  chiffres: [],
};

export function parseChiffres(value: unknown): Chiffre[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => ({
      valeur: typeof (c as Chiffre)?.valeur === "string" ? (c as Chiffre).valeur.trim() : "",
      libelle: typeof (c as Chiffre)?.libelle === "string" ? (c as Chiffre).libelle.trim() : "",
    }))
    .filter((c) => c.valeur || c.libelle)
    .slice(0, MAX_CHIFFRES)
    .map((c) => ({
      valeur: c.valeur.slice(0, LIMITS.chiffre),
      libelle: c.libelle.slice(0, LIMITS.chiffre),
    }));
}

// Reads the single row and falls back to placeholder copy when it is missing or empty.
export async function getSiteContent(): Promise<SiteContentView> {
  const row = await prisma.siteContent.findUnique({ where: { id: 1 } });
  if (!row || !row.intro.trim()) {
    return { ...FALLBACK, hasImage: row?.imageId != null };
  }
  return {
    titre: row.titre.trim() || FALLBACK.titre,
    intro: row.intro,
    hasImage: row.imageId != null,
    adresse: row.adresse,
    telephone: row.telephone,
    email: row.email,
    horaires: row.horaires,
    chiffres: parseChiffres(row.chiffres),
  };
}
