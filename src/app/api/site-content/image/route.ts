import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// The photo can be replaced at any time behind this stable URL: never prerender it.
export const dynamic = "force-dynamic";

// Public on purpose: only the one image referenced by the site content is exposed here.
// Product images stay behind the session check in /api/images/[id].
export async function GET() {
  const content = await prisma.siteContent.findUnique({
    where: { id: 1 },
    include: { image: true },
  });
  if (!content?.image) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(content.image.data), {
    headers: {
      "Content-Type": content.image.mimeType,
      // Short-lived: the URL is stable while the photo behind it can be replaced.
      "Cache-Control": "public, max-age=60",
    },
  });
}
