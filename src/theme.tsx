import { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useUIStore } from './store/uiStore';

export interface Palette {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primarySoft: string;
  accent: string;
  border: string;
  borderAlt: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  gold: string;
  goldSoft: string;
  surface: string;
}

export const palettes: { light: Palette; dark: Palette } = {
  light: {
    background: '#ffffff',
    card: '#f8fafc',
    cardAlt: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    accent: '#7c3aed',
    border: '#e2e8f0',
    borderAlt: '#f1f5f9',
    success: '#16a34a',
    successSoft: '#dcfce7',
    warning: '#d97706',
    warningSoft: '#ffedd5',
    danger: '#dc2626',
    dangerSoft: '#fee2e2',
    gold: '#d4a72c',
    goldSoft: '#fef9e7',
    surface: '#ffffff',
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    cardAlt: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    primary: '#60a5fa',
    primarySoft: '#1e3a8a',
    accent: '#a78bfa',
    border: '#334155',
    borderAlt: '#475569',
    success: '#4ade80',
    successSoft: '#14532d',
    warning: '#fb9233',
    warningSoft: '#7c2d12',
    danger: '#f87171',
    dangerSoft: '#7f1d1d',
    gold: '#f5d46e',
    goldSoft: '#422006',
    surface: '#111827',
  },
};

interface ThemeState {
  colors: Palette;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeState>({ colors: palettes.light, isDark: false });

export function useTheme() {
  return useContext(ThemeContext).colors;
}

export function useIsDark() {
  return useContext(ThemeContext).isDark;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const cs = useColorScheme();
  const override = useUIStore((s) => s.themeOverride);
  const isDark = override === 'dark' || (override === null && cs === 'dark');
  const colors = (override ?? cs ?? 'light') === 'dark' ? palettes.dark : palettes.light;
  return (
    <ThemeContext.Provider value={{ colors, isDark }}>{children}</ThemeContext.Provider>
  );
}
