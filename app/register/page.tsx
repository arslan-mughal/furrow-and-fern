import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — Furrow & Fern",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <RegisterForm />
    </div>
  );
}
