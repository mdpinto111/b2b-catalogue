import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, CLIENT_COOKIE, ADMIN_COOKIE, SessionPayload } from "./session";

export async function getClientSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value;
  const s = await verifySession(token);
  return s && s.role === "client" ? s : null;
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const s = await verifySession(token);
  return s && s.role === "admin" ? s : null;
}

// Call at the top of a route handler. Returns either the session or a 401 response.
export async function requireClient() {
  const s = await getClientSession();
  if (!s) return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  return { session: s, error: null };
}

export async function requireAdmin() {
  const s = await getAdminSession();
  if (!s) return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  return { session: s, error: null };
}
