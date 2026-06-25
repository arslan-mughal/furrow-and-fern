import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteAddress } from "./actions";

export const metadata: Metadata = {
  title: "Saved Addresses — Furrow & Fern",
};

export default async function AddressesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-canopy">Saved addresses</h1>
        <Link
          href="/account/addresses/new"
          className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam"
        >
          + Add new
        </Link>
      </div>

      {addresses.length === 0 ? (
        <p className="mt-6 text-sm text-loam/70">No saved addresses yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {addresses.map((address) => {
            const boundDelete = deleteAddress.bind(null, address.id);
            return (
              <li key={address.id} className="seed-packet p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-sm text-canopy">
                      {address.label ?? `${address.firstName} ${address.lastName}`}
                    </p>
                    <p className="mt-1 text-xs text-loam/70">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p className="text-xs text-loam/70">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {address.isDefaultBilling && (
                        <span className="stamp-badge rounded-full bg-sage px-2 py-0.5 text-canopy">
                          Default billing
                        </span>
                      )}
                      {address.isDefaultShipping && (
                        <span className="stamp-badge rounded-full bg-sage px-2 py-0.5 text-canopy">
                          Default shipping
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-3 text-xs">
                    <Link href={`/account/addresses/${address.id}`} className="text-canopy hover:underline">
                      Edit
                    </Link>
                    <form action={boundDelete}>
                      <ConfirmSubmitButton
                        confirmMessage="Delete this address?"
                        className="text-clay hover:underline"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/account" className="mt-8 block text-xs text-clay hover:underline">
        ← Back to account
      </Link>
    </div>
  );
}
