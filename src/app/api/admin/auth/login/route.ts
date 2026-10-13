import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, ADMIN_COOKIE } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`admin-login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }
  const { email, password } = await req.json();
  const admin = await prisma.adminUser.findUnique({ where: { email: String(email || "").toLowerCase() } });
  if (!admin || !bcrypt.compareSync(String(password || ""), admin.passwordHash)) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }
  const token = await signSession({ sub: String(admin.id), role: "admin", name: admin.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
