import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { getPaymentMethod } from "@/lib/payment-info";
import { submitTransactionId } from "./actions";

export const metadata: Metadata = {
  title: "Complete Your Payment — Furrow & Fern",
};

export default async function PaymentInstructionsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) notFound();

  // Only show instructions while there's nothing to verify yet — once a
  // transaction id is submitted (or an admin has acted), send them to the
  // status page instead of letting them resubmit.
  if (order.status !== "PENDING") {
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  const method = order.paymentMethod ? getPaymentMethod(order.paymentMethod) : undefined;
  const boundSubmit = submitTransactionId.bind(null, order.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="stamp-badge text-clay">Step 2 of 2</p>
      <h1 className="mt-2 font-display text-3xl text-canopy">Complete your payment</h1>
      <p className="mt-2 text-sm text-loam/70">
        Order #{order.id.slice(-8)} — {formatCents(order.totalCents, order.currency)}
      </p>

      {method && (
        <div className="seed-packet mt-8 p-6">
          <h2 className="font-display text-lg text-canopy">{method.label}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {method.bankName && (
              <div className="flex justify-between gap-4">
                <dt className="text-loam/60">Bank</dt>
                <dd className="text-right text-loam">{method.bankName}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-loam/60">Account title</dt>
              <dd className="text-right text-loam">{method.accountTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-loam/60">
                {method.id === "BANK_TRANSFER" ? "Account number" : "Number"}
              </dt>
              <dd className="text-right font-mono text-loam">{method.number}</dd>
            </div>
            {method.iban && (
              <div className="flex justify-between gap-4">
                <dt className="text-loam/60">IBAN</dt>
                <dd className="text-right font-mono text-loam">{method.iban}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs text-loam/60">{method.instructions}</p>
        </div>
      )}

      <form action={boundSubmit} className="seed-packet mt-6 p-6">
        <h2 className="font-display text-lg text-canopy">I&apos;ve sent the payment</h2>
        <div className="mt-3">
          <label htmlFor="transactionId" className="text-xs text-loam/70">
            Transaction ID / reference number
          </label>
          <input
            id="transactionId"
            name="transactionId"
            required
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <div className="mt-3">
          <label htmlFor="note" className="text-xs text-loam/70">
            Note (optional)
          </label>
          <input
            id="note"
            name="note"
            placeholder="e.g. sent from a relative's account"
            className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
          />
        </div>
        <button
          type="submit"
          className="mt-5 w-full rounded-card bg-marigold px-4 py-2.5 text-sm font-semibold text-loam transition-colors hover:bg-canopy hover:text-parchment"
        >
          Submit for verification
        </button>
        <p className="mt-3 text-center text-xs text-loam/50">
          We&apos;ll check this against our account and confirm your order — usually within a
          few hours.
        </p>
      </form>
    </div>
  );
}
