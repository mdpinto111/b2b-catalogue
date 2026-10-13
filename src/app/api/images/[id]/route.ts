import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, getClientSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const [admin, client] = await Promise.all([getAdminSession(), getClientSession()]);
  if (!admin && !client) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const image = await prisma.image.findUnique({ where: { id: Number((await params).id) } });
  if (!image) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
