
import type { Category } from "@prisma/client";

interface ProductFormValues {
  name: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  details: string[];
  badge: string | null;
  categoryId: string;
}

export function ProductForm({
  categories,
  product,
  action,
  submitLabel,
}: {
  categories: Category[];
  product?: ProductFormValues;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="text-xs text-loam/70">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="text-xs text-loam/70">
            Price (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <div>
          <label htmlFor="stock" className="text-xs text-loam/70">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock}
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
      </div>

      <div>
        <label htmlFor="categoryId" className="text-xs text-loam/70">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? ""}
          className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-clay">
            No categories yet — create one on the Categories page first.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="badge" className="text-xs text-loam/70">
          Badge (optional)
        </label>
        <select
          id="badge"
          name="badge"
          defaultValue={product?.badge ?? ""}
          className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
        >
          <option value="">None</option>
          <option value="New">New</option>
          <option value="Popular">Popular</option>
          <option value="Sale">Sale</option>
        </select>
      </div>

      <div>
        <label htmlFor="image" className="text-xs text-loam/70">
          Image URL
        </label>
        <input
          id="image"
          name="image"
          type="url"
          defaultValue={product?.image}
          placeholder="https://…"
          className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
        <p className="mt-1 text-xs text-loam/50">Leave blank to auto-generate a placeholder graphic.</p>
      </div>

      <div>
        <label htmlFor="description" className="text-xs text-loam/70">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          defaultValue={product?.description}
          className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
      </div>

      <div>
        <label htmlFor="details" className="text-xs text-loam/70">
          Details (one per line)
        </label>
        <textarea
          id="details"
          name="details"
          rows={3}
          defaultValue={product?.details.join("\n")}
          className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
      </div>

      <button
        type="submit"
        className="rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam"
      >
        {submitLabel}
      </button>
    </form>
  );
}
