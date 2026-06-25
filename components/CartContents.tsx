"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function CartContents() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl text-canopy">Your cart is empty.</p>
        <p className="mt-2 text-sm text-loam/70">
          Nothing here yet — go find something worth growing.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-3">
      <div className="md:col-span-2">
        <ul className="divide-y divide-canopy/10">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-sm border border-canopy/10 object-cover"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${item.slug}`} className="font-display text-base text-canopy hover:underline">
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.productId)}
                    className="text-loam/50 hover:text-clay"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-card border border-canopy/30">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-canopy hover:bg-sage"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-canopy hover:bg-sage"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-mono text-sm text-loam">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="seed-packet h-fit p-6">
        <h2 className="font-display text-lg text-canopy">Order summary</h2>
        <div className="mt-4 flex justify-between text-sm text-loam/80">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-xs text-loam/50">Shipping and tax calculated at checkout.</p>
        <Link
          href="/checkout"
          className="mt-5 block rounded-card bg-marigold px-4 py-2.5 text-center text-sm font-semibold text-loam hover:bg-canopy hover:text-parchment"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
