import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "@/components/admin/ProductFormClient";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "Add Product — Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h2 className="font-display text-lg text-canopy">Add a product</h2>
      <div className="mt-6">
        <ProductFormClient categories={categories} action={createProduct} submitLabel="Create product" />
      </div>
    </div>
  );
}
