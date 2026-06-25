import Link from "next/link";
import { getCategories } from "@/lib/products";

export async function CategoryStrip() {
  const categories = await getCategories();

  return (
    <section className="border-b border-canopy/10 bg-sage/40">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="font-display text-xl text-canopy">Browse by category</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="stamp-badge shrink-0 rounded-full border border-canopy/30 bg-parchment px-4 py-2 text-canopy transition-colors hover:border-canopy hover:bg-canopy hover:text-parchment"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
