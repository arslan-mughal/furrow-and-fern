import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content/slides", label: "Slides" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-canopy/10 pb-4">
        <div>
          <p className="stamp-badge text-clay">Admin</p>
          <h1 className="font-display text-2xl text-canopy">Furrow &amp; Fern Dashboard</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-loam hover:text-canopy">
              {link.label}
            </Link>
          ))}
          <Link href="/" className="text-loam hover:text-canopy">
            ← View store
          </Link>
        </nav>
      </div>
      <p className="mt-2 text-xs text-loam/50">Signed in as {admin.email}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
