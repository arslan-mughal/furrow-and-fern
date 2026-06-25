import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import type { AddressInput } from "@/lib/address";
import { formatAddressLines } from "@/lib/address";

export const metadata: Metadata = {
  title: "Order Status — Furrow & Fern",
};

const STATUS_COPY: Record<
  string,
  { badge: string; title: string; description: string }
> = {
  PENDING: {
    badge: "Awaiting payment",
    title: "This order isn't paid yet",
    description: "Head back to the payment page to submit your transaction id.",
  },
  PENDING_VERIFICATION: {
    badge: "Pending verification",
    title: "We're checking your payment",
    description:
      "Thanks — we've received your transaction id and we're verifying it against our account. This usually takes a few hours. We'll email you once it's confirmed.",
  },
  CONFIRMED: {
    badge: "Confirmed",
    title: "Thanks for your order!",
    description: "Your payment is confirmed. We'll email you again once it ships.",
  },
  REJECTED: {
    badge: "Payment not verified",
    title: "We couldn't verify this payment",
    description:
      "We weren't able to match a payment to this order. If you did pay, reply to your confirmation email with a receipt and we'll sort it out.",
  },
  FULFILLED: {
    badge: "Shipped",
    title: "Your order is on its way",
    description: "This order has shipped. Thanks for growing with us.",
  },
  CANCELLED: {
    badge: "Cancelled",
    title: "This order was cancelled",
    description: "If this wasn't expected, get in touch and we'll help sort it out.",
  },
};

export default async function OrderStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })
    : null;

  if (!orderId || !order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="font-display text-xl text-canopy">No order to show.</p>
        <Link href="/products" className="mt-6 inline-block text-canopy underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.PENDING;
  const shippingAddress = order.shippingAddress as AddressInput | null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="stamp-badge text-clay">{copy.badge}</p>
      <h1 className="mt-2 font-display text-2xl text-canopy">{copy.title}</h1>
      <p className="mt-2 text-sm text-loam/70">{copy.description}</p>

      {order.status === "PENDING" && (
        <Link
          href={`/checkout/payment/${order.id}`}
          className="mt-5 inline-flex rounded-card bg-marigold px-5 py-2.5 text-sm font-semibold text-loam hover:bg-canopy hover:text-parchment"
        >
          Complete payment
        </Link>
      )}

      <div className="seed-packet mt-8 p-6">
        <div className="flex items-center justify-between">
          <span className="stamp-badge text-canopy/60">Order #{order.id.slice(-8)}</span>
          <span className="stamp-badge text-canopy">{order.status.replace("_", " ")}</span>
        </div>

        <ul className="mt-4 divide-y divide-canopy/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="h-14 w-14 shrink-0 rounded-sm border border-canopy/10 object-cover"
              />
              <div className="flex-1">
                <p className="font-display text-sm text-canopy">{item.name}</p>
                <p className="text-xs text-loam/60">Qty {item.quantity}</p>
              </div>
              <span className="font-mono text-sm text-loam">
                {formatCents(item.unitPriceCents * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-canopy/10 pt-4 text-sm">
          <span className="text-loam/70">Total</span>
          <span className="font-mono text-canopy">
            {formatCents(order.totalCents, order.currency)}
          </span>
        </div>

        {shippingAddress && (
          <div className="mt-4 border-t border-canopy/10 pt-4 text-sm">
            <p className="text-xs text-loam/60">Shipping to</p>
            {formatAddressLines(shippingAddress).map((line) => (
              <p key={line} className="text-loam">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/products"
          className="rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Continue shopping
        </Link>
        {order.userId && (
          <Link
            href="/account"
            className="rounded-card border border-canopy/30 px-5 py-2.5 text-sm text-canopy hover:border-canopy"
          >
            View my orders
          </Link>
        )}
      </div>
    </div>
  );
}
