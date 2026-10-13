"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ClipboardList, Mail, Store, LogOut } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  const { count } = useCart();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/catalogue" className="font-semibold tracking-tight">
            Catalogue
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-50 sm:px-3"
            >
              <Store size={16} />
              <span className="hidden sm:inline">À propos</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-50 sm:px-3"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">Nous contacter</span>
            </Link>
            <Link
              href="/mes-commandes"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-50 sm:px-3"
            >
              <ClipboardList size={16} />
              <span className="hidden sm:inline">Mes commandes</span>
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-50 sm:px-3"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Panier</span>
              {count > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-medium text-white">
                  {count}
                </span>
              )}
            </Link>
            <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-800" aria-label="Déconnexion">
              <LogOut size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
