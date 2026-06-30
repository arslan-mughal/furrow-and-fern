import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailResult } from "@/components/VerifyEmailResult";

export const metadata: Metadata = {
  title: "Verify Email — Furrow & Fern",
};

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Suspense fallback={null}>
        <VerifyEmailResult />
      </Suspense>
    </div>
  );
}
