import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import api from '../services/api';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';
export type DaltonismMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type FontScale = 'normal' | 'large' | 'extra-large';

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

// Paleta Padronizada Harmoniosa (WCAG AAA - Alto Contraste e Elegância)
const baseDarkColors: ThemeColors = {
  background: '#0F172A', // Slate 900
  card: '#1E293B',       // Slate 800
  cardSecondary: '#2D3B4F', // Destaque visual secundário limpo
  text: '#FFFFFF',       // 16.5:1 (Branco puro)
  textSecondary: '#F8FAFC', // 15.5:1 (Quase branco nítido)
  textMuted: '#E2E8F0',     // 12.0:1 (Muito legível de longe e de perto)
  border: '#475569',     // Slate 600 (Bordas nítidas)
  inputBg: '#1E293B',
  primary: '#818CF8',    // Indigo 400 (Vibrante e nítido em fundo escuro)
  accent: '#F59E0B',     // Amber
  success: '#10B981',    // Emerald
  warning: '#F59E0B',
  danger: '#EF4444',     // Red
  isDark: true,
};

const baseLightColors: ThemeColors = {
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9', // Slate 100
  text: '#020617',       // Slate 950 (19.5:1 contraste máximo)
  textSecondary: '#1E293B', // Slate 800 (14.0:1)
  textMuted: '#334155',     // Slate 700 (9.5:1)
  border: '#94A3B8',     // Slate 400
  inputBg: '#FFFFFF',
  primary: '#4338CA',    // Indigo EstudeMy
  accent: '#D97706',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  isDark: false,
};

// Variações para Alto Contraste
const highContrastDarkColors: ThemeColors = {
  ...baseDarkColors,
  background: '#000000',
  card: '#0A0A0A',
  cardSecondary: '#171717',
  text: '#FFFFFF',
  textSecondary: '#FFFFFF',
  textMuted: '#FFFFFF', // Máximo contraste
  border: '#FFFFFF',
  inputBg: '#000000',
  primary: '#A5B4FC',
  accent: '#FDE047',
  success: '#34D399',
  danger: '#F87171',
};

const highContrastLightColors: ThemeColors = {
  ...baseLightColors,
  background: '#FFFFFF',
  card: '#FFFFFF',
  cardSecondary: '#F3F4F6',
  text: '#000000',
  textSecondary: '#000000',
  textMuted: '#000000',
  border: '#000000',
  inputBg: '#FFFFFF',
  primary: '#312E81',
  accent: '#92400E',
  success: '#065F46',
  danger: '#991B1B',
};

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

