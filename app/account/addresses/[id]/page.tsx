import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressFormShell } from "@/components/AddressFormShell";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { updateAddress, deleteAddress } from "../actions";

export const metadata: Metadata = {
  title: "Edit Address — Furrow & Fern",
};

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.user.id) notFound();

  const boundUpdate = updateAddress.bind(null, address.id);
  const boundDelete = deleteAddress.bind(null, address.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/account/addresses" className="text-xs text-clay hover:underline">
        ← Back to addresses
      </Link>
      <h1 className="mt-3 font-display text-3xl text-canopy">Edit address</h1>

      <div className="mt-6">
        <AddressFormShell
          action={boundUpdate}
          submitLabel="Save changes"
          initial={{
            label: address.label ?? "",
            firstName: address.firstName,
            lastName: address.lastName,
            line1: address.line1,
            line2: address.line2 ?? "",
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone ?? "",
            isDefaultBilling: address.isDefaultBilling,
            isDefaultShipping: address.isDefaultShipping,
          }}
        />
      </div>

      <div className="mt-8 border-t border-clay/20 pt-6">
        <form action={boundDelete}>
          <ConfirmSubmitButton
            confirmMessage="Delete this address? This can't be undone."
            className="text-sm text-clay hover:underline"
          >
            Delete this address
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
