import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteSlide, toggleSlideActive } from "./actions";

export const metadata: Metadata = {
  title: "Admin · Hero Slides — Furrow & Fern",
};

export default async function AdminSlidesPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-canopy">Hero Slides</h2>
          <p className="mt-1 text-xs text-loam/50">
            Slides are shown on the homepage in order. Inactive slides are hidden.
          </p>
        </div>
        <Link
          href="/admin/content/slides/new"
          className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
        >
          + Add slide
        </Link>
      </div>

      {slides.length === 0 ? (
        <div className="mt-10 py-12 text-center text-sm text-loam/60">
          No slides yet — the homepage will show the default static hero.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {slides.map((slide) => {
            const boundDelete = deleteSlide.bind(null, slide.id);
            const boundToggle = toggleSlideActive.bind(null, slide.id, !slide.isActive);

            return (
              <li key={slide.id} className="seed-packet overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Colour / image preview */}
                  <div
                    className="h-16 w-24 shrink-0 rounded-sm border border-canopy/10"
                    style={{ backgroundColor: slide.bgColor }}
                  >
                    {slide.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.imageUrl}
                        alt=""
                        className="h-full w-full rounded-sm object-cover opacity-80"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm text-canopy truncate">
                        {slide.title}
                      </p>
                      <span
                        className={`stamp-badge rounded-full px-2 py-0.5 ${
                          slide.isActive
                            ? "bg-canopy/10 text-canopy"
                            : "bg-sage text-loam/50"
                        }`}
                      >
                        {slide.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {slide.subtitle && (
                      <p className="mt-0.5 text-xs text-loam/60 truncate">
                        {slide.subtitle}
                      </p>
                    )}
                    <p className="mt-0.5 font-mono text-xs text-loam/40">
                      Order: {slide.sortOrder}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <form action={boundToggle} className="inline">
                      <button
                        type="submit"
                        className="text-canopy/70 hover:text-canopy hover:underline"
                      >
                        {slide.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/content/slides/${slide.id}`}
                      className="text-canopy hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={boundDelete} className="inline">
                      <ConfirmSubmitButton
                        confirmMessage={`Delete slide "${slide.title}"?`}
                        className="text-clay hover:underline"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
