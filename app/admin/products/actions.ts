"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/admin";

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function placeholderUrl(name: string) {
  return `https://placehold.co/600x600/1F3A2E/F2EDE1?text=${encodeURIComponent(name)}&font=raleway`;
}

interface ParsedImage {
  id?: string;
  url: string;
  sortOrder: number;
  isFeatured: boolean;
}

/**
 * Reads the hidden `imagesJson` field submitted by ProductFormClient,
 * validates it, and returns a clean array. At most one image may be
 * isFeatured — if none is marked, the first is promoted automatically.
 */
function parseImages(formData: FormData): ParsedImage[] {
  let images: ParsedImage[] = [];
  try {
    const raw = String(formData.get("imagesJson") ?? "[]");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      images = parsed
        .filter((img): img is ParsedImage => typeof img?.url === "string" && img.url.trim())
        .map((img, idx) => ({
          id: typeof img.id === "string" ? img.id : undefined,
          url: img.url.trim(),
          sortOrder: idx,
          isFeatured: Boolean(img.isFeatured),
        }));
    }
  } catch {
    images = [];
  }

  // Exactly one featured image — promote the first if none marked
  const hasFeatured = images.some((img) => img.isFeatured);
  if (!hasFeatured && images.length > 0) {
    images[0].isFeatured = true;
  }
  // Clear duplicate featured flags
  let foundFeatured = false;
  for (const img of images) {
    if (img.isFeatured) {
      if (foundFeatured) img.isFeatured = false;
      else foundFeatured = true;
    }
  }

  return images;
}

function readProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugify(name);
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" as const : "DRAFT" as const;
  const seoTitle = String(formData.get("seoTitle") ?? "").trim() || null;
  const seoDescription = String(formData.get("seoDescription") ?? "").trim() || null;
  const details = String(formData.get("details") ?? "")
    .split("\n").map((line) => line.trim()).filter(Boolean);

  if (!name) throw new Error("Name is required.");
  if (!categoryId) throw new Error("Category is required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a positive number.");
  if (!Number.isFinite(stock) || stock < 0) throw new Error("Stock must be a non-negative whole number.");
  if (!description) throw new Error("Description is required.");

  return { name, slug, sku, categoryId, price, stock, description, badge, status, seoTitle, seoDescription, details };
}

async function syncImages(productId: string, newImages: ParsedImage[]) {
  if (newImages.length === 0) return;

  const existingImages = await prisma.productImage.findMany({ where: { productId } });
  const existingIds = new Set(existingImages.map((img) => img.id));
  const incomingIds = new Set(newImages.filter((img) => img.id).map((img) => img.id as string));

  // Delete images that were removed
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await prisma.productImage.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Upsert each image
  for (const img of newImages) {
    if (img.id && existingIds.has(img.id)) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: img.url, sortOrder: img.sortOrder, isFeatured: img.isFeatured },
      });
    } else {
      await prisma.productImage.create({
        data: { productId, url: img.url, sortOrder: img.sortOrder, isFeatured: img.isFeatured },
      });
    }
  }
}

function revalidateProductPaths(productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  if (productId) revalidatePath(`/admin/products/${productId}`);
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  await requireAdminAction();
  const fields = readProductFields(formData);
  const images = parseImages(formData);

  // Guarantee slug uniqueness if there's already one with the same slug
  let slug = fields.slug;
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await prisma.product.create({
    data: { ...fields, slug },
  });

  // If no images were added, create a placeholder automatically
  const imagesToCreate = images.length > 0
    ? images
    : [{ url: placeholderUrl(fields.name), sortOrder: 0, isFeatured: true }];

  await prisma.productImage.createMany({
    data: imagesToCreate.map((img) => ({ ...img, productId: product.id, id: undefined })),
  });

  revalidateProductPaths();
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdminAction();
  const fields = readProductFields(formData);
  const images = parseImages(formData);

  // Check slug uniqueness — allow keeping own slug
  const slugConflict = await prisma.product.findFirst({
    where: { slug: fields.slug, id: { not: productId } },
    select: { id: true },
  });
  if (slugConflict) throw new Error(`The slug "${fields.slug}" is already used by another product.`);

  await prisma.product.update({ where: { id: productId }, data: fields });
  await syncImages(productId, images);

  revalidateProductPaths(productId);
  if (fields.slug) revalidatePath(`/products/${fields.slug}`);
  redirect("/admin/products");
}

/** Soft delete — sets deletedAt, doesn't destroy the row. */
export async function softDeleteProduct(productId: string) {
  await requireAdminAction();
  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), status: "DRAFT" },
  });
  revalidateProductPaths(productId);
}

/** Restore a soft-deleted product back to DRAFT. */
export async function restoreProduct(productId: string) {
  await requireAdminAction();
  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: null, status: "DRAFT" },
  });
  revalidateProductPaths(productId);
}

/** Hard delete — permanent, used only from the "Trash" view. */
export async function hardDeleteProduct(productId: string) {
  await requireAdminAction();
  await prisma.product.delete({ where: { id: productId } });
  revalidateProductPaths();
}

/** Duplicate — copies all fields and images, adds "(Copy)" suffix, resets to DRAFT. */
export async function duplicateProduct(productId: string) {
  await requireAdminAction();

  const source = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) throw new Error("Product not found.");

  const baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const copy = await prisma.product.create({
    data: {
      slug,
      name: `${source.name} (Copy)`,
      sku: source.sku ? `${source.sku}-COPY` : null,
      price: source.price,
      description: source.description,
      details: source.details,
      stock: 0,
      badge: source.badge,
      status: "DRAFT",
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      categoryId: source.categoryId,
    },
  });

  if (source.images.length > 0) {
    await prisma.productImage.createMany({
      data: source.images.map((img) => ({
        productId: copy.id,
        url: img.url,
        sortOrder: img.sortOrder,
        isFeatured: img.isFeatured,
      })),
    });
  }

  revalidateProductPaths();
  redirect(`/admin/products/${copy.id}`);
}

// ── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkProductAction(formData: FormData) {
  await requireAdminAction();

  const action = String(formData.get("bulkAction") ?? "");
  const ids = formData.getAll("selectedIds").map(String).filter(Boolean);

  if (ids.length === 0) return;

  switch (action) {
    case "publish":
      await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { status: "PUBLISHED" },
      });
      break;
    case "draft":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAFT" },
      });
      break;
    case "archive":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date(), status: "DRAFT" },
      });
      break;
    case "restore":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null },
      });
      break;
    case "delete":
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
      break;
    default:
      throw new Error("Unknown bulk action.");
  }

  revalidateProductPaths();
}
