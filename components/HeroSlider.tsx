"use client";

import {
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SlideData } from "@/lib/slides";

const AUTOPLAY_MS = 5000;

// ── Static fallback (shown when no slides exist in DB) ────────────────────────
function StaticHero() {
  return (
    <section
      className="flex min-h-[480px] items-center md:min-h-[580px]"
      style={{ background: "#1F3A2E" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="stamp-badge text-parchment/60">
          Furrow &amp; Fern · Est. for the patient gardener
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] text-parchment sm:text-5xl md:text-6xl">
          Grow something worth tending.
        </h1>
        <p className="mt-5 max-w-lg text-base text-parchment/70">
          Plants, seeds, and tools for gardens that reward patience — picked by
          people who actually get their hands dirty.
        </p>
        <div className="mt-8">
          <a
            href="/products"
            className="inline-flex items-center rounded-card bg-marigold px-6 py-3 font-body text-sm font-semibold text-loam transition-colors hover:bg-parchment"
          >
            Shop the collection
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Text overlay — animated with Framer Motion ────────────────────────────────
const textVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

function SlideText({ slide }: { slide: SlideData }) {
  return (
    <motion.div
      variants={textVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-xl"
    >
      <h2 className="font-display text-3xl leading-[1.1] text-parchment sm:text-4xl md:text-5xl lg:text-6xl">
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="mt-4 text-base text-parchment/75 sm:text-lg">
          {slide.subtitle}
        </p>
      )}
      {slide.ctaLabel && slide.ctaUrl && (
        <div className="mt-7">
          <a
            href={slide.ctaUrl}
            className="inline-flex items-center rounded-card bg-marigold px-6 py-3 font-body text-sm font-semibold text-loam transition-colors hover:bg-parchment"
          >
            {slide.ctaLabel}
          </a>
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HeroSlider({ slides }: { slides: SlideData[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollPrev = useCallback(
    (e: MouseEvent) => { e.stopPropagation(); emblaApi?.scrollPrev(); },
    [emblaApi]
  );
  const scrollNext = useCallback(
    (e: MouseEvent) => { e.stopPropagation(); emblaApi?.scrollNext(); },
    [emblaApi]
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  // Sync selected index from Embla
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Autoplay — pauses on hover/focus and when single slide
  useEffect(() => {
    if (!emblaApi || paused || slides.length <= 1) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [emblaApi, paused, slides.length]);

  if (slides.length === 0) return <StaticHero />;

  const activeSlide = slides[selectedIndex] ?? slides[0];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Hero banner"
      aria-roledescription="carousel"
    >
      {/* ── Embla viewport (background images slide) ── */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${slides.length}`}
            >
              {/* Background */}
              <div
                className="min-h-[480px] w-full md:min-h-[600px]"
                style={{ backgroundColor: slide.bgColor }}
              >
                {slide.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    style={{
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                )}
                {/* Dark gradient overlay for text legibility */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Text overlay (Framer Motion AnimatePresence) ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
          <AnimatePresence mode="wait" initial={false}>
            <SlideText key={activeSlide.id} slide={activeSlide} />
          </AnimatePresence>
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-parchment/15 p-2 text-parchment backdrop-blur-sm transition-colors hover:bg-parchment/30 focus-visible:ring-2 focus-visible:ring-marigold md:left-5 md:p-3"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-parchment/15 p-2 text-parchment backdrop-blur-sm transition-colors hover:bg-parchment/30 focus-visible:ring-2 focus-visible:ring-marigold md:right-5 md:p-3"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <div
          role="tablist"
          aria-label="Slides"
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === selectedIndex}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-marigold ${
                i === selectedIndex
                  ? "w-6 bg-marigold"
                  : "w-2 bg-parchment/50 hover:bg-parchment/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar (autoplay indicator) ── */}
      {slides.length > 1 && !paused && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-marigold/60"
          style={{
            animation: `progress ${AUTOPLAY_MS}ms linear infinite`,
          }}
        />
      )}

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
