"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { AddressFields } from "@/components/AddressFields";
import type { AddressInput } from "@/lib/address";
import type { PaymentMethodInfo } from "@/lib/payment-info";

const EMPTY_ADDRESS: AddressInput = {
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "PK",
  phone: "",
};

function AddressSummary({ address }: { address: AddressInput }) {
  return (
    <div className="rounded-card border border-canopy/20 p-3 text-sm text-loam">
      <p className="font-medium text-canopy">
        {address.firstName} {address.lastName}
      </p>
      <p>{address.line1}</p>
      {address.line2 && <p>{address.line2}</p>}
      <p>
        {address.city}, {address.state} {address.postalCode}
      </p>
      {address.phone && <p>{address.phone}</p>}
    </div>
  );
}

export function CheckoutReview({
  savedAddresses,
  defaultBilling,
  defaultShipping,
  userEmail,
}: {
  savedAddresses: {
    id: string;
    label: string | null;
    firstName: string;
    lastName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
    isDefaultBilling: boolean;
    isDefaultShipping: boolean;
  }[];
  defaultBilling: AddressInput | null;
  defaultShipping: AddressInput | null;
  userEmail: string | null;
  paymentMethods: PaymentMethodInfo[];
}) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [step, setStep] = useState<"addresses" | "payment">("addresses");
  const [email, setEmail] = useState(userEmail ?? "");
  const [billing, setBilling] = useState<AddressInput>(defaultBilling ?? EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<AddressInput>(defaultShipping ?? EMPTY_ADDRESS);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [selectedSavedBilling, setSelectedSavedBilling] = useState<string>("new");
  const [selectedSavedShipping, setSelectedSavedShipping] = useState<string>("new");
  const [paymentMethod, setPaymentMethod] = useState<
    "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA"
  >("BANK_TRANSFER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBilling = useCallback(
    (field: keyof AddressInput, value: string) =>
      setBilling((prev) => ({ ...prev, [field]: value })),
    []
  );
  const updateShipping = useCallback(
    (field: keyof AddressInput, value: string) =>
      setShipping((prev) => ({ ...prev, [field]: value })),
    []
  );

  function applySavedAddress(
    addressId: string,
    setter: (a: AddressInput) => void,
    whichSaved: "billing" | "shipping"
  ) {
    if (addressId === "new") return;
    const saved = savedAddresses.find((a) => a.id === addressId);
    if (!saved) return;
    setter({
      firstName: saved.firstName,
      lastName: saved.lastName,
      line1: saved.line1,
      line2: saved.line2 ?? "",
      city: saved.city,
      state: saved.state,
      postalCode: saved.postalCode,
      country: saved.country,
      phone: saved.phone ?? "",
    });
    if (whichSaved === "billing") setSelectedSavedBilling(addressId);
    else setSelectedSavedShipping(addressId);
  }

  async function handlePlaceOrder() {
    setLoading(true);
    setError(null);

    const shippingAddress = sameAsBilling ? billing : shipping;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          email,
          billingAddress: billing,
          shippingAddress,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/checkout/payment/${data.orderId}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl text-canopy">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* ── Left column ── */}
      <div className="lg:col-span-2 space-y-8">

        {/* Contact */}
        <section className="seed-packet p-6">
          <h2 className="font-display text-lg text-canopy">Contact</h2>
          {!userEmail && (
            <div className="mt-3">
              <label htmlFor="checkout-email" className="text-xs text-loam/70">
                Email address
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy"
              />
            </div>
          )}
          {userEmail && (
            <p className="mt-2 text-sm text-loam/70">
              {userEmail} ·{" "}
              <Link href="/account" className="text-canopy underline">
                not you?
              </Link>
            </p>
          )}
        </section>

        {/* Billing address */}
        <section className="seed-packet p-6">
          <h2 className="font-display text-lg text-canopy">Billing address</h2>

          {savedAddresses.length > 0 && (
            <div className="mt-3">
              <label htmlFor="saved-billing" className="text-xs text-loam/70">
                Saved addresses
              </label>
              <select
                id="saved-billing"
                value={selectedSavedBilling}
                onChange={(e) =>
                  applySavedAddress(e.target.value, setBilling, "billing")
                }
                className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
              >
                <option value="new">Enter a new address</option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label} — ` : ""}
                    {a.firstName} {a.lastName}, {a.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSavedBilling !== "new" ? (
            <div className="mt-3">
              <AddressSummary address={billing} />
              <button
                type="button"
                onClick={() => setSelectedSavedBilling("new")}
                className="mt-2 text-xs text-clay hover:underline"
              >
                Enter a different address
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <AddressFields
                idPrefix="billing"
                values={billing}
                onChange={updateBilling}
              />
            </div>
          )}
        </section>

        {/* Shipping address */}
        <section className="seed-packet p-6">
          <h2 className="font-display text-lg text-canopy">Shipping address</h2>

          <label className="mt-3 flex items-center gap-2 text-sm text-loam">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="h-4 w-4 rounded border-canopy/30"
            />
            Same as billing address
          </label>

          {!sameAsBilling && (
            <>
              {savedAddresses.length > 0 && (
                <div className="mt-3">
                  <label htmlFor="saved-shipping" className="text-xs text-loam/70">
                    Saved addresses
                  </label>
                  <select
                    id="saved-shipping"
                    value={selectedSavedShipping}
                    onChange={(e) =>
                      applySavedAddress(e.target.value, setShipping, "shipping")
                    }
                    className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
                  >
                    <option value="new">Enter a new address</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label ? `${a.label} — ` : ""}
                        {a.firstName} {a.lastName}, {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSavedShipping !== "new" ? (
                <div className="mt-3">
                  <AddressSummary address={shipping} />
                  <button
                    type="button"
                    onClick={() => setSelectedSavedShipping("new")}
                    className="mt-2 text-xs text-clay hover:underline"
                  >
                    Enter a different address
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <AddressFields
                    idPrefix="shipping"
                    values={shipping}
                    onChange={updateShipping}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* Payment method */}
        <section className="seed-packet p-6">
          <h2 className="font-display text-lg text-canopy">Payment method</h2>
          <p className="mt-1 text-xs text-loam/60">
            We&apos;ll show you the account details for your chosen method on the next step.
          </p>
          <div className="mt-3 space-y-2">
            {(
              [
                { id: "BANK_TRANSFER", label: "Bank Transfer" },
                { id: "JAZZCASH", label: "JazzCash" },
                { id: "EASYPAISA", label: "EasyPaisa" },
              ] as const
            ).map((method) => (
              <label key={method.id} className="flex items-center gap-3 text-sm text-loam">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="h-4 w-4"
                />
                {method.label}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* ── Right column: order summary ── */}
      <div className="seed-packet h-fit p-6">
        <h2 className="font-display text-lg text-canopy">Order summary</h2>

        <ul className="mt-4 divide-y divide-canopy/10">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-3 py-3 text-sm">
              <img
                src={item.image}
                alt={item.name}
                className="h-12 w-12 shrink-0 rounded-sm border border-canopy/10 object-cover"
              />
              <div className="flex-1">
                <p className="text-canopy">{item.name}</p>
                <p className="text-xs text-loam/60">× {item.quantity}</p>
              </div>
              <span className="font-mono text-loam">
                Rs {(item.price * item.quantity).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-canopy/10 pt-4 text-sm">
          <span className="text-loam/70">Total</span>
          <span className="font-mono font-semibold text-canopy">
            Rs {subtotal.toLocaleString()}
          </span>
        </div>

        {error && (
          <p className="mt-4 rounded-card bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
        )}

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={loading || !email}
          className="mt-5 w-full rounded-card bg-marigold px-4 py-2.5 text-sm font-semibold text-loam transition-colors hover:bg-canopy hover:text-parchment disabled:opacity-60"
        >
          {loading ? "Placing order…" : "Place order & see payment details"}
        </button>
        <p className="mt-3 text-center text-xs text-loam/50">
          You&apos;ll send payment manually on the next page.
        </p>
      </div>
    </div>
  );
}
