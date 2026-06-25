"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/admin";

function readSlideFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || null;
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const bgColor = String(formData.get("bgColor") ?? "#1F3A2E").trim() || "#1F3A2E";
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  const isActive = formData.get("isActive") === "on";

  if (!title) throw new Error("Title is required.");
  return { title, subtitle, ctaLabel, ctaUrl, imageUrl, bgColor, sortOrder, isActive };
}

function revalidateSlides() {
  revalidatePath("/admin/content/slides");
  revalidatePath("/");
}

export async function createSlide(formData: FormData) {
  await requireAdminAction();
  const fields = readSlideFields(formData);
  await prisma.heroSlide.create({ data: fields });
  revalidateSlides();
  redirect("/admin/content/slides");
}

export async function updateSlide(slideId: string, formData: FormData) {
  await requireAdminAction();
  const fields = readSlideFields(formData);
  await prisma.heroSlide.update({ where: { id: slideId }, data: fields });
  revalidateSlides();
  redirect("/admin/content/slides");
}

export async function deleteSlide(slideId: string) {
  await requireAdminAction();
  await prisma.heroSlide.delete({ where: { id: slideId } });
  revalidateSlides();
}

export async function toggleSlideActive(slideId: string, isActive: boolean) {
  await requireAdminAction();
  await prisma.heroSlide.update({ where: { id: slideId }, data: { isActive } });
  revalidateSlides();
}
