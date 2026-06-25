"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type KeyboardEvent,
  type RefObject, // <-- Fixed: Imported directly so TS doesn't crash looking for 'React'
} from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  badge: string | null;
  image: string;
  highlight: {
    name: string;
    snippet: string | null;
  };
}

const DEBOUNCE_MS = 220;
const MIN_QUERY_LEN = 2;

// ── Highlighted text ──────────────────────────────────────────────────────────

function HighlightedText({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&_mark]:rounded-sm [&_mark]:bg-marigold/30 [&_mark]:font-medium [&_mark]:not-italic"
    />
  );
}

// ── Single result row ─────────────────────────────────────────────────────────

function ResultRow({
  result,
  focused,
  onMouseEnter,
  onClick,
  id,
}: {
  result: SearchResult;
  focused: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  id: string;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={focused}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
        focused ? "bg-sage/60" : "hover:bg-sage/30"
      }`}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.image}
        alt=""
        className="h-11 w-11 shrink-0 rounded-sm border border-canopy/10 object-cover"
        loading="lazy"
      />

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-canopy">
          <HighlightedText html={result.highlight.name} />
        </p>
        {result.highlight.snippet && (
          <p className="mt-0.5 truncate text-xs text-loam/60">
            <HighlightedText html={result.highlight.snippet} />
          </p>
        )}
        <p className="mt-0.5 text-xs text-loam/50">
          {result.category}
          {result.badge && (
            <span className="ml-2 rounded-sm bg-marigold/20 px-1 py-px text-[10px] font-medium text-loam">
              {result.badge}
            </span>
          )}
        </p>
      </div>

      {/* Price */}
      <p className="shrink-0 font-mono text-sm text-loam">
        {result.price.toFixed(2)}
      </p>
    </li>
  );
}

// ── Search input + dropdown ───────────────────────────────────────────────────

interface SearchInputProps {
  inputId: string;
  listId: string;
  query: string;
  setQuery: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  loading: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef: RefObject<HTMLInputElement | null>; // <-- Fixed: Typed properly for strict mode
  className?: string;
}

function SearchInput({
  inputId,
  listId,
  query,
  setQuery,
  onKeyDown,
  onFocus,
  loading,
  placeholder = "Search products…",
  autoFocus,
  inputRef,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      {loading ? (
        <Loader2
          className="pointer-events-none absolute left-3 h-4 w-4 animate-spin text-canopy/40"
          aria-hidden
        />
      ) : (
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-canopy/40"
          strokeWidth={1.5}
          aria-hidden
        />
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={query.length >= MIN_QUERY_LEN}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-9 w-full rounded-card border border-canopy/20 bg-parchment pl-9 pr-3 text-sm text-loam focus:border-canopy focus:outline-none"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="absolute right-2 rounded p-0.5 text-loam/40 hover:text-loam"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Dropdown list ─────────────────────────────────────────────────────────────

function Dropdown({
  listId,
  results,
  total,
  query,
  focusedIndex,
  getOptionId,
  onHover,
  onSelect,
  onViewAll,
}: {
  listId: string;
  results: SearchResult[];
  total: number;
  query: string;
  focusedIndex: number;
  getOptionId: (i: number) => string;
  onHover: (i: number) => void;
  onSelect: (result: SearchResult) => void;
  onViewAll: () => void;
}) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-loam/60">
        No products found for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <>
      <ul id={listId} role="listbox" aria-label="Search suggestions">
        {results.map((result, i) => (
          <ResultRow
            key={result.id}
            id={getOptionId(i)}
            result={result}
            focused={focusedIndex === i}
            onMouseEnter={() => onHover(i)}
            onClick={() => onSelect(result)}
          />
        ))}
      </ul>

      {/* View all results footer */}
      <div className="border-t border-canopy/10">
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-between px-4 py-3 text-xs text-canopy/70 transition-colors hover:bg-sage/30 hover:text-canopy"
        >
          <span>
            View all{" "}
            <span className="font-medium text-canopy">{total}</span>{" "}
            result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

// ── Main SearchBar ─────────────────────────────────────────────────────────────

export function SearchBar() {
  const router = useRouter();
  const uid = useId();
  const inputId = `search-input-${uid}`;
  const listId = `search-list-${uid}`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  // Mobile: whether the full-screen overlay is open
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch suggestions ──────────────────────────────────────────────────────

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([]);
      setTotal(0);
      setDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: abortRef.current?.signal } // <-- Fixed: Optional chaining prevents strict TS errors
        );
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();
        setResults(data.results ?? []);
        setTotal(data.total ?? 0);
        setDropdownOpen(true);
        setFocusedIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // ── Click outside to close desktop dropdown ────────────────────────────────

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Lock body scroll when mobile overlay is open ───────────────────────────

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const navigateToProduct = useCallback(
    (result: SearchResult) => {
      router.push(`/products/${result.slug}`);
      setQuery("");
      setDropdownOpen(false);
      setMobileOpen(false);
    },
    [router]
  );

  const navigateToResults = useCallback(() => {
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [router, query]);

  function getOptionId(i: number) {
    return `${listId}-option-${i}`;
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!dropdownOpen && results.length > 0) {
          setDropdownOpen(true);
        }
        setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, -1));
        break;

      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && results[focusedIndex]) {
          navigateToProduct(results[focusedIndex]);
        } else {
          navigateToResults();
        }
        break;

      case "Escape":
        setDropdownOpen(false);
        setFocusedIndex(-1);
        if (!query) setMobileOpen(false);
        break;

      case "Tab":
        setDropdownOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }

  // ── Shared dropdown ────────────────────────────────────────────────────────

  const dropdownContent = dropdownOpen && query.trim().length >= MIN_QUERY_LEN && (
    <div
      className="overflow-hidden rounded-b-card border border-t-0 border-canopy/10 bg-parchment shadow-lg"
      role="presentation"
    >
      <Dropdown
        listId={listId}
        results={results}
        total={total}
        query={query.trim()}
        focusedIndex={focusedIndex}
        getOptionId={getOptionId}
        onHover={setFocusedIndex}
        onSelect={navigateToProduct}
        onViewAll={navigateToResults}
      />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Desktop (md+): inline search in header ─────────────────────── */}
      <div ref={containerRef} className="relative hidden md:block w-52 lg:w-64">
        <SearchInput
          inputId={inputId}
          listId={listId}
          query={query}
          setQuery={setQuery}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setDropdownOpen(true); }}
          loading={loading}
          inputRef={desktopInputRef}
        />
        {dropdownContent && (
          <div className="absolute left-0 right-0 top-full z-50 mt-px">
            {dropdownContent}
          </div>
        )}
      </div>

      {/* ── Mobile: icon triggers overlay ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        aria-label="Search products"
        className="rounded-card p-2 text-canopy hover:bg-sage md:hidden"
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-parchment"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          {/* Overlay header */}
          <div className="flex items-center gap-2 border-b border-canopy/10 px-4 py-3">
            <SearchInput
              inputId={`${inputId}-mobile`}
              listId={`${listId}-mobile`}
              query={query}
              setQuery={setQuery}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setDropdownOpen(true); }}
              loading={loading}
              autoFocus
              inputRef={mobileInputRef}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setQuery("");
                setDropdownOpen(false);
              }}
              aria-label="Close search"
              className="shrink-0 rounded-card p-2 text-loam hover:bg-sage"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile results */}
          <div className="flex-1 overflow-y-auto">
            {query.trim().length < MIN_QUERY_LEN ? (
              <p className="px-4 py-8 text-center text-sm text-loam/50">
                Type at least {MIN_QUERY_LEN} characters to search…
              </p>
            ) : (
              <Dropdown
                listId={`${listId}-mobile`}
                results={results}
                total={total}
                query={query.trim()}
                focusedIndex={focusedIndex}
                getOptionId={(i) => `${listId}-mobile-option-${i}`}
                onHover={setFocusedIndex}
                onSelect={navigateToProduct}
                onViewAll={navigateToResults}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}