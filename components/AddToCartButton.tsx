"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  quantity = 1,
  label = "Add to cart",
  className = "",
}: {
  product: Product;
  quantity?: number;
  label?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-card bg-canopy px-4 py-2 font-body text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={product.stock === 0}
    >
      {product.stock === 0 ? "Out of stock" : justAdded ? "Added ✓" : label}
    </button>
  );
}
