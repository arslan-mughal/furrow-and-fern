import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

async function getAdminUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  return user?.role === "admin" ? user : null;
}

/**
 * For pages/layouts — redirects rather than rendering anything if the
 * visitor isn't signed in as an admin. Put this at the top of any new admin
 * page (app/admin/layout.tsx already covers everything nested under it).
 */
export async function requireAdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");
  return admin;
}

/**
 * For Server Actions — these are independently callable endpoints, not just
 * UI the layout happens to hide, so every mutation re-checks this itself
 * rather than trusting that only an admin could have reached the form.
 */
export async function requireAdminAction() {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Forbidden: admin access required.");
  }
  return admin;
}
