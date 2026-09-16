export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', decimals: 0 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', decimals: 2 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', decimals: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', decimals: 2 },
];

export const BASE_CURRENCY = 'INR';

// Fallback rates relative to 1 INR if offline or network failure
export const FALLBACK_INR_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.01042,
  EUR: 0.00904,
  GBP: 0.00774,
  CAD: 0.01451,
  AUD: 0.01462,
  JPY: 1.6171,
  SGD: 0.01327,
  CHF: 0.00854,
  AED: 0.03826,
  CNY: 0.07021,
  NZD: 0.01809,
};

// Map symbols to standardized currency codes
const SYMBOL_TO_CODE: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  'CA$': 'CAD',
  'A$': 'AUD',
  'S$': 'SGD',
  'CHF': 'CHF',
  'AED': 'AED',
  'NZ$': 'NZD',
};

export function normalizeCurrencyCode(input?: string): string {
  if (!input) return 'INR';
  const trimmed = input.trim();
  if (SYMBOL_TO_CODE[trimmed]) {
    return SYMBOL_TO_CODE[trimmed];
  }
  const upper = trimmed.toUpperCase();
  const matched = SUPPORTED_CURRENCIES.find((c) => c.code === upper);
  return matched ? matched.code : 'INR';
}

export function getCurrencyInfo(codeOrSymbol?: string): CurrencyInfo {
  const code = normalizeCurrencyCode(codeOrSymbol);
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) || {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      flag: '🇮🇳',
      decimals: 2,
    }
  );
}

export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>
): number {
  const from = normalizeCurrencyCode(fromCode);
  const to = normalizeCurrencyCode(toCode);
  if (from === to || amount === 0) return amount;

  // Rates are stored relative to BASE_CURRENCY (INR)
  // 1 INR = rates[CURR]
  const rateFrom = rates[from] ?? FALLBACK_INR_RATES[from] ?? 1;
  const rateTo = rates[to] ?? FALLBACK_INR_RATES[to] ?? 1;

  // Convert from -> INR -> to
  const amountInInr = amount / rateFrom;
  return amountInInr * rateTo;
}

export function formatCurrencyAmount(
  amount: number,
  currencyCodeOrSymbol: string = 'INR',
  options?: {
    showCode?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  const info = getCurrencyInfo(currencyCodeOrSymbol);
  const decimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : info.decimals;

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNum = absAmount.toLocaleString(info.code === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const sign = isNegative ? '-' : '';
  if (options?.showCode && !info.symbol.includes(info.code)) {
    return `${sign}${info.symbol}${formattedNum} ${info.code}`;
  }
  return `${sign}${info.symbol}${formattedNum}`;
}
