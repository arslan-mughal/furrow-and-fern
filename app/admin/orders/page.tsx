import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin · Orders — Furrow & Fern",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "text-loam/60",
  PENDING_VERIFICATION: "text-marigold",
  CONFIRMED: "text-canopy",
  REJECTED: "text-clay",
  FULFILLED: "font-semibold text-canopy",
  CANCELLED: "text-loam/40",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pendingVerification = orders.filter(
    (o) => o.status === "PENDING_VERIFICATION"
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-canopy">
          Orders ({orders.length})
        </h2>
        {pendingVerification > 0 && (
          <span className="stamp-badge rounded-full bg-marigold px-3 py-1 text-loam">
            {pendingVerification} pending verification
          </span>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-canopy/20 text-xs uppercase tracking-wide text-loam/60">
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Method</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canopy/10">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-canopy hover:underline"
                  >
                    #{order.id.slice(-8)}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-loam/70">
                  {order.user?.email ?? order.guestEmail ?? "Guest"}
                </td>
                <td className="py-3 pr-4 text-loam/70">
                  {order.paymentMethod?.replace("_", " ") ?? "—"}
                </td>
                <td className={`py-3 pr-4 stamp-badge ${STATUS_BADGE[order.status] ?? ""}`}>
                  {order.status.replace(/_/g, " ")}
                </td>
                <td className="py-3 pr-4 font-mono">
                  {formatCents(order.totalCents, order.currency)}
                </td>
                <td className="py-3 pr-4 text-loam/60">
                  {order.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="py-8 text-center text-sm text-loam/60">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
