"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: number;
  titre: string;
  prix: number; // cents, display only: re-checked at checkout
  quantite: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantite">, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add: CartCtx["add"] = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === item.productId);
      if (found) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantite: i.quantite + qty } : i
        );
      }
      return [...prev, { ...item, quantite: qty }];
    });
  }, []);

  const setQty: CartCtx["setQty"] = useCallback((productId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantite: qty } : i))
    );
  }, []);

  const remove: CartCtx["remove"] = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantite, 0);
  const total = items.reduce((s, i) => s + i.prix * i.quantite, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, total }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
