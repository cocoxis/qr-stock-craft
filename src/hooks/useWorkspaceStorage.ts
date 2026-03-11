import { useState, useEffect } from 'react';

/**
 * Like useLocalStorage but scoped to the active workspace via a prefixed key.
 */
export function useWorkspaceStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    // Re-read when key changes (workspace switch)
    try {
      const item = localStorage.getItem(key);
      setValue(item ? JSON.parse(item) : initialValue);
    } catch {
      setValue(initialValue);
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
