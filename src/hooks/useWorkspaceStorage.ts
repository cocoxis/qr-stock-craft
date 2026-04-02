import { useState, useEffect, useCallback } from 'react';

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

  // Persist synchronously so navigate() after setState works
  const setAndPersist = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* quota exceeded */ }
      return resolved;
    });
  }, [key]);

  return [value, setAndPersist] as const;
}
