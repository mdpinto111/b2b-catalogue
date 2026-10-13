import { SignJWT, jwtVerify } from "jose";

const DEV_SECRET = "dev-secret-change-me-please";

// Resolved on first use rather than at import time, so `next build` does not need
// the secret. In production a missing or short secret is a hard error: falling back
// to a known value would let anyone forge an admin session.
let secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (secret) return secret;
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
    }
    secret = new TextEncoder().encode(value || DEV_SECRET);
  } else {
    secret = new TextEncoder().encode(value);
  }
  return secret;
}

export type Role = "client" | "admin";
export type SessionPayload = { sub: string; role: Role; name?: string };

export const CLIENT_COOKIE = "client_session";
export const ADMIN_COOKIE = "admin_session";

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
