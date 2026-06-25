import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-canopy/10 bg-parchment">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-canopy">Furrow &amp; Fern</p>
            <p className="mt-2 max-w-xs text-sm text-loam/70">
              Plants, seeds, and tools for gardens that reward patience.
            </p>
          </div>
          <div>
            <p className="stamp-badge text-canopy/60">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/products" className="text-loam hover:text-canopy">All Products</Link></li>
              <li><Link href="/products?category=Plants" className="text-loam hover:text-canopy">Plants</Link></li>
              <li><Link href="/products?category=Tools" className="text-loam hover:text-canopy">Tools</Link></li>
            </ul>
          </div>
          <div>
            <p className="stamp-badge text-canopy/60">Help</p>
            <ul className="mt-3 space-y-2 text-sm text-loam/70">
              <li>Shipping &amp; returns</li>
              <li>Contact support</li>
              <li>Order tracking</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-loam/50">
          © {new Date().getFullYear()} Furrow &amp; Fern. Built as a Phase 1 storefront preview.
        </p>
      </div>
    </footer>
  );
}
