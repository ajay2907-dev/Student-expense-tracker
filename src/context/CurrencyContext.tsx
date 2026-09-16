import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  FALLBACK_INR_RATES,
  normalizeCurrencyCode,
  getCurrencyInfo,
  convertAmount,
  formatCurrencyAmount,
} from '../lib/exchangeRates';

interface CurrencyContextType {
  preferredCurrencyCode: string;
  preferredCurrencySymbol: string;
  currencyInfo: CurrencyInfo;
  rates: Record<string, number>;
  rate: number; // 1 INR in preferred currency
  inrPerUnit: number; // 1 preferred currency unit in INR
  baseCurrency: string;
  availableCurrencies: CurrencyInfo[];
  convert: (amountInBase: number) => number;
  convertToBase: (amountInPreferred: number) => number;
  format: (amountInBase: number, options?: { showCode?: boolean; maximumFractionDigits?: number }) => string;
  formatRaw: (amountAlreadyConverted: number, options?: { showCode?: boolean; maximumFractionDigits?: number }) => string;
  setCurrency: (currencyCodeOrSymbol: string) => Promise<void>;
  refreshRates: () => Promise<void>;
  isLoading: boolean;
  lastUpdated: string;
  rateSource: 'live' | 'cached' | 'fallback';
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

interface CurrencyProviderProps {
  children: React.ReactNode;
  userCurrency?: string;
  onUpdateUserSettings?: (settings: { currency: string }) => Promise<void>;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
  userCurrency,
  onUpdateUserSettings,
}) => {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const cached = localStorage.getItem('student_tracker_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.rates) return parsed.rates;
      }
    } catch {}
    return FALLBACK_INR_RATES;
  });

  const [activeCode, setActiveCode] = useState<string>(() => {
    const initial = userCurrency || localStorage.getItem('student_tracker_currency') || 'INR';
    return normalizeCurrencyCode(initial);
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live standard base');
  const [rateSource, setRateSource] = useState<'live' | 'cached' | 'fallback'>('fallback');

  // Sync if userCurrency prop changes from outside
  useEffect(() => {
    if (userCurrency) {
      const normalized = normalizeCurrencyCode(userCurrency);
      setActiveCode(normalized);
      localStorage.setItem('student_tracker_currency', normalized);
    }
  }, [userCurrency]);

  // Fetch real-time exchange rates from server proxy
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/exchange-rates?base=INR');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const merged = { ...FALLBACK_INR_RATES, ...data.rates };
          setRates(merged);
          setRateSource(data.source || 'live');
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          localStorage.setItem(
            'student_tracker_rates',
            JSON.stringify({ rates: merged, timestamp: Date.now(), source: data.source })
          );
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch real-time exchange rates, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = useCallback(
    async (codeOrSymbol: string) => {
      const normalized = normalizeCurrencyCode(codeOrSymbol);
      setActiveCode(normalized);
      localStorage.setItem('student_tracker_currency', normalized);
      if (onUpdateUserSettings) {
        try {
          await onUpdateUserSettings({ currency: normalized });
        } catch (e) {
          console.warn('Failed to persist user currency setting to server:', e);
        }
      }
    },
    [onUpdateUserSettings]
  );

  const currencyInfo = useMemo(() => getCurrencyInfo(activeCode), [activeCode]);

  // Rate: 1 INR = X target currency
  const currentRate = useMemo(() => {
    return rates[activeCode] ?? FALLBACK_INR_RATES[activeCode] ?? 1;
  }, [rates, activeCode]);

  // Inr per unit: 1 target currency = Y INR (e.g. 1 USD = 96 INR)
  const inrPerUnit = useMemo(() => {
    return currentRate > 0 ? 1 / currentRate : 1;
  }, [currentRate]);

  // Convert an amount from base currency (INR) to preferred currency
  const convert = useCallback(
    (amountInBase: number): number => {
      if (amountInBase === 0 || activeCode === BASE_CURRENCY) return amountInBase;
      return convertAmount(amountInBase, BASE_CURRENCY, activeCode, rates);
    },
    [activeCode, rates]
  );

  // Convert an amount from preferred currency back to base currency (INR)
  const convertToBase = useCallback(
    (amountInPreferred: number): number => {
      if (amountInPreferred === 0 || activeCode === BASE_CURRENCY) return amountInPreferred;
      return convertAmount(amountInPreferred, activeCode, BASE_CURRENCY, rates);
    },
    [activeCode, rates]
  );

  // Format an amount (in base currency) by converting and formatting
  const format = useCallback(
    (amountInBase: number, options?: { showCode?: boolean; maximumFractionDigits?: number }): string => {
      const converted = convert(amountInBase);
      return formatCurrencyAmount(converted, activeCode, options);
    },
    [convert, activeCode]
  );

  // Format an amount that is already in preferred currency
  const formatRaw = useCallback(
    (amountAlreadyConverted: number, options?: { showCode?: boolean; maximumFractionDigits?: number }): string => {
      return formatCurrencyAmount(amountAlreadyConverted, activeCode, options);
    },
    [activeCode]
  );

  const value = useMemo<CurrencyContextType>(
    () => ({
      preferredCurrencyCode: currencyInfo.code,
      preferredCurrencySymbol: currencyInfo.symbol,
      currencyInfo,
      rates,
      rate: currentRate,
      inrPerUnit,
      baseCurrency: BASE_CURRENCY,
      availableCurrencies: SUPPORTED_CURRENCIES,
      convert,
      convertToBase,
      format,
      formatRaw,
      setCurrency,
      refreshRates: fetchRates,
      isLoading,
      lastUpdated,
      rateSource,
    }),
    [
      currencyInfo,
      rates,
      currentRate,
      inrPerUnit,
      convert,
      convertToBase,
      format,
      formatRaw,
      setCurrency,
      fetchRates,
      isLoading,
      lastUpdated,
      rateSource,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
