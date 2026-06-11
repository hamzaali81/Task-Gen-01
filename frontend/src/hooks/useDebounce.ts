import { useEffect, useState } from 'react';

/**
 * Debounce hook for delaying rapid updates
 * Useful for search inputs and API calls
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 * 
 * @example
 * const searchTerm = useDebounce(inputValue, 500);
 * 
 * useEffect(() => {
 *   // API call with debounced value
 *   fetchSearchResults(searchTerm);
 * }, [searchTerm]);
 */
export const useDebounce = <T>(value: T, delay = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
