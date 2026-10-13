import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows up to the limit, then blocks", () => {
    const now = 1_000;
    const results = Array.from({ length: 4 }, () => rateLimit("ip", 3, 60_000, now));
    expect(results).toEqual([true, true, true, false]);
  });

  it("opens a new window once the previous one has expired", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip", 3, 60_000, 0);
    expect(rateLimit("ip", 3, 60_000, 60_001)).toBe(true);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 5; i++) rateLimit("a", 3, 60_000, 0);
    expect(rateLimit("b", 3, 60_000, 0)).toBe(true);
  });
});
