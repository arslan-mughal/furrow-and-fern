/** Orders and OrderItems work in integer cents throughout this app. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
