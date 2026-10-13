import { describe, expect, it } from "vitest";
import { escapeHtml, renderHtml } from "@/lib/email";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});

describe("order email", () => {
  const order = {
    orderId: 42,
    clientNom: "<b>Evil</b> Corp",
    clientEmail: "buyer@example.com",
    note: `<img src=x onerror="alert(1)">`,
    total: 2500,
    lines: [{ titre: "<script>x</script>", quantite: 1, prixUnitaire: 2500, totalLigne: 2500 }],
  };

  it("never injects client-controlled markup into the owner email", () => {
    const html = renderHtml(order, true);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Evil</b>");
    expect(html).toContain("&lt;img src=x");
  });
});
