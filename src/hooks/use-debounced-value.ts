"use client";

import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para búsquedas y inputs que disparan llamadas a la API
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
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
}

/**
 * Hook para debounce de callbacks
 * Útil para funciones que se ejecutan frecuentemente
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);

  return debouncedCallback;
}

/**
 * Hook para throttle de valores
 * Útil para eventos que se disparan muy frecuentemente (scroll, resize)
 */
export function useThrottledValue<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdated >= interval) {
      setThrottledValue(value);
      setLastUpdated(now);
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        setLastUpdated(Date.now());
      }, interval - (now - lastUpdated));

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval, lastUpdated]);

  return throttledValue;
}
