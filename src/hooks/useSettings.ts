import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  hiddenTabs: string[]; // array of route paths to hide
}

const SETTINGS_KEY = 'app-settings';

const defaultSettings: AppSettings = {
  hiddenTabs: [],
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleTab = useCallback((path: string) => {
    setSettingsState(prev => {
      const hidden = prev.hiddenTabs.includes(path)
        ? prev.hiddenTabs.filter(p => p !== path)
        : [...prev.hiddenTabs, path];
      return { ...prev, hiddenTabs: hidden };
    });
  }, []);

  return { settings, setSettings, toggleTab };
}
