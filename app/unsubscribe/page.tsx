import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { confirmUnsubscribe } from "./actions";

export const metadata: Metadata = {
  title: "Unsubscribe — Furrow & Fern",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const subscriber = token
    ? await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } })
    : null;

  if (!subscriber) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="stamp-badge text-clay">Newsletter</p>
        <h1 className="mt-2 font-display text-2xl text-canopy">That link isn&apos;t valid.</h1>
        <p className="mt-2 text-sm text-loam/70">It may be incomplete, or already used.</p>
        <Link href="/" className="mt-6 inline-block text-canopy underline">
          Back to the store
        </Link>
      </div>
    );
  }

  if (subscriber.unsubscribedAt) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="stamp-badge text-clay">Newsletter</p>
        <h1 className="mt-2 font-display text-2xl text-canopy">You&apos;re unsubscribed.</h1>
        <p className="mt-2 text-sm text-loam/70">
          {subscriber.email} won&apos;t receive any more newsletter emails. Changed your mind?
          You can resubscribe any time from the homepage.
        </p>
        <Link href="/" className="mt-6 inline-block text-canopy underline">
          Back to the store
        </Link>
      </div>
    );
  }

  const boundConfirm = confirmUnsubscribe.bind(null, token!);

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <p className="stamp-badge text-clay">Newsletter</p>
      <h1 className="mt-2 font-display text-2xl text-canopy">Unsubscribe {subscriber.email}?</h1>
      <p className="mt-2 text-sm text-loam/70">
        You&apos;ll stop receiving the newsletter. This won&apos;t affect order confirmation or
        shipping emails.
      </p>
      {/*
        Deliberately a confirm step, not an instant unsubscribe-on-load:
        corporate email security scanners (Outlook Safe Links, Proofpoint,
        Mimecast, etc.) prefetch every link in an inbound email to scan it,
        which would silently unsubscribe people who never clicked anything
        if this page mutated on a bare GET.
      */}
      <form action={boundConfirm} className="mt-6">
        <button
          type="submit"
          className="rounded-card bg-clay px-5 py-2.5 text-sm font-medium text-parchment hover:bg-canopy"
        >
          Confirm unsubscribe
        </button>
      </form>
    </div>
  );
}
