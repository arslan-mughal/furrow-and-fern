import { z } from "zod";

// Short list on purpose — Pakistan first since that's the only place this
// store ships, plus a handful of likely diaspora/gift-shipping countries.
// Not a full ISO-3166 list; add more as needed.
export const COUNTRIES = [
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
] as const;

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State/Province is required").max(100),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code")
    .default("PK"),
  phone: z.string().trim().max(30).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export function formatAddressLines(address: AddressInput): string[] {
  return [
    `${address.firstName} ${address.lastName}`,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    countryName(address.country),
    address.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));
}
