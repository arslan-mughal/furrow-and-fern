"use client";

import { useState, useRef, useTransition, type DragEvent } from "react";
import type { Category } from "@prisma/client";

interface ImageEntry {
  /** undefined for newly added images not yet in the DB */
  id?: string;
  url: string;
  isFeatured: boolean;
}

interface ProductFormValues {
  name?: string;
  sku?: string | null;
  price?: number;
  stock?: number;
  description?: string;
  details?: string[];
  badge?: string | null;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string;
  slug?: string;
  images?: ImageEntry[];
}

export function ProductFormClient({
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Image state ───────────────────────────────────────────────────────────
  const [images, setImages] = useState<ImageEntry[]>(product?.images ?? []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const dragIndex = useRef<number | null>(null);

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    setImages((prev) => [
      ...prev,
      { url, isFeatured: prev.length === 0 },
    ]);
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // If we removed the featured image, promote the first remaining
      if (prev[index]?.isFeatured && next.length > 0) {
        next[0].isFeatured = true;
      }
      return next;
    });
  }

  function setFeatured(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isFeatured: i === index }))
    );
  }

  // HTML5 drag-and-drop reorder
  function onDragStart(_event: DragEvent, index: number) {
    dragIndex.current = index;
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(_event: DragEvent, targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    dragIndex.current = null;
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    // Inject the images array as JSON
    formData.set(
      "imagesJson",
      JSON.stringify(
        images.map((img, idx) => ({ ...img, sortOrder: idx }))
      )
    );

    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const inputClass =
    "mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <p className="rounded-card bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
      )}

      {/* ── Core info ─────────────────────────────────────────────────── */}
      <section className="seed-packet p-5">
        <h3 className="font-display text-sm text-canopy">Product info</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="name" className="text-xs text-loam/70">Name *</label>
            <input id="name" name="name" required defaultValue={product?.name} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sku" className="text-xs text-loam/70">SKU</label>
              <input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="e.g. PLT-001" className={inputClass} />
            </div>
            <div>
              <label htmlFor="slug" className="text-xs text-loam/70">URL slug</label>
              <input id="slug" name="slug" defaultValue={product?.slug} placeholder="auto-generated from name" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className="text-xs text-loam/70">Price *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} className={inputClass} />
            </div>
            <div>
              <label htmlFor="stock" className="text-xs text-loam/70">Stock *</label>
              <input id="stock" name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="categoryId" className="text-xs text-loam/70">Category *</label>
            <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className={`${inputClass} bg-parchment`}>
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="badge" className="text-xs text-loam/70">Badge</label>
              <select id="badge" name="badge" defaultValue={product?.badge ?? ""} className={`${inputClass} bg-parchment`}>
                <option value="">None</option>
                <option value="New">New</option>
                <option value="Popular">Popular</option>
                <option value="Sale">Sale</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="text-xs text-loam/70">Status</label>
              <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} className={`${inputClass} bg-parchment`}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Description ───────────────────────────────────────────────── */}
      <section className="seed-packet p-5">
        <h3 className="font-display text-sm text-canopy">Description</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="description" className="text-xs text-loam/70">Description *</label>
            <textarea id="description" name="description" required rows={4} defaultValue={product?.description} className={inputClass} />
          </div>
          <div>
            <label htmlFor="details" className="text-xs text-loam/70">Details (one per line)</label>
            <textarea id="details" name="details" rows={4} defaultValue={product?.details?.join("\n")} className={inputClass} />
          </div>
        </div>
      </section>

      {/* ── Images ────────────────────────────────────────────────────── */}
      <section className="seed-packet p-5">
        <h3 className="font-display text-sm text-canopy">Images</h3>
        <p className="mt-1 text-xs text-loam/50">
          Drag to reorder · click ★ to set featured image · ✕ to remove
        </p>

        {images.length > 0 && (
          <ul className="mt-3 space-y-2">
            {images.map((img, index) => (
              <li
                key={img.id ?? img.url}
                draggable
                onDragStart={(event) => onDragStart(event, index)}
                onDragOver={onDragOver}
                onDrop={(event) => onDrop(event, index)}
                className="flex items-center gap-3 rounded-card border border-canopy/10 bg-sage/20 px-3 py-2 cursor-grab active:cursor-grabbing"
              >
                {/* Drag handle */}
                <span className="text-loam/30 select-none">⠿</span>

                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-sm object-cover border border-canopy/10"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/1F3A2E/F2EDE1?text=?"; }}
                />

                {/* URL (truncated) */}
                <span className="flex-1 truncate text-xs text-loam/70" title={img.url}>
                  {img.url}
                </span>

                {/* Featured star */}
                <button
                  type="button"
                  onClick={() => setFeatured(index)}
                  title={img.isFeatured ? "Featured image" : "Set as featured"}
                  className={`text-base ${img.isFeatured ? "text-marigold" : "text-loam/20 hover:text-marigold"}`}
                >
                  ★
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Remove image"
                  className="text-loam/30 hover:text-clay"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://… image URL"
            className="flex-1 rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-card bg-sage px-4 py-2 text-sm text-canopy hover:bg-canopy hover:text-parchment"
          >
            Add
          </button>
        </div>
        {images.length === 0 && (
          <p className="mt-2 text-xs text-loam/50">No images added — a placeholder will be generated automatically.</p>
        )}

        {/* Hidden field carrying the serialized image list */}
        <input type="hidden" name="imagesJson" value="[]" readOnly />
      </section>

      {/* ── SEO ───────────────────────────────────────────────────────── */}
      <section className="seed-packet p-5">
        <h3 className="font-display text-sm text-canopy">SEO</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="seoTitle" className="text-xs text-loam/70">SEO title</label>
            <input id="seoTitle" name="seoTitle" defaultValue={product?.seoTitle ?? ""} maxLength={70} className={inputClass} />
            <p className="mt-0.5 text-xs text-loam/40">Defaults to product name if left blank. Keep under 60 characters.</p>
          </div>
          <div>
            <label htmlFor="seoDescription" className="text-xs text-loam/70">SEO description</label>
            <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={product?.seoDescription ?? ""} maxLength={160} className={inputClass} />
            <p className="mt-0.5 text-xs text-loam/40">Keep under 155 characters.</p>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-card bg-canopy px-6 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
