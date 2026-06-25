import { prisma } from "./prisma";

export interface SlideData {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  bgColor: string;
}

export async function getActiveSlides(): Promise<SlideData[]> {
  return prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      ctaLabel: true,
      ctaUrl: true,
      imageUrl: true,
      bgColor: true,
    },
  });
}
