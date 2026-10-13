import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, CLIENT_COOKIE } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }
  const { email, password } = await req.json();
  const client = await prisma.client.findUnique({ where: { email: String(email || "").toLowerCase() } });
  if (!client || !client.actif || !bcrypt.compareSync(String(password || ""), client.passwordHash)) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }
  const token = await signSession({ sub: String(client.id), role: "client", name: client.raisonSociale });
  const res = NextResponse.json({ ok: true, name: client.raisonSociale });
  res.cookies.set(CLIENT_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
