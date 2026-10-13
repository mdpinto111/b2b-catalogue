import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4 Mo

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier envoyé." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (jpeg, png, webp, gif)." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (4 Mo max)." }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const image = await prisma.image.create({ data: { data, mimeType: file.type } });

  return NextResponse.json({ id: image.id, url: `/api/images/${image.id}` });
}
