import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Furrow & Fern",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <LoginForm />
    </div>
  );
}
