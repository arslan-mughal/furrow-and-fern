import { Flower2, Sprout, Wrench, Shovel } from "lucide-react";
import { CategoryTile } from "./CategoryTile";

export function Hero() {
  return (
    <section className="border-b border-canopy/10 bg-parchment">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="stamp-badge text-clay">Furrow &amp; Fern · Est. for the patient gardener</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-canopy sm:text-5xl">
            Grow something worth tending.
          </h1>
          <p className="mt-5 max-w-md text-base text-loam/80">
            Plants, seeds, and tools for gardens that reward patience — picked
            by people who actually get their hands dirty.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/products"
              className="inline-flex items-center rounded-card bg-marigold px-6 py-3 font-body text-sm font-semibold text-loam transition-colors hover:bg-canopy hover:text-parchment"
            >
              Shop the collection
            </a>
            <span className="stamp-badge text-canopy/60">Free shipping over $50</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CategoryTile name="Plants" icon={Sprout} rotate="-rotate-1" />
          <CategoryTile name="Seeds" icon={Flower2} rotate="rotate-1" />
          <CategoryTile name="Tools" icon={Wrench} rotate="rotate-1" />
          <CategoryTile name="Pots & Planters" icon={Shovel} rotate="-rotate-1" />
        </div>
      </div>
    </section>
  );
}
