"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdminAction } from "@/lib/admin";

/**
 * Standardized response type for client-side error handling
 */
export type ActionState = {
  success: boolean;
  message?: string;
};

/**
 * Every operation here goes through Better Auth's admin plugin (auth.api.*),
 * not raw Prisma — banUser in particular also revokes the target's existing
 * sessions, which a hand-written `prisma.user.update` wouldn't do. Every
 * action still calls requireAdminAction() itself first: the plugin does its
 * own permission check too, but that's defense in depth, the same pattern
 * every other action in this codebase (app/admin/actions.ts) uses.
 */

export async function updateUserName(userId: string, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      return { success: false, message: "Name is required." };
    }

    await auth.api.adminUpdateUser({
      body: { userId, data: { name } },
      headers: await headers(),
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    
    return { success: true, message: "User name updated successfully." };
  } catch (error: any) {
    console.error("[updateUserName Error]:", error);
    return { success: false, message: error.message || "Failed to update user name." };
  }
}

export async function changeUserRole(userId: string, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdminAction();
    if (admin.id === userId) {
      return { success: false, message: "You cannot change your own role." };
    }

    const rawRole = String(formData.get("role") ?? "");
    if (rawRole !== "customer" && rawRole !== "admin") {
      return { success: false, message: "Invalid role selected. Must be 'customer' or 'admin'." };
    }

    // TRANSLATE: Map your UI's "customer" terminology to Better Auth's expected "user" terminology
    const betterAuthRole = rawRole === "customer" ? "user" : "admin";

    await auth.api.setRole({
      body: { userId, role: betterAuthRole },
      headers: await headers(),
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true, message: `User role updated to ${rawRole} successfully.` };
  } catch (error: any) {
    console.error("[changeUserRole Error]:", error);
    return { success: false, message: error.message || "Failed to update user role." };
  }
}

export async function banUser(userId: string, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdminAction();
    if (admin.id === userId) {
      return { success: false, message: "You cannot ban your own account." };
    }

    const reason = String(formData.get("reason") ?? "").trim();

    await auth.api.banUser({
      body: reason ? { userId, banReason: reason } : { userId },
      headers: await headers(),
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true, message: "User has been banned." };
  } catch (error: any) {
    console.error("[banUser Error]:", error);
    return { success: false, message: error.message || "Failed to ban user." };
  }
}

export async function unbanUser(userId: string): Promise<ActionState> {
  try {
    await requireAdminAction();

    await auth.api.unbanUser({
      body: { userId },
      headers: await headers(),
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return { success: true, message: "User has been unbanned." };
  } catch (error: any) {
    console.error("[unbanUser Error]:", error);
    return { success: false, message: error.message || "Failed to unban user." };
  }
}

export async function deleteUser(userId: string): Promise<ActionState> {
  let isSuccess = false;

  try {
    const admin = await requireAdminAction();
    if (admin.id === userId) {
      return { success: false, message: "You cannot delete your own account." };
    }

    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    });

    revalidatePath("/admin/users");
    isSuccess = true;
  } catch (error: any) {
    console.error("[deleteUser Error]:", error);
    return { success: false, message: error.message || "Failed to delete user." };
  }

  // Redirect must be called outside the try/catch block because Next.js
  // handles redirects by intentionally throwing a NEXT_REDIRECT error.
  if (isSuccess) {
    redirect("/admin/users");
  }
  
  return { success: false, message: "An unexpected error occurred during redirection." };
}