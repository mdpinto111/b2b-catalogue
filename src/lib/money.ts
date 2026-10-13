// Every amount of money is stored as an integer number of CENTS.
export function euro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
export function toCents(input: string | number): number {
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(",", "."));
  return Math.round((isNaN(n) ? 0 : n) * 100);
}
