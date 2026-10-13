import { NextRequest, NextResponse } from "next/server";
import { verifySession, CLIENT_COOKIE, ADMIN_COOKIE } from "@/lib/session";

const CLIENT_PROTECTED = ["/catalogue", "/cart", "/checkout", "/commande", "/mes-commandes", "/contact"];
const ADMIN_PROTECTED = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Espace admin ---
  if (ADMIN_PROTECTED.some((p) => pathname.startsWith(p)) && pathname !== "/admin/login") {
    const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!s || s.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // --- Espace client ---
  if (CLIENT_PROTECTED.some((p) => pathname.startsWith(p))) {
    const s = await verifySession(req.cookies.get(CLIENT_COOKIE)?.value);
    if (!s || s.role !== "client") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/catalogue/:path*", "/cart", "/checkout", "/commande/:path*", "/mes-commandes", "/contact", "/admin/:path*"],
};
