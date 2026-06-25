import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductCard } from "@/components/ProductCard";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Furrow & Fern" };
  return {
    title: product.seoTitle || `${product.name} — Furrow & Fern`,
    description: product.seoDescription || product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductImageGallery images={product.images} productName={product.name} />

        <div>
          <p className="stamp-badge text-clay">{product.category}</p>
          <h1 className="mt-2 font-display text-3xl text-canopy">{product.name}</h1>
          {product.sku && (
            <p className="mt-1 font-mono text-xs text-loam/40">SKU: {product.sku}</p>
          )}
          <p className="mt-3 font-mono text-2xl text-loam">
            {product.price.toFixed(2)}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-loam/80">
            {product.description}
          </p>

          <ul className="mt-5 space-y-1 text-sm text-loam/70">
            {product.details.map((detail) => (
              <li key={detail}>• {detail}</li>
            ))}
          </ul>

          <p className="mt-5 text-xs text-loam/60">
            {product.stock > 0
              ? `${product.stock} in stock`
              : "Currently out of stock"}
          </p>

          <div className="mt-6">
            <ProductDetailActions product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl text-canopy">
            You might also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
