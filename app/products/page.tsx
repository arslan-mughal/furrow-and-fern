import type { Metadata } from "next";
import { ProductsExplorer } from "@/components/ProductsExplorer";
import { queryProducts, getCategories, BADGES } from "@/lib/products";
import type { ProductSort } from "@/lib/products";

export const metadata: Metadata = {
  title: "All Products — Furrow & Fern",
};

const VALID_SORTS: ProductSort[] = [
  "newest", "price-asc", "price-desc", "name-asc", "popularity",
];

interface RawSearchParams {
  q?: string;
  category?: string;
  badge?: string;
  min?: string;
  max?: string;
  inStock?: string;
  sort?: string;
  page?: string;
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parsePage(value: string | undefined): number {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;

  const sort = VALID_SORTS.includes(raw.sort as ProductSort)
    ? (raw.sort as ProductSort)
    : "newest";

  const badge = BADGES.includes(raw.badge as (typeof BADGES)[number])
    ? raw.badge
    : undefined;

  const [result, categories] = await Promise.all([
    queryProducts({
      search: raw.q?.trim() || undefined,
      category: raw.category || undefined,
      badge,
      minPrice: parsePrice(raw.min),
      maxPrice: parsePrice(raw.max),
      inStockOnly: raw.inStock === "1",
      sort,
      page: parsePage(raw.page),
    }),
    getCategories(),
  ]);

  // Build currentParams for the client (only include non-empty values)
  const currentParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v !== "") currentParams[k] = v;
  }

  return (
    <ProductsExplorer
      products={result.products}
      categories={categories}
      currentParams={currentParams}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    />
  );
}
