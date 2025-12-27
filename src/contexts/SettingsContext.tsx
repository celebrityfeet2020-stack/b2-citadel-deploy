'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  // Commander API设置
  commanderApiUrl: string;
  commanderApiKey: string;
  setCommanderApiUrl: (url: string) => void;
  setCommanderApiKey: (key: string) => void;
  
  // 其他设置
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const defaultSettings: SettingsContextType = {
  commanderApiUrl: 'http://43.160.207.239:22888/api/b2/commander',
  commanderApiKey: 'b2-commander-default',
  setCommanderApiUrl: () => {},
  setCommanderApiKey: () => {},
  theme: 'dark',
  setTheme: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [commanderApiUrl, setCommanderApiUrl] = useState(defaultSettings.commanderApiUrl);
  const [commanderApiKey, setCommanderApiKey] = useState(defaultSettings.commanderApiKey);
  const [theme, setTheme] = useState<'dark' | 'light'>(defaultSettings.theme);

  // 从localStorage加载设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('b2_commander_api_url');
      const savedKey = localStorage.getItem('b2_commander_api_key');
      const savedTheme = localStorage.getItem('b2_theme') as 'dark' | 'light';
      
      if (savedUrl) setCommanderApiUrl(savedUrl);
      if (savedKey) setCommanderApiKey(savedKey);
      if (savedTheme) setTheme(savedTheme);
    }
  }, []);

  // 保存设置到localStorage
  const handleSetCommanderApiUrl = (url: string) => {
    setCommanderApiUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('b2_commander_api_url', url);
    }
  };

  const handleSetCommanderApiKey = (key: string) => {
    setCommanderApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('b2_commander_api_key', key);
    }
  };

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('b2_theme', newTheme);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        commanderApiUrl,
        commanderApiKey,
        setCommanderApiUrl: handleSetCommanderApiUrl,
        setCommanderApiKey: handleSetCommanderApiKey,
        theme,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
