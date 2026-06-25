"use client";

import type { ChangeEvent } from "react";
import { COUNTRIES, type AddressInput } from "@/lib/address";

export function AddressFields({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: AddressInput;
  onChange: (field: keyof AddressInput, value: string) => void;
}) {
  function textProps(name: keyof AddressInput) {
    return {
      id: `${idPrefix}-${name}`,
      value: values[name] ?? "",
      onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value),
    };
  }

  const inputClass =
    "mt-1 w-full rounded-card border border-canopy/20 px-3 py-2 text-sm text-loam focus:border-canopy";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={`${idPrefix}-firstName`} className="text-xs text-loam/70">
          First name
        </label>
        <input {...textProps("firstName")} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-lastName`} className="text-xs text-loam/70">
          Last name
        </label>
        <input {...textProps("lastName")} required className={inputClass} />
      </div>
      <div className="col-span-2">
        <label htmlFor={`${idPrefix}-line1`} className="text-xs text-loam/70">
          Address line 1
        </label>
        <input {...textProps("line1")} required className={inputClass} />
      </div>
      <div className="col-span-2">
        <label htmlFor={`${idPrefix}-line2`} className="text-xs text-loam/70">
          Address line 2 (optional)
        </label>
        <input {...textProps("line2")} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-city`} className="text-xs text-loam/70">
          City
        </label>
        <input {...textProps("city")} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-state`} className="text-xs text-loam/70">
          State / Province
        </label>
        <input {...textProps("state")} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-postalCode`} className="text-xs text-loam/70">
          Postal code
        </label>
        <input {...textProps("postalCode")} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-country`} className="text-xs text-loam/70">
          Country
        </label>
        <select
          id={`${idPrefix}-country`}
          value={values.country || "PK"}
          onChange={(event) => onChange("country", event.target.value)}
          className="mt-1 w-full rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam focus:border-canopy"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label htmlFor={`${idPrefix}-phone`} className="text-xs text-loam/70">
          Phone (optional)
        </label>
        <input {...textProps("phone")} type="tel" className={inputClass} />
      </div>
    </div>
  );
}
