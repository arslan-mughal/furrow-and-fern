"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type TouchEvent,
} from "react";
import type { ProductImage } from "@/lib/types";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  productName,
  onClose,
}: {
  images: ProductImage[];
  startIndex: number;
  productName: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Prevent body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  // Touch / swipe support
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    }
    touchStartX.current = null;
  }

  const image = images[index];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-loam/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length} — ${productName}`}
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute right-4 top-4 rounded-full bg-parchment/10 p-2 text-parchment hover:bg-parchment/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous image"
          className="absolute left-3 rounded-full bg-parchment/10 p-2 text-parchment hover:bg-parchment/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image — stops click from bubbling to backdrop */}
      <div
        className="relative mx-16 flex max-h-[90vh] max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image?.url}
          alt={`${productName} — image ${index + 1}`}
          className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next image"
          className="absolute right-3 rounded-full bg-parchment/10 p-2 text-parchment hover:bg-parchment/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-parchment/60">
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, images.findIndex((img) => img.isFeatured))
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch / swipe on the main gallery (not lightbox)
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || images.length < 2) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 40) {
      setActiveIndex((i) =>
        delta < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length
      );
    }
    touchStartX.current = null;
  }

  const activeImage = images[activeIndex];

  if (!activeImage) {
    return (
      <div className="seed-packet aspect-square overflow-hidden bg-sage/40">
        <div className="flex h-full items-center justify-center text-loam/30 text-sm">
          No image
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div
        className="group relative cursor-zoom-in"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Open full-screen view of ${productName}`}
        onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
      >
        <div className="seed-packet aspect-square overflow-hidden bg-sage/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={productName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        </div>

        {/* Zoom hint on hover */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-parchment/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4 text-canopy" strokeWidth={1.5} />
        </div>

        {/* Swipe hint on mobile — shown only with multiple images */}
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-4 bg-canopy" : "w-1.5 bg-canopy/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
          role="list"
          aria-label="Product image thumbnails"
        >
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              onClick={(e) => { e.stopPropagation(); setActiveIndex(index); }}
              className={`shrink-0 h-16 w-16 rounded-sm border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-marigold ${
                index === activeIndex
                  ? "border-canopy scale-105"
                  : "border-canopy/20 hover:border-canopy/60"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox portal */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          startIndex={activeIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
