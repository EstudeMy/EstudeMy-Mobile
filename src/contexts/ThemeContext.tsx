import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import api from '../services/api';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  isDark: boolean;
}

const darkColors: ThemeColors = {
  background: '#11111f',
  card: '#2D2D44',
  cardSecondary: '#1E1E2F',
  text: '#ffffff',
  textSecondary: '#E2E8F0',
  textMuted: '#9CA3AF',
  border: '#1b1b1b',
  inputBg: '#1E1E2F',
  primary: '#4F46E5',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  isDark: true,
};

const lightColors: ThemeColors = {
  background: '#F3F4F6',
  card: '#FFFFFF',
  cardSecondary: '#E5E7EB',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  border: '#1b1b1b',
  inputBg: '#F9FAFB',
  primary: '#4F46E5',
  accent: '#D97706',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  isDark: false,
};

interface ThemeContextType {
  theme: ActiveTheme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference, saveToBackend?: boolean) => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  // Carrega a preferência de tema salva inicialmente
  useEffect(() => {
    const loadTheme = async () => {
      // 1. Se logado e possui tema salvo no banco
      if (user?.tema && (user.tema === 'light' || user.tema === 'dark')) {
        setThemePreferenceState(user.tema as ThemePreference);
        return;
      }

      // 2. Se não, tenta recuperar do SecureStore
      try {
        const saved = await SecureStore.getItemAsync('app_theme_preference');
        if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
          setThemePreferenceState(saved as ThemePreference);
        }
      } catch (e) {
        console.error('Erro ao carregar tema local:', e);
      }
    };

    loadTheme();
  }, [user?.tema]);

  // Determina o tema ativo
  const activeTheme: ActiveTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemScheme]);

  const colors = useMemo(() => {
    return activeTheme === 'dark' ? darkColors : lightColors;
  }, [activeTheme]);

  const setThemePreference = async (pref: ThemePreference, saveToBackend: boolean = true) => {
    setThemePreferenceState(pref);

    try {
      await SecureStore.setItemAsync('app_theme_preference', pref);
    } catch (e) {
      console.error('Erro ao salvar tema no storage:', e);
    }

    if (saveToBackend && isAuthenticated && user) {
      const backendTema = pref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : pref;
      try {
        await api.put('/api/users/tema', { tema: backendTema });
        await refreshUser();
      } catch (error) {
        console.error('Erro ao sincronizar tema com o backend:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        isDark: activeTheme === 'dark',
        themePreference,
        setThemePreference,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
