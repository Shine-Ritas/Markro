export type CurrencyOption = {
  code: string;
  label: string;
};

/** Curated ISO 4217 codes for event currency selection. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "THB", label: "Thai Baht (THB)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "MYR", label: "Malaysian Ringgit (MYR)" },
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
  { code: "PHP", label: "Philippine Peso (PHP)" },
  { code: "VND", label: "Vietnamese Dong (VND)" },
  { code: "CNY", label: "Chinese Yuan (CNY)" },
  { code: "KRW", label: "South Korean Won (KRW)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "HKD", label: "Hong Kong Dollar (HKD)" },
  { code: "INR", label: "Indian Rupee (INR)" },
];

export const CURRENCY_CODES = CURRENCY_OPTIONS.map((c) => c.code);
