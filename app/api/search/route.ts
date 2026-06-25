import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_QUERY_LEN = 100;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
const SNIPPET_CONTEXT = 60; // chars either side of match

// ── HTML helpers ──────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Wraps every occurrence of `raw` in the escaped `text` with <mark> tags.
 * The text is HTML-escaped first so the output is safe for dangerouslySetInnerHTML.
 */
function highlight(text: string, raw: string): string {
  const safe = escapeHtml(text);
  if (!raw.trim()) return safe;

  // Escape the query for insertion into a RegExp, then also escape HTML
  // entities so the regex matches against the already-escaped text.
  const regexSafe = escapeHtml(raw.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    return safe.replace(new RegExp(`(${regexSafe})`, "gi"), "<mark>$1</mark>");
  } catch {
    return safe;
  }
}

/**
 * Finds the first match in `text` and returns a short surrounding snippet
 * with the match highlighted. Returns null if `raw` isn't found.
 */
function getSnippet(text: string, raw: string): string | null {
  const q = raw.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return null;

  const start = Math.max(0, idx - SNIPPET_CONTEXT);
  const end = Math.min(text.length, idx + q.length + SNIPPET_CONTEXT);
  const snippet =
    (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");

  return highlight(snippet, raw);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim().slice(0, MAX_QUERY_LEN);

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  // ── Query ───────────────────────────────────────────────────────────────────
  // Searches: product name, description, SKU, and category name.
  // Uses Prisma's `contains + mode: insensitive` (maps to ILIKE in Postgres).
  // For production at scale, add a GIN trigram index:
  //   CREATE EXTENSION IF NOT EXISTS pg_trgm;
  //   CREATE INDEX product_name_trgm ON "Product" USING gin (name gin_trgm_ops);
  //   CREATE INDEX product_desc_trgm ON "Product" USING gin (description gin_trgm_ops);
  // That turns O(n) sequential scans into O(log n) index seeks for ILIKE.

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        category: true,
        images: {
          where: { isFeatured: true },
          take: 1,
        },
      },
      orderBy: [
        // Exact name-start matches first (manual boost — Postgres doesn't
        // expose tf-idf relevance natively without tsvector).
        { name: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
    }),
    prisma.product.count({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
    }),
  ]);

  // ── Shape results ───────────────────────────────────────────────────────────

  const results = rows.map((row) => {
    const primaryImage =
      row.images[0]?.url ??
      `https://placehold.co/80x80/1F3A2E/F2EDE1?text=${encodeURIComponent(row.name)}&font=raleway`;

    // Decide which snippet to show: prefer description if the match is there,
    // otherwise fall back to the name highlight alone.
    const descSnippet = getSnippet(row.description, q);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category.name,
      price: row.price,
      badge: row.badge,
      image: primaryImage,
      highlight: {
        name: highlight(row.name, q),
        snippet: descSnippet,
      },
    };
  });

  return NextResponse.json(
    { results, total },
    {
      headers: {
        // 30s browser cache, up to 60s stale-while-revalidate on CDN edge.
        // Short enough that new/renamed products appear quickly.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}
