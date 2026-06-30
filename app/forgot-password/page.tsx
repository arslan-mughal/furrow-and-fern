import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password — Furrow & Fern",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <ForgotPasswordForm />
    </div>
  );
}
