"use client";

import {
  useEffect,
  useState,
  useTransition,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest" },
  { value: "popularity",  label: "Popularity" },
  { value: "price-asc",   label: "Price: low → high" },
  { value: "price-desc",  label: "Price: high → low" },
  { value: "name-asc",    label: "Name: A–Z" },
];

const BADGE_OPTIONS = [
  { value: "New",     label: "New arrivals" },
  { value: "Popular", label: "Popular" },
  { value: "Sale",    label: "On sale" },
];

// ── URL helpers ───────────────────────────────────────────────────────────────

function buildUrl(
  pathname: string,
  current: Record<string, string>,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(current);
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  // Changing any filter resets to page 1
  const filterKeys = Object.keys(updates).filter((k) => k !== "page" && k !== "sort");
  if (filterKeys.length > 0) params.delete("page");

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function countActiveFilters(params: Record<string, string>): number {
  return [params.category, params.badge, params.min || params.max, params.inStock]
    .filter(Boolean).length;
}

// ── Pagination ────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

// ── Filter panel (shared between sidebar and drawer) ─────────────────────────

function FilterPanel({
  categories,
  currentParams,
  onUpdate,
  onClearAll,
}: {
  categories: string[];
  currentParams: Record<string, string>;
  onUpdate: (updates: Record<string, string | null>) => void;
  onClearAll: () => void;
}) {
  const [minDraft, setMinDraft] = useState(currentParams.min ?? "");
  const [maxDraft, setMaxDraft] = useState(currentParams.max ?? "");

  // Keep drafts in sync when URL changes externally
  useEffect(() => setMinDraft(currentParams.min ?? ""), [currentParams.min]);
  useEffect(() => setMaxDraft(currentParams.max ?? ""), [currentParams.max]);

  function commitPrice() {
    onUpdate({ min: minDraft || null, max: maxDraft || null });
  }

  const activeCategory = currentParams.category ?? "";
  const activeBadge = currentParams.badge ?? "";
  const inStockOnly = currentParams.inStock === "1";

  const sectionClass = "border-b border-canopy/10 pb-5 mb-5";
  const pillBase = "stamp-badge rounded-full border px-3 py-1.5 transition-colors cursor-pointer";
  const pillActive = "border-canopy bg-canopy text-parchment";
  const pillInactive = "border-canopy/25 text-canopy hover:border-canopy";

  return (
    <div className="text-sm">
      {/* Category */}
      <div className={sectionClass}>
        <p className="mb-3 font-display text-xs uppercase tracking-wider text-canopy/60">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ category: null })}
            className={`${pillBase} ${!activeCategory ? pillActive : pillInactive}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onUpdate({ category: activeCategory === cat ? null : cat })}
              className={`${pillBase} ${activeCategory === cat ? pillActive : pillInactive}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Badge */}
      <div className={sectionClass}>
        <p className="mb-3 font-display text-xs uppercase tracking-wider text-canopy/60">
          Badge
        </p>
        <div className="flex flex-wrap gap-2">
          {BADGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ badge: activeBadge === value ? null : value })}
              className={`${pillBase} ${activeBadge === value ? pillActive : pillInactive}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className={sectionClass}>
        <p className="mb-3 font-display text-xs uppercase tracking-wider text-canopy/60">
          Price range
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Min"
            aria-label="Minimum price"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-20 rounded-card border border-canopy/20 px-2 py-1.5 text-sm text-loam focus:border-canopy focus:outline-none"
          />
          <span className="text-loam/30">–</span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-20 rounded-card border border-canopy/20 px-2 py-1.5 text-sm text-loam focus:border-canopy focus:outline-none"
          />
        </div>
      </div>

      {/* Stock */}
      <div className="mb-5">
        <p className="mb-3 font-display text-xs uppercase tracking-wider text-canopy/60">
          Availability
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onUpdate({ inStock: e.target.checked ? "1" : null })}
            className="h-4 w-4 rounded border-canopy/30 text-canopy"
          />
          <span className="text-loam/80">In stock only</span>
        </label>
      </div>

      {/* Clear all */}
      {countActiveFilters(currentParams) > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="w-full rounded-card border border-clay/30 py-2 text-xs text-clay transition-colors hover:bg-clay hover:text-parchment"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function FilterDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Trap body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-loam/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel — slides up from bottom */}
      <div
        role="dialog"
        aria-label="Product filters"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-parchment transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-canopy/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-canopy/10 px-5 pb-3">
          <h2 className="font-display text-base text-canopy">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-full p-1.5 text-loam hover:bg-sage"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProductsExplorer({
  products,
  categories,
  currentParams,
  total,
  page,
  totalPages,
}: {
  products: Product[];
  categories: string[];
  currentParams: Record<string, string>;
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(currentParams.q ?? "");

  // Keep search draft in sync with URL (back/forward navigation)
  useEffect(() => setSearchDraft(currentParams.q ?? ""), [currentParams.q]);

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        router.push(buildUrl(pathname, currentParams, updates));
      });
    },
    [router, pathname, currentParams]
  );

  const clearAll = useCallback(() => {
    setSearchDraft("");
    startTransition(() => router.push(pathname));
  }, [router, pathname]);

  // Debounced search
  useEffect(() => {
    if (searchDraft === (currentParams.q ?? "")) return;
    const timer = setTimeout(() => navigate({ q: searchDraft || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const sort = currentParams.sort ?? "newest";
  const activeFilterCount = countActiveFilters(currentParams);
  const hasAnyFilter = Object.keys(currentParams).length > 0;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="border-b border-canopy/10 bg-parchment">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="font-display text-3xl text-canopy">All Products</h1>
          <p className="mt-1 text-sm text-loam/60">
            {isPending
              ? "Updating…"
              : `${total} product${total === 1 ? "" : "s"}${
                  currentParams.q ? ` matching "${currentParams.q}"` : ""
                }`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy/40" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full rounded-card border border-canopy/20 bg-parchment py-2 pl-9 pr-3 text-sm text-loam focus:border-canopy focus:outline-none"
            />
          </div>

          {/* Mobile: Filters button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-card border border-canopy/20 px-3 py-2 text-sm text-canopy transition-colors hover:border-canopy md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-marigold font-mono text-[11px] text-loam">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) =>
              navigate({ sort: e.target.value === "newest" ? null : e.target.value })
            }
            aria-label="Sort products"
            className="ml-auto rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter chips — shown on desktop when filters active */}
        {hasAnyFilter && (
          <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
            {currentParams.category && (
              <Chip label={currentParams.category} onRemove={() => navigate({ category: null })} />
            )}
            {currentParams.badge && (
              <Chip label={currentParams.badge} onRemove={() => navigate({ badge: null })} />
            )}
            {(currentParams.min || currentParams.max) && (
              <Chip
                label={`${currentParams.min || "0"} – ${currentParams.max || "∞"}`}
                onRemove={() => navigate({ min: null, max: null })}
              />
            )}
            {currentParams.inStock && (
              <Chip label="In stock" onRemove={() => navigate({ inStock: null })} />
            )}
            {currentParams.q && (
              <Chip
                label={`"${currentParams.q}"`}
                onRemove={() => { setSearchDraft(""); navigate({ q: null }); }}
              />
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-clay hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Main layout: sidebar + grid ───────────────────────────────── */}
        <div className="mt-6 flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-52 shrink-0 md:block">
            <FilterPanel
              categories={categories}
              currentParams={currentParams}
              onUpdate={navigate}
              onClearAll={clearAll}
            />
          </aside>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {isPending ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="seed-packet aspect-[3/4] animate-pulse bg-sage/40" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-display text-xl text-canopy">No products match.</p>
                <p className="mt-2 text-sm text-loam/60">
                  Try different filters or{" "}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-clay underline"
                  >
                    clear all
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* ── Pagination ─────────────────────────────────────────── */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-12 flex items-center justify-center gap-1"
              >
                <PaginationButton
                  onClick={() => navigate({ page: page > 1 ? String(page - 1) : null })}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationButton>

                {pageNumbers.map((n, idx) =>
                  n === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-loam/40">
                      …
                    </span>
                  ) : (
                    <PaginationButton
                      key={n}
                      onClick={() => navigate({ page: n === 1 ? null : String(n) })}
                      active={n === page}
                      aria-label={`Page ${n}`}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </PaginationButton>
                  )
                )}

                <PaginationButton
                  onClick={() =>
                    navigate({ page: page < totalPages ? String(page + 1) : null })
                  }
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationButton>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────────── */}
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <FilterPanel
          categories={categories}
          currentParams={currentParams}
          onUpdate={(updates) => {
            navigate(updates);
            setDrawerOpen(false);
          }}
          onClearAll={() => {
            clearAll();
            setDrawerOpen(false);
          }}
        />
      </FilterDrawer>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-sage px-3 py-1 text-xs text-canopy">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 text-canopy/60 hover:text-clay"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-card border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "border-canopy bg-canopy text-parchment"
          : "border-canopy/20 text-canopy hover:border-canopy hover:bg-sage/40"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
