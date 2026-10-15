import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Settings, ChevronRight, BookOpen, Bookmark, ShieldCheck } from 'lucide-react-native';

export default function MaisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 52),
        },
      ]}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 16, 16),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Título */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('common.more') || 'Mais'} ⚙️</Text>
      </View>

      {/* Opções de Menu */}
      <View style={styles.menuContainer}>
        {/* Opção Perfil */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/perfil')}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#4F46E5' }]}>
              <User size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('common.profile') || 'Perfil'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Opção Configurações */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/configuracoes' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
              <Settings size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('settings.title') || 'Configurações'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Opção Meus Cursos */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/meus-cursos' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <BookOpen size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('myCourses.title') || 'Meus Cursos'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Opção Lições Salvas */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/licoes-salvas' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#EC4899' }]}>
              <Bookmark size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('savedLessons.title') || 'Lições Salvas'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Opção Segurança & Privacidade (RC05 Anti-Phishing & RC10 LGPD) */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/configuracoes' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <ShieldCheck size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              Segurança & Privacidade
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
});
