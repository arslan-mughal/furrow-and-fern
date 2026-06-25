"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/lib/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded-card border border-canopy/30">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="p-2 text-canopy hover:bg-sage"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-mono text-sm">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          className="p-2 text-canopy hover:bg-sage"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <AddToCartButton product={product} quantity={quantity} className="flex-1" />
    </div>
  );
}
