"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/address";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  return session.user;
}

function readAddressFields(formData: FormData) {
  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? "") || undefined,
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "PK"),
    phone: String(formData.get("phone") ?? "") || undefined,
  };

  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid address.");
  }
  return parsed.data;
}

export async function createAddress(formData: FormData) {
  const user = await getAuthenticatedUser();
  const fields = readAddressFields(formData);
  const label = String(formData.get("label") ?? "").trim() || null;
  const isDefaultBilling = formData.get("isDefaultBilling") === "on";
  const isDefaultShipping = formData.get("isDefaultShipping") === "on";

  // Unset other defaults before setting the new one, so there's always at
  // most one default billing and one default shipping address.
  if (isDefaultBilling) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefaultBilling: false },
    });
  }
  if (isDefaultShipping) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefaultShipping: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: user.id,
      label,
      isDefaultBilling,
      isDefaultShipping,
      ...fields,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function updateAddress(addressId: string, formData: FormData) {
  const user = await getAuthenticatedUser();

  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }

  const fields = readAddressFields(formData);
  const label = String(formData.get("label") ?? "").trim() || null;
  const isDefaultBilling = formData.get("isDefaultBilling") === "on";
  const isDefaultShipping = formData.get("isDefaultShipping") === "on";

  if (isDefaultBilling) {
    await prisma.address.updateMany({
      where: { userId: user.id, id: { not: addressId } },
      data: { isDefaultBilling: false },
    });
  }
  if (isDefaultShipping) {
    await prisma.address.updateMany({
      where: { userId: user.id, id: { not: addressId } },
      data: { isDefaultShipping: false },
    });
  }

  await prisma.address.update({
    where: { id: addressId },
    data: { label, isDefaultBilling, isDefaultShipping, ...fields },
  });

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(addressId: string) {
  const user = await getAuthenticatedUser();

  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }

  await prisma.address.delete({ where: { id: addressId } });
  revalidatePath("/account");
  revalidatePath("/account/addresses");
}
