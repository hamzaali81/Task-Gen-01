/**
 * Currency formatting utilities
 * Provides consistent currency display across the application
 */

/**
 * Format a number as currency
 * 
 * @param amount - Numeric amount to format
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  locale = 'en-US',
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency/locale is invalid
    console.error(`Failed to format currency: ${error}`);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Parse currency string to number
 * Removes currency symbols and formatting
 * 
 * @param value - Formatted currency string
 * @returns Numeric value
 * 
 * @example
 * parseCurrency('$1,234.56') // 1234.56
 * parseCurrency('€1.234,56') // 1234.56
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Validate currency code
 * Checks if currency code is valid ISO 4217 format
 * 
 * @param code - Currency code to validate
 * @returns True if valid
 */
export const isValidCurrencyCode = (code: string): boolean => {
  return /^[A-Z]{3}$/.test(code);
};

/**
 * Common currency codes and their symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
};

/**
 * Get currency symbol for a currency code
 * 
 * @param currency - ISO 4217 currency code
 * @returns Currency symbol or code if symbol not found
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};
