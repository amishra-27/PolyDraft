'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevSettings {
  showDummyData: boolean;
  showDebugInfo: boolean;
  highlightTouchTargets: boolean;
}

interface DevSettingsContextType {
  settings: DevSettings;
  updateSetting: <K extends keyof DevSettings>(key: K, value: DevSettings[K]) => void;
  toggleSetting: (key: keyof DevSettings) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DevSettings = {
  showDummyData: true,
  showDebugInfo: false,
  highlightTouchTargets: false,
};

export function DevSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DevSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('polydraft-dev-settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Loaded dev settings from localStorage:', parsed);
          setSettings(parsed);
        } catch (e) {
          console.error('Failed to parse dev settings:', e);
        }
      }
    }
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('polydraft-dev-settings', JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = <K extends keyof DevSettings>(key: K, value: DevSettings[K]) => {
    console.log('Updating dev setting:', key, 'from', value, 'to', !value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: keyof DevSettings) => {
    console.log('Toggling dev setting:', key, 'from', settings[key], 'to', !settings[key]);
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DevSettingsContext.Provider value={{ settings, updateSetting, toggleSetting }}>
      {children}
    </DevSettingsContext.Provider>
  );
}

export function useDevSettings() {
  const context = useContext(DevSettingsContext);
  if (!context) {
    throw new Error('useDevSettings must be used within DevSettingsProvider');
  }
  return context;
}
