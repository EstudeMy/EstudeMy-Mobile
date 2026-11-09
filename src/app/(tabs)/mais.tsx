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
import { useAuth } from '../../contexts/AuthContext';
import { APP_VERSION, APP_BUILD, APP_ENVIRONMENT } from '../../constants/version';
import { User, Settings, ChevronRight, BookOpen, Bookmark, ShieldCheck, HelpCircle, Info } from 'lucide-react-native';

export default function MaisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();

  const rawRole = (user?.tipoUsuario || (user as any)?.role || (user as any)?.tipo || (user as any)?.tipo_usuario || '').toString().toUpperCase();
  const isAdminEmail = user?.email?.toLowerCase().includes('adm') || user?.email === 'estudemy.adm@gmail.com';
  const isAdminOrOwner = rawRole === 'ADMINISTRADOR' || rawRole === 'ADMIN' || rawRole === 'OWNER' || isAdminEmail || Boolean((user as any)?.isAdmin);

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
        {/* Opção Painel Admin (Apenas Administrador / Owner) */}
        {isAdminOrOwner && (
          <TouchableOpacity
            style={[styles.menuItem, styles.adminMenuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/admin' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                <ShieldCheck size={22} color="#ffffff" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                    {t('more.adminPanel') || 'Painel do Administrador'}
                  </Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                </View>
                <Text style={[styles.menuItemSublabel, { color: colors.textMuted }]}>
                  {t('more.adminPanelDesc') || 'Trilhas globais, usuários e matérias'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

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
          onPress={() => router.push('/seguranca-privacidade' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <ShieldCheck size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('more.securityPrivacy') || 'Segurança & Privacidade'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Opção Central de Ajuda & FAQ */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/ajuda' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
              <HelpCircle size={22} color="#ffffff" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>
              {t('more.helpSupport') || 'Ajuda & Suporte'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Informações de Versão do Aplicativo */}
        <View style={[styles.versionCard, { backgroundColor: colors.cardSecondary }]}>
          <View style={styles.versionHeaderRow}>
            <Info size={16} color="#4F46E5" />
            <Text style={[styles.versionAppName, { color: colors.text }]}>EstudeMy Mobile</Text>
          </View>
          <Text style={[styles.versionNumber, { color: colors.text }]}>
            {t('more.appVersion') || 'Versão'} {APP_VERSION} <Text style={{ color: colors.textMuted, fontWeight: '700' }}>(Build {APP_BUILD})</Text>
          </Text>
          <Text style={[styles.versionEnv, { color: colors.textMuted }]}>
            Ambiente: {APP_ENVIRONMENT} • Sistema Atualizado
          </Text>
        </View>
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
  menuItemSublabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  adminMenuItem: {
    borderLeftWidth: 6,
    borderLeftColor: '#8B5CF6',
  },
  adminBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  versionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    marginTop: 8,
  },
  versionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  versionAppName: {
    fontSize: 13,
    fontWeight: '900',
  },
  versionNumber: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  versionEnv: {
    fontSize: 11,
    fontWeight: '600',
  },
});
