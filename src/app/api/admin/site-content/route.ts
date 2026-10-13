import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LIMITS, parseChiffres } from "@/lib/site-content";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const content = await prisma.siteContent.findUnique({ where: { id: 1 } });
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();

  // Keep the reference only if the image row still exists.
  let imageId: number | null = Number(body.imageId) || null;
  if (imageId) {
    const exists = await prisma.image.findUnique({ where: { id: imageId }, select: { id: true } });
    if (!exists) imageId = null;
  }

  const data = {
    titre: text(body.titre, LIMITS.titre) || "Qui sommes-nous",
    intro: text(body.intro, LIMITS.intro),
    imageId,
    adresse: text(body.adresse, LIMITS.adresse),
    telephone: text(body.telephone, LIMITS.telephone),
    email: text(body.email, LIMITS.email),
    horaires: text(body.horaires, LIMITS.horaires),
    chiffres: parseChiffres(body.chiffres),
  };

  const content = await prisma.siteContent.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json({ content });
}
