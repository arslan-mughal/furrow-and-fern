import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product, ProductImage } from "./types";

function placeholderUrl(name: string) {
  return `https://placehold.co/600x600/1F3A2E/F2EDE1?text=${encodeURIComponent(name)}&font=raleway`;
}

const IMAGE_INCLUDE = {
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{
  include: typeof IMAGE_INCLUDE & { category: true };
}>;

function toProduct(row: ProductRow): Product {
  const sortedImages: ProductImage[] = row.images.map((img) => ({
    id: img.id,
    url: img.url,
    sortOrder: img.sortOrder,
    isFeatured: img.isFeatured,
  }));

  const featured = sortedImages.find((img) => img.isFeatured) ?? sortedImages[0];
  const primaryImage = featured?.url ?? placeholderUrl(row.name);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku ?? undefined,
    price: row.price,
    category: row.category.name,
    description: row.description,
    details: row.details,
    image: primaryImage,
    images: sortedImages,
    stock: row.stock,
    badge: row.badge ?? undefined,
    status: row.status,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
  };
}

const STOREFRONT_WHERE: Prisma.ProductWhereInput = {
  status: "PUBLISHED",
  deletedAt: null,
};

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: STOREFRONT_WHERE,
    include: { category: true, ...IMAGE_INCLUDE },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findFirst({
    where: { slug, ...STOREFRONT_WHERE },
    include: { category: true, ...IMAGE_INCLUDE },
  });
  return row ? toProduct(row) : undefined;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const row = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, ...IMAGE_INCLUDE },
  });
  return row ? toProduct(row) : undefined;
}

export async function getCategories(): Promise<string[]> {
  const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return rows.map((row) => row.name);
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      ...STOREFRONT_WHERE,
      category: { name: product.category },
      id: { not: product.id },
    },
    include: { category: true, ...IMAGE_INCLUDE },
    take: limit,
  });
  return rows.map(toProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { ...STOREFRONT_WHERE, badge: { in: ["Popular", "New"] } },
    include: { category: true, ...IMAGE_INCLUDE },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toProduct);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { ...STOREFRONT_WHERE, badge: "New" },
    include: { category: true, ...IMAGE_INCLUDE },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  // Fall back to most recently added products if no "New" badge items
  if (rows.length === 0) {
    const fallback = await prisma.product.findMany({
      where: STOREFRONT_WHERE,
      include: { category: true, ...IMAGE_INCLUDE },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return fallback.map(toProduct);
  }
  return rows.map(toProduct);
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { ...STOREFRONT_WHERE, badge: "Popular" },
    include: { category: true, ...IMAGE_INCLUDE },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  // Fall back to in-stock products if no "Popular" badge items
  if (rows.length === 0) {
    const fallback = await prisma.product.findMany({
      where: { ...STOREFRONT_WHERE, stock: { gt: 0 } },
      include: { category: true, ...IMAGE_INCLUDE },
      orderBy: { stock: "desc" },
      take: limit,
    });
    return fallback.map(toProduct);
  }
  return rows.map(toProduct);
}

// --- Search, filter, sort, and paginate (Phase 5 + advanced filters) --------

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "popularity";

export const BADGES = ["New", "Popular", "Sale"] as const;
export const PAGE_SIZE = 12;

export interface ProductQuery {
  search?: string;
  category?: string;
  badge?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
}

export interface QueryProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { ...STOREFRONT_WHERE };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.category && query.category !== "All") {
    where.category = { name: query.category };
  }
  if (query.badge && BADGES.includes(query.badge as (typeof BADGES)[number])) {
    where.badge = query.badge;
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.inStockOnly) {
    where.stock = { gt: 0 };
  }
  return where;
}

function getOrderBy(
  sort: ProductSort | undefined
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":  return { price: "asc" };
    case "price-desc": return { price: "desc" };
    case "name-asc":   return { name: "asc" };
    // popularity and newest both fall through to createdAt desc here;
    // popularity is handled separately below with a badge-priority merge.
    default:           return { createdAt: "desc" };
  }
}

export async function queryProducts(
  query: ProductQuery
): Promise<QueryProductsResult> {
  const page = Math.max(1, query.page ?? 1);
  const where = buildWhere(query);
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  // ── Popularity sort: Popular-badge items first, then everything else ──────
  // Done via two queries + in-memory merge because Prisma doesn't support
  // CASE WHEN in orderBy without raw SQL. Fine for a catalog this size;
  // swap for a raw query if the catalog grows to thousands of products.
  if (query.sort === "popularity") {
    const [popular, rest] = await Promise.all([
      prisma.product.findMany({
        where: { ...where, badge: "Popular" },
        include: { category: true, ...IMAGE_INCLUDE },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { ...where, badge: { not: "Popular" } },
        include: { category: true, ...IMAGE_INCLUDE },
        orderBy: { name: "asc" },
      }),
    ]);

    const merged = [...popular, ...rest];
    const start = (clampedPage - 1) * PAGE_SIZE;
    return {
      products: merged.slice(start, start + PAGE_SIZE).map(toProduct),
      total,
      page: clampedPage,
      totalPages,
    };
  }

  // ── Standard sorts (single Prisma query with skip/take) ───────────────────
  const rows = await prisma.product.findMany({
    where,
    include: { category: true, ...IMAGE_INCLUDE },
    orderBy: getOrderBy(query.sort),
    skip: (clampedPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return {
    products: rows.map(toProduct),
    total,
    page: clampedPage,
    totalPages,
  };
}
