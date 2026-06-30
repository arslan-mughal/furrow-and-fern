import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — Furrow & Fern",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Suspense is required here: ResetPasswordForm reads the ?token=
          query param via useSearchParams(), which Next.js requires to be
          wrapped in Suspense so the page can still be statically generated. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
