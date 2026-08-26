import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const { user, isAuthenticated } = useAuth();

  // Carregar idioma salvo inicialmente
  useEffect(() => {
    const loadSavedLanguage = async () => {
      // 1. Se logado, tenta pegar do perfil do usuário
      if (user && user.idioma) {
        const userLang = user.idioma as Language;
        if (translations[userLang]) {
          setLanguageState(userLang);
          return;
        }
      }

      // 2. Se não, tenta recuperar do SecureStore local
      try {
        const savedLanguage = await SecureStore.getItemAsync('app_language') as Language;
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Erro ao ler idioma local:', error);
      }
    };

    loadSavedLanguage();
  }, [user]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key; // Retorna a própria chave caso não encontre
    }
    return typeof value === 'string' ? value : key;
  };

  const setLanguage = async (newLanguage: Language, saveToBackend: boolean = true) => {
    if (!translations[newLanguage]) return;

    setLanguageState(newLanguage);
    try {
      await SecureStore.setItemAsync('app_language', newLanguage);
    } catch (e) {
      console.error('Erro ao salvar idioma localmente:', e);
    }

    if (saveToBackend && isAuthenticated && user) {
      try {
        await api.put('/api/users/idioma', { idioma: newLanguage });
      } catch (error) {
        console.error('Erro ao salvar preferência de idioma no backend:', error);
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
