import { COUNTRIES } from "@/lib/address";

interface AddressFormShellProps {
  initial?: {
    label: string;
    firstName: string;
    lastName: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefaultBilling: boolean;
    isDefaultShipping: boolean;
  };
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}

const inputClass =
  "mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy";

export function AddressFormShell({ initial, action, submitLabel }: AddressFormShellProps) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="label" className="text-xs text-loam/70">
          Label (optional, e.g. "Home")
        </label>
        <input
          id="label"
          name="label"
          defaultValue={initial?.label}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-xs text-loam/70">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            defaultValue={initial?.firstName}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="text-xs text-loam/70">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            defaultValue={initial?.lastName}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="line1" className="text-xs text-loam/70">
          Address line 1
        </label>
        <input
          id="line1"
          name="line1"
          required
          defaultValue={initial?.line1}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="line2" className="text-xs text-loam/70">
          Address line 2 (optional)
        </label>
        <input
          id="line2"
          name="line2"
          defaultValue={initial?.line2}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="text-xs text-loam/70">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            defaultValue={initial?.city}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="state" className="text-xs text-loam/70">
            State / Province
          </label>
          <input
            id="state"
            name="state"
            required
            defaultValue={initial?.state}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="postalCode" className="text-xs text-loam/70">
            Postal code
          </label>
          <input
            id="postalCode"
            name="postalCode"
            required
            defaultValue={initial?.postalCode}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="country" className="text-xs text-loam/70">
            Country
          </label>
          <select
            id="country"
            name="country"
            defaultValue={initial?.country ?? "PK"}
            className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="text-xs text-loam/70">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial?.phone}
          className={inputClass}
        />
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2 text-sm text-loam">
          <input
            type="checkbox"
            name="isDefaultBilling"
            defaultChecked={initial?.isDefaultBilling}
            className="h-4 w-4 rounded border-canopy/30"
          />
          Use as default billing address
        </label>
        <label className="flex items-center gap-2 text-sm text-loam">
          <input
            type="checkbox"
            name="isDefaultShipping"
            defaultChecked={initial?.isDefaultShipping}
            className="h-4 w-4 rounded border-canopy/30"
          />
          Use as default shipping address
        </label>
      </div>

      <button
        type="submit"
        className="rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
      >
        {submitLabel}
      </button>
    </form>
  );
}
