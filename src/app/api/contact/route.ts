import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth";
import { sendContactEmail } from "@/lib/email";

const SUJET_MAX = 200;
const MESSAGE_MAX = 5000;

// POST: message from the signed-in client to the shop owner.
// The browser only sends the subject and the body. The sender identity is read
// back from the database so it cannot be spoofed.
export async function POST(req: Request) {
  const { session, error } = await requireClient();
  if (error) return error;

  const body = await req.json();
  const sujet = String(body.sujet ?? "").trim().slice(0, SUJET_MAX);
  const message = String(body.message ?? "").trim().slice(0, MESSAGE_MAX);

  if (!sujet || !message) {
    return NextResponse.json({ error: "Sujet et message sont requis." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: Number(session.sub) } });
  if (!client || !client.actif) return NextResponse.json({ error: "Compte inactif" }, { status: 403 });

  // Unlike order emails, the email IS the feature here: a failure must reach the user.
  try {
    await sendContactEmail({
      clientNom: client.raisonSociale,
      clientEmail: client.email,
      sujet,
      message,
    });
  } catch (e) {
    console.error("Échec envoi message de contact", client.id, e);
    return NextResponse.json({ error: "L'envoi a échoué. Merci de réessayer." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
