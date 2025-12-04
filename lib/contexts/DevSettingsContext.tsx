'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevSettings {
  showDummyData: boolean;
}

interface DevSettingsContextType {
  settings: DevSettings;
  toggleSetting: (key: keyof DevSettings) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DevSettings = {
  showDummyData: false,
};

export function DevSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DevSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('polydraft-dev-settings');
      if (stored) {
        try {
          setSettings(JSON.parse(stored));
        } catch (error) {
          console.warn('Failed to parse dev settings from localStorage:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('polydraft-dev-settings', JSON.stringify(settings));
    }
  }, [settings]);

  const toggleSetting = (key: keyof DevSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <DevSettingsContext.Provider value={{ settings, toggleSetting }}>
      {children}
    </DevSettingsContext.Provider>
  );
}

export function useDevSettings() {
  const context = useContext(DevSettingsContext);
  if (context === undefined) {
    throw new Error('useDevSettings must be used within a DevSettingsProvider');
  }
  return context;
}