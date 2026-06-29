"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdminAction } from "@/lib/admin";

/**
 * Every operation here goes through Better Auth's admin plugin (auth.api.*),
 * not raw Prisma — banUser in particular also revokes the target's existing
 * sessions, which a hand-written `prisma.user.update` wouldn't do. Every
 * action still calls requireAdminAction() itself first: the plugin does its
 * own permission check too, but that's defense in depth, the same pattern
 * every other action in this codebase (app/admin/actions.ts) uses.
 */

export async function updateUserName(userId: string, formData: FormData) {
  await requireAdminAction();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  await auth.api.adminUpdateUser({
    body: { userId, data: { name } },
    headers: await headers(),
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function changeUserRole(userId: string, formData: FormData) {
  const admin = await requireAdminAction();
  if (admin.id === userId) {
    throw new Error("You can't change your own role.");
  }

  const role = String(formData.get("role") ?? "");
  if (role !== "customer" && role !== "admin") {
    throw new Error("Invalid role.");
  }

  await auth.api.setRole({
    body: { userId, role },
    headers: await headers(),
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function banUser(userId: string, formData: FormData) {
  const admin = await requireAdminAction();
  if (admin.id === userId) {
    throw new Error("You can't deactivate your own account.");
  }

  const reason = String(formData.get("reason") ?? "").trim();

  await auth.api.banUser({
    body: reason ? { userId, banReason: reason } : { userId },
    headers: await headers(),
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
  await requireAdminAction();

  await auth.api.unbanUser({
    body: { userId },
    headers: await headers(),
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdminAction();
  if (admin.id === userId) {
    throw new Error("You can't delete your own account.");
  }

  await auth.api.removeUser({
    body: { userId },
    headers: await headers(),
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
