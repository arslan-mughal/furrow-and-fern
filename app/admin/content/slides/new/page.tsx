import type { Metadata } from "next";
import Link from "next/link";
import { SlideForm } from "@/components/admin/SlideForm";
import { createSlide } from "../actions";

export const metadata: Metadata = { title: "Add Slide — Admin" };

export default function NewSlidePage() {
  return (
    <div>
      <Link href="/admin/content/slides" className="text-xs text-clay hover:underline">
        ← All slides
      </Link>
      <h2 className="mt-2 font-display text-lg text-canopy">Add a slide</h2>
      <div className="mt-6">
        <SlideForm action={createSlide} submitLabel="Create slide" />
      </div>
    </div>
  );
}
