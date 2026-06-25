import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SlideForm } from "@/components/admin/SlideForm";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { updateSlide, deleteSlide } from "../actions";

export const metadata: Metadata = { title: "Edit Slide — Admin" };

export default async function EditSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) notFound();

  const boundUpdate = updateSlide.bind(null, slide.id);
  const boundDelete = deleteSlide.bind(null, slide.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/admin/content/slides" className="text-xs text-clay hover:underline">
          ← All slides
        </Link>
        <form action={boundDelete} className="inline">
          <ConfirmSubmitButton
            confirmMessage={`Delete slide "${slide.title}"?`}
            className="text-xs text-clay hover:underline"
          >
            Delete slide
          </ConfirmSubmitButton>
        </form>
      </div>
      <h2 className="mt-2 font-display text-lg text-canopy">Edit slide</h2>
      <div className="mt-6">
        <SlideForm slide={slide} action={boundUpdate} submitLabel="Save changes" />
      </div>
    </div>
  );
}
