"use client";

import Link from "next/link";
import { useState } from "react";
import { Leaf, ShoppingCart, User, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
// If next-auth is not installed or types are missing, avoid importing useSession here
import { SearchBar } from "./SearchBar";

const navLinks = [
  { href: "/products", label: "All Products" },
  { href: "/products?category=Plants", label: "Plants" },
  { href: "/products?category=Seeds", label: "Seeds" },
  { href: "/products?category=Tools", label: "Tools" },
];

export function Header() {
  const { itemCount } = useCart();
  // Fallback when next-auth/react is not available in the environment
  // typed as any to avoid TS errors when checking session.user
  const session: any = null;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-canopy/10 bg-parchment/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-canopy" strokeWidth={1.5} />
          <span className="font-display text-xl text-canopy">Furrow &amp; Fern</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-loam transition-colors hover:text-canopy"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchBar />
          <Link
            href={session?.user ? "/account" : "/login"}
            aria-label={session?.user ? "My account" : "Sign in"}
            className="rounded-card p-2 text-canopy hover:bg-sage"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/cart"
            aria-label="View cart"
            className="relative rounded-card p-2 text-canopy hover:bg-sage"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-marigold font-mono text-[10px] text-loam">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-card p-2 text-canopy hover:bg-sage md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-canopy/10 px-6 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-2 text-sm text-loam hover:text-canopy"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
