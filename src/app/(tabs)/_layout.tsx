import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Home, Trophy, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { isProfileCompleted } from '../../services/authHelpers';

export default function TabLayout() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Garante que qualquer rota dentro das abas valide se a conta já completou o perfil
  React.useEffect(() => {
    const verifyUserProfile = async () => {
      if (loading || !isAuthenticated || !user) return;
      const userKey = user.email || user.id || user._id;
      const completed = await isProfileCompleted(userKey);

      if ((!user.username || !user.personagem) && !completed) {
        router.replace('/(auth)/completar-perfil' as any);
      }
    };
    verifyUserProfile();
  }, [loading, isAuthenticated, user, router]);

  // Margem e espaçamento inferior dinâmico:
  // Em celulares onde a barra de botões do sistema Android (Voltar, Home, Recentes)
  // ou a barra de gestos do iOS fica embaixo, garante espaço suficiente para que
  // os botões do celular NUNCA fiquem por cima dos botões do aplicativo.
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12);
  const tabHeight = 62 + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a2a' : '#ffffff',
          borderTopWidth: 3,
          borderTopColor: '#1b1b1b',
          height: tabHeight,
          paddingBottom: safeBottom + 2,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4F46E5', // indigo-600
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarItemStyle: {
          paddingBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('common.home') || 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: t('common.ranking') || 'Ranking',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: t('common.more') || 'Mais',
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

