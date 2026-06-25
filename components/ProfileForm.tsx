"use client";

import { useState, type FormEvent } from "react";
import { updateProfile } from "@/app/account/actions";

interface ProfileFormProps {
  userId: string;
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    name: string;
    email: string;
  };
}

export function ProfileForm({ userId, initial }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("phone", phone);

    try {
      await updateProfile(userId, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy";

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-xs text-loam/70">
            First name
          </label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="text-xs text-loam/70">
            Last name
          </label>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="text-xs text-loam/70">
          Email
        </label>
        <input
          id="email"
          value={initial.email}
          disabled
          className={`${inputClass} opacity-50`}
        />
        <p className="mt-1 text-xs text-loam/50">
          Email can&apos;t be changed here — it&apos;s tied to your login.
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="text-xs text-loam/70">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-card bg-canopy px-4 py-2 text-sm text-parchment hover:bg-marigold hover:text-loam disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save profile"}
        </button>
        {saved && (
          <span className="stamp-badge text-canopy">Saved ✓</span>
        )}
      </div>
    </form>
  );
}
