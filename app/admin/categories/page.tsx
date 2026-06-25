import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "../actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Admin · Categories — Furrow & Fern",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="font-display text-lg text-canopy">Categories ({categories.length})</h2>

      <ul className="mt-6 divide-y divide-canopy/10 border-y border-canopy/10">
        {categories.map((category) => {
          const boundDelete = deleteCategory.bind(null, category.id);
          const productCount = category._count.products;
          return (
            <li key={category.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-canopy">{category.name}</p>
                <p className="text-xs text-loam/50">
                  {productCount} product{productCount === 1 ? "" : "s"}
                </p>
              </div>
              <form action={boundDelete}>
                <ConfirmSubmitButton
                  confirmMessage={`Delete "${category.name}"?`}
                  disabled={productCount > 0}
                  title={productCount > 0 ? "Move or delete its products first" : undefined}
                  className="text-xs text-clay hover:underline"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </li>
          );
        })}
        {categories.length === 0 && (
          <li className="py-6 text-center text-sm text-loam/60">No categories yet.</li>
        )}
      </ul>

      <form action={createCategory} className="mt-8 flex max-w-sm gap-3">
        <label htmlFor="category-name" className="sr-only">
          New category name
        </label>
        <input
          id="category-name"
          name="name"
          required
          placeholder="New category name"
          className="flex-1 rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
        <button
          type="submit"
          className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
        >
          Add
        </button>
      </form>
      <p className="mt-2 text-xs text-loam/50">
        Categories with products can&apos;t be deleted — move or delete their products first.
      </p>
    </div>
  );
}
