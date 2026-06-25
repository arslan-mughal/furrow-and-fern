"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

interface ProductSliderProps {
  products: Product[];
  title: string;
  viewAllHref?: string;
  badge?: string;
}

export function ProductSlider({
  products,
  title,
  viewAllHref,
  badge,
}: ProductSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Keep button states in sync
  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    update();
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header row */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-canopy">{title}</h2>
            {badge && (
              <span className="stamp-badge rounded-full bg-marigold px-2 py-1 text-loam">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {viewAllHref && (
              <a
                href={viewAllHref}
                className="stamp-badge text-clay hover:underline"
              >
                View all →
              </a>
            )}
            {/* Desktop arrows */}
            <div className="hidden gap-1 sm:flex">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                aria-label="Previous products"
                className="rounded-full border border-canopy/20 p-1.5 text-canopy transition-colors hover:border-canopy disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollNext}
                aria-label="Next products"
                className="rounded-full border border-canopy/20 p-1.5 text-canopy transition-colors hover:border-canopy disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="mt-6 overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="min-w-0 flex-[0_0_75%] pl-4 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile arrows below the carousel */}
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous products"
            className="rounded-full border border-canopy/20 p-2 text-canopy transition-colors hover:border-canopy disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next products"
            className="rounded-full border border-canopy/20 p-2 text-canopy transition-colors hover:border-canopy disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
