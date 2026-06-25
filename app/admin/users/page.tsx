import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserSearchControls } from "@/components/admin/UserSearchControls";

export const metadata: Metadata = {
  title: "Admin · Users — Furrow & Fern",
};

const PAGE_SIZE = 10;

interface RawSearchParams {
  q?: string;
  field?: string;
  page?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const resolved = await searchParams;
  const q = resolved.q?.trim() || "";
  const field: "name" | "email" = resolved.field === "email" ? "email" : "name";
  const page = Math.max(1, parseInt(resolved.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const result = await auth.api.listUsers({
    query: {
      ...(q ? { searchValue: q, searchField: field, searchOperator: "contains" as const } : {}),
      limit: PAGE_SIZE,
      offset,
      sortBy: "createdAt",
      sortDirection: "desc" as const,
    },
    headers: await headers(),
  });

  const users = result.users;
  const total = result.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const currentParams: Record<string, string> = {};
  if (q) {
    currentParams.q = q;
    currentParams.field = field;
  }

  function pageHref(targetPage: number) {
    const params = new URLSearchParams(currentParams);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-lg text-canopy">Users ({total})</h2>
        <UserSearchControls currentParams={currentParams} />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-canopy/20 text-xs uppercase tracking-wide text-loam/60">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy/10">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-3 pr-4">
                  <Link href={`/admin/users/${user.id}`} className="text-canopy hover:underline">
                    {user.name || "—"}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-loam/70">{user.email}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`stamp-badge rounded-full px-2 py-1 ${
                      user.role === "admin" ? "bg-marigold text-loam" : "bg-sage text-canopy"
                    }`}
                  >
                    {user.role ?? "customer"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {user.banned ? (
                    <span className="stamp-badge text-clay">Deactivated</span>
                  ) : (
                    <span className="stamp-badge text-canopy/60">Active</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-loam/60">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="py-8 text-center text-sm text-loam/60">No users match.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            className={`rounded-card border border-canopy/20 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-canopy hover:border-canopy"
            }`}
          >
            ← Prev
          </Link>
          <span className="text-loam/60">
            Page {page} of {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            className={`rounded-card border border-canopy/20 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "text-canopy hover:border-canopy"
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
