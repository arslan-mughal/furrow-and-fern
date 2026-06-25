import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { updateUserName, changeUserRole, banUser, unbanUser, deleteUser } from "../actions";

export const metadata: Metadata = {
  title: "User Detail — Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const currentAdminId = session?.user?.id;

  // Defensive about whether a missing user throws or returns null/undefined
  // here — the docs aren't fully consistent on this, and either way should
  // land on the same 404 rather than an unhandled error.
  let user: Awaited<ReturnType<typeof auth.api.getUser>> | null = null;
  try {
    user = await auth.api.getUser({ query: { id }, headers: await headers() });
  } catch {
    user = null;
  }

  if (!user) notFound();

  const orders = await prisma.order.findMany({
    where: { userId: id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const isSelf = currentAdminId === user.id;

  const boundUpdateName = updateUserName.bind(null, user.id);
  const boundChangeRole = changeUserRole.bind(null, user.id);
  const boundBan = banUser.bind(null, user.id);
  const boundUnban = unbanUser.bind(null, user.id);
  const boundDelete = deleteUser.bind(null, user.id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/users" className="text-xs text-clay hover:underline">
        ← All users
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-canopy">{user.name || "Unnamed user"}</h2>
          <p className="text-sm text-loam/70">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`stamp-badge rounded-full px-2 py-1 ${
              user.role === "admin" ? "bg-marigold text-loam" : "bg-sage text-canopy"
            }`}
          >
            {user.role ?? "customer"}
          </span>
          {user.banned ? (
            <span className="stamp-badge rounded-full bg-clay/10 px-2 py-1 text-clay">
              Deactivated
            </span>
          ) : (
            <span className="stamp-badge rounded-full bg-canopy/10 px-2 py-1 text-canopy">
              Active
            </span>
          )}
        </div>
      </div>

      {isSelf && (
        <p className="mt-4 rounded-card bg-sage/40 px-3 py-2 text-xs text-loam/70">
          This is your own account — role, status, and delete actions are disabled here to
          prevent locking yourself out.
        </p>
      )}

      <p className="mt-4 text-xs text-loam/50">
        Joined {new Date(user.createdAt).toLocaleDateString()} · Email{" "}
        {user.emailVerified ? "verified" : "not verified"}
      </p>

      {user.banned && user.banReason && (
        <p className="mt-2 text-xs text-clay">Ban reason: {user.banReason}</p>
      )}

      <section className="seed-packet mt-8 p-6">
        <h3 className="font-display text-base text-canopy">Profile</h3>
        <form 
          action={async (formData) => {
            await boundUpdateName(formData);
          }} 
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="name" className="text-xs text-loam/70">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={user.name ?? ""}
              required
              className="mt-1 rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
            />
          </div>
          <button
            type="submit"
            className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
          >
            Save name
          </button>
        </form>
        <p className="mt-2 text-xs text-loam/50">
          Email isn&apos;t editable here — Better Auth ties it to login/verification state.
        </p>
      </section>

      <section className="seed-packet mt-6 p-6">
        <h3 className="font-display text-base text-canopy">Role</h3>
        <form 
          action={async (formData) => {
            await boundChangeRole(formData);
          }} 
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="role" className="text-xs text-loam/70">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={user.role ?? "customer"}
              disabled={isSelf}
              className="mt-1 rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy disabled:opacity-50"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSelf}
            className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam disabled:cursor-not-allowed disabled:opacity-50"
          >
            Update role
          </button>
        </form>
      </section>

      <section className="seed-packet mt-6 p-6">
        <h3 className="font-display text-base text-canopy">Account status</h3>
        {user.banned ? (
          <form 
            action={async () => {
              await boundUnban();
            }} 
            className="mt-3"
          >
            <button
              type="submit"
              disabled={isSelf}
              className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reactivate account
            </button>
          </form>
        ) : (
          <form 
            action={async (formData) => {
              await boundBan(formData);
            }} 
            className="mt-3 flex flex-wrap items-end gap-3"
          >
            <div>
              <label htmlFor="reason" className="text-xs text-loam/70">
                Reason (optional)
              </label>
              <input
                id="reason"
                name="reason"
                disabled={isSelf}
                className="mt-1 rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isSelf}
              className="rounded-card bg-clay px-4 py-2 text-sm text-parchment hover:bg-canopy disabled:cursor-not-allowed disabled:opacity-50"
            >
              Deactivate account
            </button>
          </form>
        )}
        <p className="mt-2 text-xs text-loam/50">
          Deactivating revokes their active sessions immediately and blocks sign-in until
          reactivated.
        </p>
      </section>

      <section className="mt-6">
        <h3 className="font-display text-base text-canopy">Order history</h3>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-loam/70">No orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-canopy/10 border-y border-canopy/10">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-canopy"
                >
                  <span className="text-canopy">Order #{order.id.slice(-8)}</span>
                  <span className="text-xs text-loam/60">{order.status}</span>
                  <span className="font-mono text-loam">
                    {formatCents(order.totalCents, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-clay/20 pt-6">
        <h3 className="font-display text-base text-clay">Danger zone</h3>
        <form 
          action={async () => {
            await boundDelete();
          }} 
          className="mt-3"
        >
          <ConfirmSubmitButton
            confirmMessage={`Permanently delete ${user.email}? This can't be undone. Their past orders are kept for records but will show as a deleted account.`}
            disabled={isSelf}
            title={isSelf ? "You can't delete your own account" : undefined}
            className="rounded-card border border-clay px-4 py-2 text-sm text-clay hover:bg-clay hover:text-parchment disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-clay"
          >
            Delete user
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}