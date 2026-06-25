import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin Dashboard — Furrow & Fern",
};

export default async function AdminDashboardPage() {
  const [productCount, categoryCount, orderCount, revenue, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["CONFIRMED", "FULFILLED"] } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Products", value: String(productCount) },
    { label: "Categories", value: String(categoryCount) },
    { label: "Orders", value: String(orderCount) },
    { label: "Revenue", value: formatCents(revenue._sum.totalCents ?? 0) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="seed-packet p-4">
            <p className="stamp-badge text-canopy/60">{stat.label}</p>
            <p className="mt-1 font-display text-2xl text-canopy">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-canopy">Recent orders</h2>
          <Link href="/admin/orders" className="stamp-badge text-clay hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-loam/70">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-canopy/10 border-y border-canopy/10">
            {recentOrders.map((order) => (
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
      </div>
    </div>
  );
}