interface ThemeContextType {
  theme: ActiveTheme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference, saveToBackend?: boolean) => Promise<void>;
  colors: ThemeColors;
  daltonism: DaltonismMode;
  setDaltonism: (mode: DaltonismMode) => Promise<void>;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => Promise<void>;
  fontSizeMultiplier: number;
  scaledFontSize: (baseSize: number) => number;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => Promise<void>;
  isAccessibilityModalVisible: boolean;
  setIsAccessibilityModalVisible: (visible: boolean) => void;
  openAccessibilityModal: () => void;
  closeAccessibilityModal: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [daltonism, setDaltonismState] = useState<DaltonismMode>('none');
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [isAccessibilityModalVisible, setIsAccessibilityModalVisible] = useState<boolean>(false);

  // Carrega preferências salvas
  useEffect(() => {
    const loadPreferences = async () => {
      // 1. Tema
      if (user?.tema && (user.tema === 'light' || user.tema === 'dark')) {
        setThemePreferenceState(user.tema as ThemePreference);
      } else {
        const savedTheme = await getStorageItem('app_theme_preference');
        if (savedTheme && (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark')) {
          setThemePreferenceState(savedTheme as ThemePreference);
        }
      }

      // 2. Daltonismo
      const savedDaltonism = await getStorageItem('app_daltonism_mode');
      if (savedDaltonism && ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'].includes(savedDaltonism)) {
        setDaltonismState(savedDaltonism as DaltonismMode);
      }

      // 3. Tamanho da Fonte
      const savedFont = await getStorageItem('app_font_scale');
      if (savedFont && ['normal', 'large', 'extra-large'].includes(savedFont)) {
        setFontScaleState(savedFont as FontScale);
      }

      // 4. Alto Contraste
      const savedHighContrast = await getStorageItem('app_high_contrast');
      if (savedHighContrast === 'true') {
        setHighContrastState(true);
      }
    };

    loadPreferences();
  }, [user?.tema]);

  // Determina tema ativo
  const activeTheme: ActiveTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemScheme]);

  // Aplica alto contraste e filtros de daltonismo sobre a paleta
  const colors: ThemeColors = useMemo(() => {
    let base = activeTheme === 'dark'
      ? (highContrast ? { ...highContrastDarkColors } : { ...baseDarkColors })
      : (highContrast ? { ...highContrastLightColors } : { ...baseLightColors });

    if (daltonism === 'protanopia') {
      base.primary = '#2563EB'; // Azul Cobalto nítido
      base.accent = '#CA8A04';  // Ouro
      base.success = '#0284C7'; // Cyan
      base.danger = '#D97706';  // Âmbar
    } else if (daltonism === 'deuteranopia') {
      base.primary = '#4338CA'; // Indigo
      base.accent = '#D97706';  // Âmbar
      base.success = '#0284C7'; // Cyan contrastante
      base.danger = '#EA580C';  // Laranja
    } else if (daltonism === 'tritanopia') {
      base.primary = '#E11D48'; // Carmesim
      base.accent = '#0D9488';  // Teal
      base.success = '#059669'; // Esmeralda
      base.danger = '#DC2626';  // Vermelho
    } else if (daltonism === 'achromatopsia') {
      base.primary = base.isDark ? '#E2E8F0' : '#1E293B';
      base.accent = base.isDark ? '#CBD5E1' : '#334155';
      base.success = base.isDark ? '#F8FAFC' : '#0F172A';
      base.warning = base.isDark ? '#CBD5E1' : '#475569';
      base.danger = base.isDark ? '#94A3B8' : '#64748B';
    }

    return base;
  }, [activeTheme, highContrast, daltonism]);

  const fontSizeMultiplier = useMemo(() => {
    if (fontScale === 'large') return 1.18;
    if (fontScale === 'extra-large') return 1.35;
    return 1.0;
  }, [fontScale]);

  const scaledFontSize = (baseSize: number) => {
    return Math.round(baseSize * fontSizeMultiplier);
  };

  // Efeito global de Acessibilidade no DOM (Web / PWA / Browser)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const body = document.body;
      if (!body) return;

      // 1. Zoom e Escala de Fonte Geral
      if (fontScale === 'large') {
        body.style.zoom = '1.14';
      } else if (fontScale === 'extra-large') {
        body.style.zoom = '1.28';
      } else {
        body.style.zoom = '1.0';
      }

      // 2. Alto Contraste no DOM
      if (highContrast) {
        body.setAttribute('data-high-contrast', 'true');
      } else {
        body.removeAttribute('data-high-contrast');
      }

      // 3. Daltonismo
      body.setAttribute('data-daltonism', daltonism);

      // Injeta folha de estilos dinâmica de acessibilidade
      let styleTag = document.getElementById('estudemy-a11y-global-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'estudemy-a11y-global-style';
        document.head.appendChild(styleTag);
      }

      // Cria filtros SVG caso ainda não existam no DOM
      let svgFilters = document.getElementById('estudemy-daltonism-filters');
      if (!svgFilters) {
        svgFilters = document.createElement('div');
        svgFilters.id = 'estudemy-daltonism-filters';
        svgFilters.style.position = 'absolute';
        svgFilters.style.height = '0';
        svgFilters.style.width = '0';
        svgFilters.style.overflow = 'hidden';
        svgFilters.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg">
            <filter id="protanopia-filter">
              <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0"/>
            </filter>
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0"/>
            </filter>
            <filter id="tritanopia-filter">
              <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0"/>
            </filter>
          </svg>
        `;
        document.body.appendChild(svgFilters);
      }

      let css = '';
      if (daltonism === 'achromatopsia') {
        css += `
          body {
            filter: grayscale(100%) contrast(125%) !important;
          }
        `;
      } else if (daltonism === 'protanopia') {
        css += `
          body {
            filter: url(#protanopia-filter) !important;
          }
        `;
      } else if (daltonism === 'deuteranopia') {
        css += `
          body {
            filter: url(#deuteranopia-filter) !important;
          }
        `;
      } else if (daltonism === 'tritanopia') {
        css += `
          body {
            filter: url(#tritanopia-filter) !important;
          }
        `;
      } else {
        css += `
          body {
            filter: none !important;
          }
        `;
      }

      if (highContrast) {
        css += `
          [data-high-contrast="true"] input,
          [data-high-contrast="true"] textarea {
            border: 2px solid #FFFFFF !important;
            background-color: #000000 !important;
            color: #FFFFFF !important;
          }
        `;
      }

      styleTag.innerHTML = css;
    }
  }, [fontScale, highContrast, daltonism]);

  const setThemePreference = async (pref: ThemePreference, saveToBackend: boolean = true) => {
    setThemePreferenceState(pref);
    await setStorageItem('app_theme_preference', pref);

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

  const setDaltonism = async (mode: DaltonismMode) => {
    setDaltonismState(mode);
    await setStorageItem('app_daltonism_mode', mode);
  };

  const setFontScale = async (scale: FontScale) => {
    setFontScaleState(scale);
    await setStorageItem('app_font_scale', scale);
  };

  const setHighContrast = async (enabled: boolean) => {
    setHighContrastState(enabled);
    await setStorageItem('app_high_contrast', enabled ? 'true' : 'false');
  };

  const openAccessibilityModal = () => setIsAccessibilityModalVisible(true);
  const closeAccessibilityModal = () => setIsAccessibilityModalVisible(false);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        isDark: activeTheme === 'dark',
        themePreference,
        setThemePreference,
        colors,
        daltonism,
        setDaltonism,
        fontScale,
        setFontScale,
        fontSizeMultiplier,
        scaledFontSize,
        highContrast,
        setHighContrast,
        isAccessibilityModalVisible,
        setIsAccessibilityModalVisible,
        openAccessibilityModal,
        closeAccessibilityModal,
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
