import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import api from '../services/api';

import enUS from '../locales/en-US.json';
import esES from '../locales/es-ES.json';
import ptBR from '../locales/pt-BR.json';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

const translations: Record<Language, any> = {
  'en-US': enUS,
  'es-ES': esES,
  'pt-BR': ptBR,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language, saveToBackend?: boolean) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt-BR');
  const { user, isAuthenticated, updateUserState } = useAuth();

  // Carregar idioma salvo inicialmente
  useEffect(() => {
    const loadSavedLanguage = async () => {
      // 1. Prioridade máxima: idioma explicitamente escolhido e salvo localmente
      try {
        let savedLanguage: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          savedLanguage = window.localStorage.getItem('app_language');
        } else {
          savedLanguage = await SecureStore.getItemAsync('app_language');
        }

        if (savedLanguage && translations[savedLanguage as Language]) {
          setLanguageState(savedLanguage as Language);
          return;
        }
      } catch (error) {
        console.warn('Erro ao ler idioma local:', error);
      }

      // 2. Fallback: preferência do perfil do usuário cadastrada no backend
      const userLang = (user?.idioma || '') as Language;
      if (userLang && translations[userLang]) {
        setLanguageState(userLang);
      }
    };

    loadSavedLanguage();
  }, [user?.idioma]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback para pt-BR caso falte a chave no idioma selecionado
        let fallbackVal = translations['pt-BR'];
        for (const fbKey of keys) {
          fallbackVal = fallbackVal?.[fbKey];
          if (fallbackVal === undefined) break;
        }
        return typeof fallbackVal === 'string' ? fallbackVal : key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  const setLanguage = async (newLanguage: Language, saveToBackend: boolean = true) => {
    if (!translations[newLanguage]) return;

    setLanguageState(newLanguage);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('app_language', newLanguage);
      } else {
        await SecureStore.setItemAsync('app_language', newLanguage);
      }
    } catch (e) {
      console.warn('Erro ao salvar idioma localmente:', e);
    }

    if (updateUserState) {
      updateUserState({ idioma: newLanguage });
    }

    if (saveToBackend && isAuthenticated && user) {
      try {
        await api.put('/api/users/idioma', { idioma: newLanguage });
      } catch (error) {
        console.warn('Erro ao salvar preferência de idioma no backend:', error);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
}
