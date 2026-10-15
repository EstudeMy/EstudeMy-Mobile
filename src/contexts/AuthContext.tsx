import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getToken, removeToken, setToken, getLocalUser, saveLocalUser } from '../services/authHelpers';
import api from '../services/api';
import { useRouter } from 'expo-router';
import logger from '../utils/logger';
import { sanitizeUserPayload } from '../utils/security';

export interface User {
  id?: string;
  _id?: string;
  nome: string;
  email: string;
  username: string | null;
  personagem: string | null;
  tipoUsuario: 'ALUNO' | 'PROFESSOR' | 'ADMINISTRADOR' | 'OWNER' | null;
  tema?: string;
  idioma?: string;
  fotoPerfil?: string;
  xpTotal?: number;
  isVerified?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserState: (partial: Partial<User>) => void;
  loading: boolean;
  updateUserTheme: (novoTema: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setAuthState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    await removeToken();
    setUser(null);
    setAuthState(null);
    // Redireciona para o fluxo de autenticação
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = await getToken();
        if (!savedToken) {
          setLoading(false);
          return;
        }

        setAuthState(savedToken);

        // Fazer a chamada ao backend para puxar os dados atualizados do usuário
        const res = await api.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.data) {
          const localUser = await getLocalUser();
          const mergedUser = localUser ? { ...localUser, ...res.data, username: localUser.username || res.data.username || '' } : res.data;
          setUser(mergedUser);
          await saveLocalUser(mergedUser);
        } else {
          await logout();
        }
      } catch (error) {
        logger.error('Erro ao carregar sessão inicial do usuário:', error);
        const localUser = await getLocalUser();
        if (localUser) {
          setUser(localUser);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [logout]);

  const login = async (newToken: string, userData?: User) => {
    setLoading(true);
    try {
      await setToken(newToken);
      setAuthState(newToken);

      if (userData) {
        setUser(userData);
        await saveLocalUser(userData);
      } else {
        const res = await api.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
        if (res.data) {
          setUser(res.data);
          await saveLocalUser(res.data);
        }
      }
    } catch (error) {
      logger.error('Erro no login:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/users/me');
      if (res.data) {
        const localUser = await getLocalUser();
        const mergedUser = localUser ? { ...localUser, ...res.data, username: localUser.username || res.data.username || '' } : res.data;
        setUser(mergedUser);
        await saveLocalUser(mergedUser);
      }
    } catch (error) {
      logger.error('Erro ao dar refresh no usuário:', error);
    }
  };

  const updateUserTheme = async (novoTema: string) => {
    if (!user || !token) return;

    setUser({ ...user, tema: novoTema });
    
    try {
      // RC07: Mass assignment protection
      const safePayload = sanitizeUserPayload({ tema: novoTema });
      await api.put('/api/users/tema', safePayload);
    } catch (error) {
      logger.error('Erro ao salvar tema no backend:', error);
    }
  };

  const updateUserState = (partial: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...partial } : (partial as User);
      saveLocalUser(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, logout, refreshUser, updateUserState, loading, updateUserTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
