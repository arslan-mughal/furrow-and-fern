"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

export async function updateProfile(userId: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.id !== userId) {
    throw new Error("Not authorized.");
  }

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { firstName, lastName, phone } = parsed.data;

  // Build a display `name` from first + last if both are present.
  const nameFromParts =
    firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName || lastName || undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      ...(nameFromParts ? { name: nameFromParts } : {}),
    },
  });

  revalidatePath("/account");
}
