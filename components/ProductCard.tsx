import Link from "next/link";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";

const badgeStyles: Record<string, string> = {
  New: "bg-canopy text-parchment",
  Popular: "bg-marigold text-loam",
  Sale: "bg-clay text-parchment",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="seed-packet group flex flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-sage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.badge && (
          <span
            className={`stamp-badge absolute left-3 top-3 rounded-sm px-2 py-1 ${badgeStyles[product.badge]}`}
          >
            {product.badge}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="stamp-badge text-canopy/70">{product.category}</p>
        <Link href={`/products/${product.slug}`} className="font-display text-lg leading-snug text-canopy hover:underline">
          {product.name}
        </Link>
        <p className="font-mono text-base text-loam">${product.price.toFixed(2)}</p>
        <div className="mt-auto pt-2">
          <AddToCartButton product={product} label="Quick add" className="w-full" />
        </div>
      </div>
    </div>
  );
}
