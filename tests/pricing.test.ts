import { describe, expect, it } from "vitest";
import { resolvePrice } from "@/lib/pricing";

describe("resolvePrice", () => {
  it("uses the base price when there is no exception and no discount", () => {
    expect(resolvePrice(1000, 0, null)).toEqual({ price: 1000, visible: true, state: "base" });
  });

  it("applies the client's global discount, rounded to the cent", () => {
    expect(resolvePrice(999, 15, null)).toEqual({ price: 849, visible: true, state: "global" });
  });

  it("prefers a negotiated price over the global discount", () => {
    expect(resolvePrice(1000, 20, { prix: 700, visible: true })).toEqual({
      price: 700,
      visible: true,
      state: "override",
    });
  });

  it("accepts a negotiated price of zero", () => {
    expect(resolvePrice(1000, 0, { prix: 0, visible: true }).price).toBe(0);
  });

  it("keeps the discounted price but hides the product when the exception only hides it", () => {
    expect(resolvePrice(1000, 10, { prix: null, visible: false })).toEqual({
      price: 900,
      visible: false,
      state: "global",
    });
  });

  it("follows base price changes for clients without a negotiated price", () => {
    expect(resolvePrice(1200, 0, { prix: null, visible: true }).price).toBe(1200);
  });
});
