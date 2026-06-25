// Phase 4: categories are admin-managed (see Category model in
// prisma/schema.prisma), so this can no longer be a fixed union of literals
// — an admin can add a new one at any time.
export type Category = string;

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isFeatured: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  price: number;
  category: Category;
  description: string;
  details: string[];
  /** Primary display image — derived from the featured/first ProductImage. */
  image: string;
  images: ProductImage[];
  stock: number;
  badge?: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}
