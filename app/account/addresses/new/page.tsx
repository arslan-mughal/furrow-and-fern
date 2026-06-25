import type { Metadata } from "next";
import Link from "next/link";
import { AddressFormShell } from "@/components/AddressFormShell";
import { createAddress } from "../actions";

export const metadata: Metadata = {
  title: "Add Address — Furrow & Fern",
};

export default function NewAddressPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/account/addresses" className="text-xs text-clay hover:underline">
        ← Back to addresses
      </Link>
      <h1 className="mt-3 font-display text-3xl text-canopy">Add a new address</h1>
      <div className="mt-6">
        <AddressFormShell action={createAddress} submitLabel="Save address" />
      </div>
    </div>
  );
}
