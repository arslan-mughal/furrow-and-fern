"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";

export function UserSearchControls({
  currentParams,
}: {
  currentParams: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(currentParams.q ?? "");
  const [field, setField] = useState<"name" | "email">(
    currentParams.field === "email" ? "email" : "name"
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
      params.set("field", field);
    }
    // No explicit page param here — a new search always starts at page 1.
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleClear() {
    setQuery("");
    router.push(pathname);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="user-search-field" className="sr-only">
        Search by
      </label>
      <select
        id="user-search-field"
        value={field}
        onChange={(event) => setField(event.target.value === "email" ? "email" : "name")}
        className="rounded-card border border-canopy/20 bg-parchment px-2 py-2 text-sm text-loam focus:border-canopy"
      >
        <option value="name">Name</option>
        <option value="email">Email</option>
      </select>
      <label htmlFor="user-search-query" className="sr-only">
        Search users
      </label>
      <input
        id="user-search-query"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search by ${field}…`}
        className="w-56 rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
      />
      <button
        type="submit"
        className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
      >
        Search
      </button>
      {currentParams.q && (
        <button type="button" onClick={handleClear} className="text-xs text-clay hover:underline">
          Clear
        </button>
      )}
    </form>
  );
}
