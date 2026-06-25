import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import type { AddressInput } from "@/lib/address";
import { formatAddressLines } from "@/lib/address";
import { confirmPayment, rejectPayment, markFulfilled, cancelOrder } from "../../actions";

export const metadata: Metadata = {
  title: "Order Detail — Admin",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-sage text-canopy",
  PENDING_VERIFICATION: "bg-marigold/20 text-loam",
  CONFIRMED: "bg-canopy/10 text-canopy",
  REJECTED: "bg-clay/10 text-clay",
  FULFILLED: "bg-canopy text-parchment",
  CANCELLED: "bg-loam/10 text-loam",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });

  if (!order) notFound();

  const billingAddress = order.billingAddress as AddressInput | null;
  const shippingAddress = order.shippingAddress as AddressInput | null;
  const recipient = order.user?.email ?? order.guestEmail ?? "—";

  const boundConfirm = confirmPayment.bind(null, order.id);
  const boundFulfil = markFulfilled.bind(null, order.id);
  const boundCancel = cancelOrder.bind(null, order.id);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="stamp-badge text-clay">Order #{order.id.slice(-8)}</p>
          <h2 className="mt-1 font-display text-2xl text-canopy">
            {order.user?.name ?? order.user?.email ?? order.guestEmail ?? "Guest order"}
          </h2>
          <p className="mt-1 text-sm text-loam/60">
            {recipient} · {order.createdAt.toLocaleString()}
          </p>
        </div>
        <span
          className={`stamp-badge rounded-full px-3 py-1 ${
            STATUS_BADGE[order.status] ?? "bg-sage text-canopy"
          }`}
        >
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Payment details */}
      {order.transactionId && (
        <div className="seed-packet mt-6 p-4">
          <p className="stamp-badge text-canopy/60">Payment submitted</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-loam/60">Method</dt>
              <dd className="text-loam">{order.paymentMethod?.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-loam/60">Transaction ID</dt>
              <dd className="font-mono text-canopy">{order.transactionId}</dd>
            </div>
            {order.transactionNote && (
              <div className="flex justify-between gap-4">
                <dt className="text-loam/60">Note</dt>
                <dd className="text-loam">{order.transactionNote}</dd>
              </div>
            )}
            {order.submittedAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-loam/60">Submitted</dt>
                <dd className="text-loam">{new Date(order.submittedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {order.rejectionReason && (
        <p className="mt-3 text-sm text-clay">Rejection reason: {order.rejectionReason}</p>
      )}

      {/* Items */}
      <ul className="mt-6 divide-y divide-canopy/10 border-y border-canopy/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="h-12 w-12 shrink-0 rounded-sm border border-canopy/10 object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-canopy">{item.name}</p>
              <p className="text-xs text-loam/60">Qty {item.quantity}</p>
            </div>
            <span className="font-mono text-sm text-loam">
              {formatCents(item.unitPriceCents * item.quantity, order.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between text-sm">
        <span className="text-loam/70">Total</span>
        <span className="font-mono font-semibold text-canopy">
          {formatCents(order.totalCents, order.currency)}
        </span>
      </div>

      {/* Addresses */}
      {(billingAddress || shippingAddress) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {billingAddress && (
            <div>
              <p className="stamp-badge text-canopy/60">Billing</p>
              <address className="mt-2 not-italic text-sm text-loam/80">
                {formatAddressLines(billingAddress).map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </address>
            </div>
          )}
          {shippingAddress && (
            <div>
              <p className="stamp-badge text-canopy/60">Shipping</p>
              <address className="mt-2 not-italic text-sm text-loam/80">
                {formatAddressLines(shippingAddress).map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </address>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-4 border-t border-canopy/10 pt-6">
        <p className="stamp-badge text-canopy/60">Actions</p>

        {order.status === "PENDING_VERIFICATION" && (
          <div className="flex flex-wrap gap-3">
            <form action={boundConfirm}>
              <button
                type="submit"
                className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
              >
                ✓ Confirm payment
              </button>
            </form>
            <form action={rejectPayment.bind(null, order.id)} className="flex gap-2">
              <input
                name="reason"
                placeholder="Rejection reason (optional)"
                className="rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
              />
              <button
                type="submit"
                className="rounded-card bg-clay px-4 py-2 text-sm text-parchment hover:bg-canopy"
              >
                ✗ Reject
              </button>
            </form>
          </div>
        )}

        {order.status === "CONFIRMED" && (
          <form action={boundFulfil}>
            <button
              type="submit"
              className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
            >
              Mark as fulfilled / shipped
            </button>
          </form>
        )}

        {(order.status === "PENDING" || order.status === "REJECTED") && (
          <form action={boundCancel}>
            <button
              type="submit"
              className="text-sm text-clay hover:underline"
            >
              Cancel order
            </button>
          </form>
        )}

        {["FULFILLED", "CANCELLED", "CONFIRMED"].includes(order.status) && (
          <p className="text-xs text-loam/50">No further actions available for this status.</p>
        )}
      </div>
    </div>
  );
}
