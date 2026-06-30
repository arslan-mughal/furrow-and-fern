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

/**
 * The roles this application uses at runtime.
 *
 * Better Auth's admin plugin ships with a hardcoded TypeScript union of
 * `"user" | "admin"` for the `role` field on `auth.api.setRole`'s body.
 * That union is not a generic — passing `defaultRole: "customer"` in the
 * plugin config changes the runtime default but does NOT widen the compile-
 * time type. This means TypeScript rejects `"customer"` as a valid role even
 * though Better Auth accepts it at runtime.
 *
 * `AuthRole` is derived directly from the parameter type of `auth.api.setRole`
 * so it stays in sync automatically if Better Auth ever updates that signature.
 * We then broaden it with our `"customer"` role via a union to form `AppRole`,
 * which is what the runtime validation and the setRole call both use.
 *
 * The final `as AuthRole` assertion on the setRole call is deliberate:
 *   - It does NOT use `any` (all type information is preserved).
 *   - It asserts the specific library type that setRole declares, not a wider type.
 *   - It is necessary because Better Auth's plugin type is wrong relative to
 *     its own runtime behaviour — this is a known BA 1.x limitation.
 *   - The runtime guard above the assertion (`role !== "customer" && role !== "admin"`)
 *     ensures the value is always valid before we reach the assertion.
 */
type AuthRole = NonNullable<Parameters<NonNullable<typeof auth.api.setRole>>[0]>["body"]["role"];
type AppRole = AuthRole | "customer";

const APP_ROLES: AppRole[] = ["admin", "customer"];

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

  const raw = String(formData.get("role") ?? "");

  // Validate against our AppRole array — this is the runtime guard.
  // Only "admin" and "customer" pass; anything else throws before we
  // ever reach the auth API call.
  if (!APP_ROLES.includes(raw as AppRole)) {
    throw new Error(`Invalid role: "${raw}". Expected one of: ${APP_ROLES.join(", ")}.`);
  }

  // `raw` is now a valid AppRole ("admin" | "customer").
  // Better Auth's setRole types its body.role as "user" | "admin" — a
  // hardcoded union that doesn't reflect the `defaultRole: "customer"` config.
  // The assertion to AuthRole is required to satisfy the compiler; it is safe
  // because Better Auth accepts "customer" at runtime.
  const role = raw as AppRole;

  await auth.api.setRole({
    body: { userId, role: role as AuthRole },
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

export async function resendVerificationEmail(userId: string) {
  await requireAdminAction();

  // auth.api.sendVerificationEmail needs an email address, not a userId —
  // look it up first. Goes through the same emailVerification.sendVerificationEmail
  // callback in lib/auth.ts as the self-serve resend link on /login.
  const user = await auth.api.getUser({ query: { id: userId }, headers: await headers() });
  if (!user) {
    throw new Error("User not found.");
  }
  if (user.emailVerified) {
    throw new Error("This user's email is already verified.");
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email: user.email, callbackURL: "/verify-email" },
      headers: await headers(),
    });
  } catch (err) {
    // Better Auth throws APIError on auth.api.* failures rather than
    // returning a {error} object — server-side calls aren't the same as
    // the client SDK's {data, error} shape. Surface a clean message
    // instead of an unhandled Server Action error screen.
    const message = err instanceof Error ? err.message : "Couldn't send the verification email.";
    throw new Error(message);
  }

  revalidatePath(`/admin/users/${userId}`);
}

export async function sendPasswordResetLink(userId: string) {
  await requireAdminAction();

  const user = await auth.api.getUser({ query: { id: userId }, headers: await headers() });
  if (!user) {
    throw new Error("User not found.");
  }

  try {
    // Goes through the same emailAndPassword.sendResetPassword callback in
    // lib/auth.ts as the self-serve "forgot password?" link on /login —
    // this just lets an admin trigger it on the user's behalf (e.g. a
    // support request) without needing the user's password.
    await auth.api.requestPasswordReset({
      body: { email: user.email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't send the reset link.";
    throw new Error(message);
  }

  revalidatePath(`/admin/users/${userId}`);
}