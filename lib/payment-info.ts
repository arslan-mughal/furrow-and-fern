export interface PaymentMethodInfo {
  id: "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";
  label: string;
  accountTitle: string;
  /** Bank account number, or wallet (JazzCash/EasyPaisa) phone number. */
  number: string;
  bankName?: string;
  iban?: string;
  instructions: string;
}

function envOrPlaceholder(value: string | undefined, placeholder: string): string {
  return value && value.trim() ? value.trim() : placeholder;
}

/**
 * Real account details live in .env, never in source — same reasoning as
 * EMAIL_FROM. Placeholders below are intentionally obvious ("Set X in
 * .env") rather than fake-looking real numbers, so an unconfigured store
 * can't accidentally look live.
 */
export function getPaymentMethods(): PaymentMethodInfo[] {
  return [
    {
      id: "BANK_TRANSFER",
      label: "Bank Transfer",
      accountTitle: envOrPlaceholder(process.env.BANK_ACCOUNT_TITLE, "Set BANK_ACCOUNT_TITLE in .env"),
      number: envOrPlaceholder(process.env.BANK_ACCOUNT_NUMBER, "Set BANK_ACCOUNT_NUMBER in .env"),
      bankName: envOrPlaceholder(process.env.BANK_NAME, "Set BANK_NAME in .env"),
      iban: process.env.BANK_IBAN?.trim() || undefined,
      instructions:
        "Transfer the order total to this account via online banking, ATM, or a branch deposit. Then enter your bank's transaction reference number below.",
    },
    {
      id: "JAZZCASH",
      label: "JazzCash",
      accountTitle: envOrPlaceholder(process.env.JAZZCASH_ACCOUNT_TITLE, "Set JAZZCASH_ACCOUNT_TITLE in .env"),
      number: envOrPlaceholder(process.env.JAZZCASH_NUMBER, "Set JAZZCASH_NUMBER in .env"),
      instructions:
        "Send the order total to this JazzCash number, then enter the Transaction ID (TID) from your confirmation SMS below.",
    },
    {
      id: "EASYPAISA",
      label: "EasyPaisa",
      accountTitle: envOrPlaceholder(process.env.EASYPAISA_ACCOUNT_TITLE, "Set EASYPAISA_ACCOUNT_TITLE in .env"),
      number: envOrPlaceholder(process.env.EASYPAISA_NUMBER, "Set EASYPAISA_NUMBER in .env"),
      instructions:
        "Send the order total to this EasyPaisa number, then enter the Transaction ID from your confirmation SMS below.",
    },
  ];
}

export function getPaymentMethod(id: string): PaymentMethodInfo | undefined {
  return getPaymentMethods().find((method) => method.id === id);
}
