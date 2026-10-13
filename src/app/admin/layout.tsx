"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Package, Users, Tag, ClipboardList, Store, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Commandes", icon: ClipboardList },
  { href: "/admin/categories", label: "Catégories", icon: LayoutGrid },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/pricing", label: "Tarifs par client", icon: Tag },
  { href: "/admin/site-content", label: "Qui sommes-nous", icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The login page is rendered without the admin shell
  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const navLinks = (
    <nav className="px-2">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barre mobile */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} className="text-zinc-600" aria-label="Ouvrir le menu">
          <Menu size={22} />
        </button>
        <span className="font-semibold tracking-tight">Back-office</span>
        <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-800">
          Déconnexion
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:block">
        <div className="px-5 py-4 font-semibold tracking-tight">Back-office</div>
        {navLinks}
        <button onClick={logout} className="mx-5 mt-4 text-sm text-zinc-500 hover:text-zinc-800">
          Déconnexion
        </button>
      </aside>

      {/* Menu mobile (overlay + tiroir) */}
      {open && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-semibold tracking-tight">Back-office</span>
              <button onClick={() => setOpen(false)} className="text-zinc-500" aria-label="Fermer le menu">
                <X size={20} />
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}

      <main className="flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
