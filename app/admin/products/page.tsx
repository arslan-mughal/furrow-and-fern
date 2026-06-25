import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  softDeleteProduct, restoreProduct, hardDeleteProduct,
  duplicateProduct, bulkProductAction,
} from "./actions";
import { SelectAllCheckbox } from "@/components/admin/SelectAllCheckbox";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Admin · Products — Furrow & Fern",
};

type StatusFilter = "all" | "published" | "draft" | "trash";

interface RawSearch {
  q?: string;
  status?: string;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearch>;
}) {
  const resolved = await searchParams;
  const q = resolved.q?.trim() || "";
  const statusFilter: StatusFilter = (["all", "published", "draft", "trash"].includes(
    resolved.status ?? ""
  )
    ? resolved.status
    : "all") as StatusFilter;

  const products = await prisma.product.findMany({
    where: {
      ...(statusFilter === "trash"
        ? { deletedAt: { not: null } }
        : {
            deletedAt: null,
            ...(statusFilter === "published" ? { status: "PUBLISHED" } : {}),
            ...(statusFilter === "draft" ? { status: "DRAFT" } : {}),
          }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      images: { where: { isFeatured: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
    { key: "trash", label: "Trash" },
  ];

  function tabHref(key: StatusFilter) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("status", key);
    if (q) params.set("q", q);
    return `/admin/products${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-lg text-canopy">Products</h2>
        <Link
          href="/admin/products/new"
          className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
        >
          + Add product
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-canopy/10">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`px-4 py-2 text-sm transition-colors ${
              statusFilter === key
                ? "border-b-2 border-canopy text-canopy font-medium"
                : "text-loam/60 hover:text-canopy"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/products" className="mt-4 flex gap-2">
        {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by name or SKU…"
          className="w-64 rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
        />
        <button type="submit" className="rounded-card bg-sage px-4 py-2 text-sm text-canopy hover:bg-canopy hover:text-parchment">
          Search
        </button>
        {q && (
          <Link href={tabHref(statusFilter)} className="px-3 py-2 text-xs text-clay hover:underline self-center">
            Clear
          </Link>
        )}
      </form>

      {/* Bulk action form wraps the whole table */}
      <form action={bulkProductAction} className="mt-4">
        <div className="flex items-center gap-3 mb-3">
          <select
            name="bulkAction"
            defaultValue=""
            className="rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
          >
            <option value="" disabled>Bulk action…</option>
            {statusFilter !== "trash" && <option value="publish">Publish</option>}
            {statusFilter !== "trash" && <option value="draft">Set to draft</option>}
            {statusFilter !== "trash" && <option value="archive">Move to trash</option>}
            {statusFilter === "trash" && <option value="restore">Restore</option>}
            <option value="delete">Permanently delete</option>
          </select>
          <button
            type="submit"
            className="rounded-card border border-canopy/20 px-3 py-2 text-sm text-canopy hover:border-canopy"
          >
            Apply
          </button>
          <span className="text-xs text-loam/50">{products.length} product{products.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-canopy/20 text-xs uppercase tracking-wide text-loam/60">
                <th className="py-2 pr-3">
                  <SelectAllCheckbox />
                </th>
                <th className="py-2 pr-3 w-12">Image</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Stock</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canopy/10">
              {products.map((product) => {
                const featuredImg = product.images[0];
                const boundSoftDelete = softDeleteProduct.bind(null, product.id);
                const boundRestore = restoreProduct.bind(null, product.id);
                const boundHardDelete = hardDeleteProduct.bind(null, product.id);
                const boundDuplicate = duplicateProduct.bind(null, product.id);

                return (
                  <tr key={product.id} className="group">
                    <td className="py-3 pr-3">
                      <input type="checkbox" name="selectedIds" value={product.id} className="h-4 w-4" aria-label={`Select ${product.name}`} />
                    </td>
                    <td className="py-3 pr-3">
                      {featuredImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={featuredImg.url} alt="" className="h-10 w-10 rounded-sm object-cover border border-canopy/10" />
                      ) : (
                        <div className="h-10 w-10 rounded-sm bg-sage/40 border border-canopy/10" />
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/products/${product.id}`} className="text-canopy hover:underline font-medium">
                        {product.name}
                      </Link>
                      {product.deletedAt && <span className="ml-2 stamp-badge text-clay">Deleted</span>}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-loam/60">{product.sku || "—"}</td>
                    <td className="py-3 pr-4 text-loam/70">{product.category.name}</td>
                    <td className="py-3 pr-4 font-mono">{product.price.toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      {product.stock === 0 ? (
                        <span className="text-clay">0</span>
                      ) : product.stock}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`stamp-badge rounded-full px-2 py-1 ${product.status === "PUBLISHED" ? "bg-canopy/10 text-canopy" : "bg-sage text-loam/60"}`}>
                        {product.status === "PUBLISHED" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        {product.deletedAt ? (
                          <>
                            <form action={boundRestore} className="inline">
                              <button type="submit" className="text-canopy hover:underline">Restore</button>
                            </form>
                            <form action={boundHardDelete} className="inline">
                              <ConfirmSubmitButton confirmMessage={`Permanently delete "${product.name}"? This cannot be undone.`} className="text-clay hover:underline">
                                Delete permanently
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        ) : (
                          <>
                            <form action={boundDuplicate} className="inline">
                              <button type="submit" className="text-loam/60 hover:text-canopy hover:underline">Copy</button>
                            </form>
                            <Link href={`/admin/products/${product.id}`} className="text-canopy hover:underline">Edit</Link>
                            <form action={boundSoftDelete} className="inline">
                              <ConfirmSubmitButton confirmMessage={`Move "${product.name}" to trash?`} className="text-clay hover:underline">
                                Trash
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="py-10 text-center text-sm text-loam/60">No products found.</p>
          )}
        </div>
      </form>
    </div>
  );
}
