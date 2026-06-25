import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = {
  title: "My Account — Furrow & Fern",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  PENDING_VERIFICATION: "Pending verification",
  CONFIRMED: "Confirmed",
  REJECTED: "Payment rejected",
  FULFILLED: "Shipped",
  CANCELLED: "Cancelled",
};

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const [user, orders, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, phone: true, name: true, email: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-canopy">My Account</h1>

      {/* Profile */}
      <section className="seed-packet mt-8 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-canopy">Profile</h2>
          <SignOutButton />
        </div>
        <ProfileForm
          userId={session.user.id}
          initial={{
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            phone: user?.phone ?? "",
            name: user?.name ?? "",
            email: user?.email ?? "",
          }}
        />
      </section>

      {/* Address book */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-canopy">Saved addresses</h2>
          <Link href="/account/addresses/new" className="stamp-badge text-clay hover:underline">
            + Add new
          </Link>
        </div>

        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-loam/70">
            No saved addresses yet.{" "}
            <Link href="/account/addresses/new" className="text-canopy underline">
              Add one
            </Link>{" "}
            to speed up checkout.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {addresses.map((address) => (
              <li key={address.id}>
                <Link
                  href={`/account/addresses/${address.id}`}
                  className="seed-packet block p-4 transition-colors hover:border-canopy"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm text-canopy">
                      {address.label ?? `${address.firstName} ${address.lastName}`}
                    </p>
                    <div className="flex gap-2">
                      {address.isDefaultBilling && (
                        <span className="stamp-badge rounded-full bg-sage px-2 py-0.5 text-canopy">
                          Billing
                        </span>
                      )}
                      {address.isDefaultShipping && (
                        <span className="stamp-badge rounded-full bg-sage px-2 py-0.5 text-canopy">
                          Shipping
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-loam/70">
                    {address.line1}, {address.city}, {address.state}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {addresses.length > 0 && (
          <Link
            href="/account/addresses"
            className="mt-3 block text-xs text-clay hover:underline"
          >
            Manage all addresses →
          </Link>
        )}
      </section>

      {/* Order history */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-canopy">Order history</h2>

        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-loam/70">
            No orders yet —{" "}
            <Link href="/products" className="text-canopy underline">
              start shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/checkout/success?orderId=${order.id}`}
                  className="seed-packet flex items-center justify-between p-4 transition-colors hover:border-canopy"
                >
                  <div>
                    <p className="font-display text-sm text-canopy">
                      Order #{order.id.slice(-8)}
                    </p>
                    <p className="text-xs text-loam/60">
                      {order.createdAt.toLocaleDateString()} ·{" "}
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{" "}
                      {STATUS_LABEL[order.status] ?? order.status}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-loam">
                    {formatCents(order.totalCents, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
