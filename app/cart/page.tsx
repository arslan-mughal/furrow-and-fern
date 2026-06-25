import type { Metadata } from "next";
import { CartContents } from "@/components/CartContents";

export const metadata: Metadata = {
  title: "Your Cart — Furrow & Fern",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-canopy">Your Cart</h1>
      <div className="mt-8">
        <CartContents />
      </div>
    </div>
  );
}
