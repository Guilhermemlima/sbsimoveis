'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings';

const SettingsContext = createContext<AppSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: AppSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): AppSettings {
  return useContext(SettingsContext);
}
