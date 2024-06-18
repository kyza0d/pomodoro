"use client"

import React, { ReactNode, createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem } from '@/utils/indexeddb';

interface Session {
  type: string;
  title: string;
  duration: number;
}

interface Colors {
  accent: string;
  base: string;
  'base-darker': string;
  border: string;
  foreground: string;
  header: string;
  subtitle: string;
}

interface Settings {
  'font-name': string;
  'font-size': number;
  'theme': 'light' | 'dark' | 'system';
  'background-url': string;
  'background-opacity': number;
  'background-blur': number;
  'notify-breaks': boolean;
  'notify-focus': boolean;
  sessions: Session[];
  colors: Colors;
}

const defaultSettings: Settings = {
  'font-name': 'sans-serif',
  'font-size': 16,
  'theme': 'system',
  'background-url': "",
  'background-opacity': 0.25,
  'background-blur': 1,
  'notify-breaks': true,
  'notify-focus': false,
  sessions: [
    { type: 'Focus', title: "Focus", duration: 30 },
    { type: 'Break', title: "Break", duration: 15 },
    { type: 'Focus', title: "Focus", duration: 45 },
  ],
  colors: {
    base: '#0F172A',
    'base-darker': '#090e19',
    accent: '#3B82F6',
    header: '#e0ebf4',
    subtitle: '#a0b7e5',
    foreground: '#abc3f4',
    border: '#2e3a56',
  },
};

type SettingsAction =
  | { type: 'SET_PENDING_SETTING'; name: string; value: any }
  | { type: 'SAVE_SETTINGS'; settings: Settings }
  | { type: 'LOAD_SETTINGS'; settings: Settings };

interface SettingsContextValue {
  settings: Settings;
  pendingSettings: Settings;
  setPendingSetting: (name: string, value: any) => void;
  saveSettings: () => void;
  updateSetting: (name: string, value: any) => void;
  updateThemeSetting: (theme: string, themeSettings: Colors) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const settingsReducer = (state: { settings: Settings; pendingSettings: Settings }, action: SettingsAction) => {
  switch (action.type) {
    case 'SET_PENDING_SETTING':
      const newSettings = {
        ...state,
        pendingSettings: {
          ...state.pendingSettings,
          [action.name]: action.value,
        },
      };
      if (action.name in state.pendingSettings.colors) {
        newSettings.pendingSettings.colors[action.name] = action.value;
      }
      return newSettings;
    case 'SAVE_SETTINGS':
      return {
        ...state,
        settings: action.settings,
        pendingSettings: action.settings,
      };
    case 'LOAD_SETTINGS':
      return {
        ...state,
        settings: action.settings,
        pendingSettings: action.settings,
      };
    default:
      return state;
  }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    settings: defaultSettings,
    pendingSettings: defaultSettings,
  });

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getItem('settings');
      if (savedSettings) {
        dispatch({ type: 'LOAD_SETTINGS', settings: savedSettings });
      }
    };

    loadSettings();
  }, []);

  const setPendingSetting = useCallback((name: string, value: any) => {
    dispatch({ type: 'SET_PENDING_SETTING', name, value });
  }, []);

  const saveSettings = useCallback(async () => {
    const { pendingSettings } = state;
    dispatch({ type: 'SAVE_SETTINGS', settings: pendingSettings });
    await setItem('settings', pendingSettings);
  }, [state]);

  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedSaveSettings = useMemo(() => debounce(async (newSettings: Settings) => {
    dispatch({ type: 'SAVE_SETTINGS', settings: newSettings });
    await setItem('settings', newSettings);
  }, 300), []);

  const updateSetting = useCallback((name: string, value: any) => {
    setPendingSetting(name, value);

    const newPendingSettings = {
      ...state.pendingSettings,
      [name]: value,
    };

    debouncedSaveSettings(newPendingSettings);
  }, [setPendingSetting, state.pendingSettings, debouncedSaveSettings]);

  const updateThemeSetting = useCallback((theme: string, themeSettings: Colors) => {
    Object.keys(themeSettings).forEach(key => {
      const cssVar = `--${key}`;
      document.documentElement.style.setProperty(cssVar, themeSettings[key]);
    });

    const newSettings = {
      ...state.pendingSettings,
      colors: themeSettings
    };

    dispatch({ type: 'SAVE_SETTINGS', settings: newSettings });
    setItem('settings', newSettings);
  }, [state.pendingSettings]);

  const value = useMemo(() => ({
    settings: state.settings,
    pendingSettings: state.pendingSettings,
    setPendingSetting,
    saveSettings,
    updateSetting,
    updateThemeSetting,
  }), [state, setPendingSetting, saveSettings, updateSetting, updateThemeSetting]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
