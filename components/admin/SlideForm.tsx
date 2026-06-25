"use client";

import type { HeroSlide } from "@prisma/client";

interface SlideFormProps {
  slide?: Partial<HeroSlide>;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}

const inputClass =
  "mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy focus:outline-none";

export function SlideForm({ slide, action, submitLabel }: SlideFormProps) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className="text-xs text-loam/70">
          Headline *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={slide?.title ?? ""}
          placeholder="Grow something worth tending."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="subtitle" className="text-xs text-loam/70">
          Subtitle
        </label>
        <textarea
          id="subtitle"
          name="subtitle"
          rows={2}
          defaultValue={slide?.subtitle ?? ""}
          placeholder="A short supporting line shown below the headline."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ctaLabel" className="text-xs text-loam/70">
            Button label
          </label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            defaultValue={slide?.ctaLabel ?? ""}
            placeholder="Shop the collection"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ctaUrl" className="text-xs text-loam/70">
            Button URL
          </label>
          <input
            id="ctaUrl"
            name="ctaUrl"
            defaultValue={slide?.ctaUrl ?? ""}
            placeholder="/products"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="imageUrl" className="text-xs text-loam/70">
          Background image URL
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={slide?.imageUrl ?? ""}
          placeholder="https://… (leave blank to use solid colour)"
          className={inputClass}
        />
        <p className="mt-0.5 text-xs text-loam/40">
          Recommended: wide landscape image (1600×700 or larger).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
          <div>
          <label htmlFor="bgColor" className="text-xs text-loam/70">
            Background colour
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="bgColorPicker"
              type="color"
              defaultValue={slide?.bgColor ?? "#1F3A2E"}
              className="h-9 w-12 cursor-pointer rounded-card border border-canopy/20 bg-transparent p-0.5"
              onChange={(e) => {
                const hex = (e.target.closest("div")?.querySelector(
                  "input[name=bgColor]"
                ) as HTMLInputElement | null);
                if (hex) hex.value = e.target.value;
              }}
            />
            <input
              id="bgColor"
              name="bgColor"
              aria-label="Background colour hex value"
              defaultValue={slide?.bgColor ?? "#1F3A2E"}
              pattern="^#[0-9A-Fa-f]{6}$"
              className={`flex-1 ${inputClass} mt-0`}
            />
          </div>
          <p className="mt-0.5 text-xs text-loam/40">
            Used when no image is set, or as the overlay base colour.
          </p>
        </div>

        <div>
          <label htmlFor="sortOrder" className="text-xs text-loam/70">
            Sort order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={slide?.sortOrder ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={slide?.isActive ?? true}
          className="h-4 w-4 rounded border-canopy/30 text-canopy"
        />
        <label htmlFor="isActive" className="text-sm text-loam/70">
          Active (shown on homepage)
        </label>
      </div>

      <button
        type="submit"
        className="rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-marigold hover:text-loam"
      >
        {submitLabel}
      </button>
    </form>
  );
}
