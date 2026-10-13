import { describe, expect, it } from "vitest";
import { euro, toCents } from "@/lib/money";

describe("toCents", () => {
  it.each([
    ["12,50", 1250],
    ["12.5", 1250],
    [0.1 + 0.2, 30],
    ["19.999", 2000],
    ["not a number", 0],
  ])("converts %s to %i cents", (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });
});

describe("euro", () => {
  it("formats cents as French euros", () => {
    expect(euro(123456).replace(/\s/g, " ")).toBe("1 234,56 €");
  });
});
