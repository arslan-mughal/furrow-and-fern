import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "@/components/admin/ProductFormClient";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { updateProduct, softDeleteProduct, hardDeleteProduct, duplicateProduct } from "../actions";

export const metadata: Metadata = { title: "Edit Product — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundSoftDelete = softDeleteProduct.bind(null, product.id);
  const boundHardDelete = hardDeleteProduct.bind(null, product.id);
  const boundDuplicate = duplicateProduct.bind(null, product.id);

  const productValues = {
    name: product.name,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    description: product.description,
    details: product.details,
    badge: product.badge,
    status: product.status,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    categoryId: product.categoryId,
    slug: product.slug,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      isFeatured: img.isFeatured,
    })),
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-xs text-clay hover:underline">← All products</Link>
          <h2 className="mt-1 font-display text-lg text-canopy">{product.name}</h2>
          {product.deletedAt && (
            <p className="text-xs text-clay mt-1">This product is in the trash.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {product.slug && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="rounded-card border border-canopy/20 px-3 py-1.5 text-xs text-loam hover:border-canopy"
            >
              View on site ↗
            </Link>
          )}
          <form action={boundDuplicate} className="inline">
            <button type="submit" className="rounded-card border border-canopy/20 px-3 py-1.5 text-xs text-loam hover:border-canopy">
              Duplicate
            </button>
          </form>
          {product.deletedAt ? (
            <form action={hardDeleteProduct.bind(null, product.id)} className="inline">
              <ConfirmSubmitButton
                confirmMessage={`Permanently delete "${product.name}"?`}
                className="rounded-card border border-clay px-3 py-1.5 text-xs text-clay hover:bg-clay hover:text-parchment"
              >
                Delete permanently
              </ConfirmSubmitButton>
            </form>
          ) : (
            <form action={boundSoftDelete} className="inline">
              <ConfirmSubmitButton
                confirmMessage={`Move "${product.name}" to trash?`}
                className="rounded-card border border-clay px-3 py-1.5 text-xs text-clay hover:bg-clay hover:text-parchment"
              >
                Move to trash
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      <ProductFormClient
        categories={categories}
        product={productValues}
        action={boundUpdate}
        submitLabel="Save changes"
      />
    </div>
  );
}
