import { useEffect, useState } from 'react';

// Drop-in replacement for useState that mirrors the value to localStorage.
// Reads the stored value on mount (falling back to `initial` on parse error
// or missing key) and writes on every change.
const usePersistentState = (key, initial) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / serialisation errors
    }
  }, [key, value]);

  return [value, setValue];
};

export default usePersistentState;
