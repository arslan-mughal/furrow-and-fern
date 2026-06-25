import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutReview } from "@/components/CheckoutReview";
import { getPaymentMethods } from "@/lib/payment-info";
import type { AddressInput } from "@/lib/address";

export const metadata: Metadata = {
  title: "Checkout — Furrow & Fern",
};

export default async function CheckoutPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const paymentMethods = getPaymentMethods();

  let savedAddresses: Awaited<ReturnType<typeof prisma.address.findMany>> = [];
  let defaultBilling: AddressInput | null = null;
  let defaultShipping: AddressInput | null = null;

  if (session?.user) {
    savedAddresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const billing = savedAddresses.find((a) => a.isDefaultBilling);
    const shipping = savedAddresses.find((a) => a.isDefaultShipping);

    if (billing) {
      defaultBilling = {
        firstName: billing.firstName,
        lastName: billing.lastName,
        line1: billing.line1,
        line2: billing.line2 ?? "",
        city: billing.city,
        state: billing.state,
        postalCode: billing.postalCode,
        country: billing.country,
        phone: billing.phone ?? "",
      };
    }

    if (shipping) {
      defaultShipping = {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        line1: shipping.line1,
        line2: shipping.line2 ?? "",
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone ?? "",
      };
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-canopy">Checkout</h1>
      <div className="mt-8">
        <CheckoutReview
          savedAddresses={savedAddresses}
          defaultBilling={defaultBilling}
          defaultShipping={defaultShipping}
          userEmail={session?.user?.email ?? null}
          paymentMethods={paymentMethods}
        />
      </div>
    </div>
  );
}
