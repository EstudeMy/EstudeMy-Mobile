import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
import { ArrowLeft, LogOut, Globe, Shield, Sun, Moon, Smartphone, ShieldCheck, AlertTriangle } from 'lucide-react-native';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
] as const;

const THEMES = [
  { code: 'light', label: 'Claro', icon: Sun },
  { code: 'dark', label: 'Escuro', icon: Moon },
  { code: 'system', label: 'Sistema (Auto)', icon: Smartphone },
] as const;

type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { themePreference, setThemePreference, colors } = useTheme();

  const getThemeLabel = (code: 'light' | 'dark' | 'system') => {
    switch (code) {
      case 'light': return t('settings.light') || 'Claro';
      case 'dark': return t('settings.dark') || 'Escuro';
      case 'system': return t('settings.system') || 'Sistema (Auto)';
      default: return '';
    }
  };

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await setLanguage(langCode, true);
    await refreshUser();
  };

  const handleThemeChange = async (pref: ThemePreference) => {
    await setThemePreference(pref, true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title') || 'Configurações'} ⚙️</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Seção: Aparência / Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Sun size={18} color={colors.textMuted} style={styles.sectionIcon} /> {t('settings.appearance') || 'Tema do App'}
        </Text>
        <View style={styles.optionsList}>
          {THEMES.map((tItem) => {
            const isSelected = themePreference === tItem.code;
            const IconComp = tItem.icon;
            return (
              <TouchableOpacity
                key={tItem.code}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.card },
                  isSelected && { borderColor: '#4F46E5' },
                ]}
                onPress={() => handleThemeChange(tItem.code as ThemePreference)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <IconComp size={18} color={isSelected ? '#4F46E5' : colors.textMuted} />
                  <Text style={[styles.optionLabel, { color: colors.text }, isSelected && { color: '#4F46E5', fontWeight: '900' }]}>
                    {getThemeLabel(tItem.code)}
                  </Text>
                </View>
                {isSelected && <View style={styles.radioDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção: Idioma */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Globe size={18} color={colors.textMuted} style={styles.sectionIcon} /> {t('settings.language') || 'Idioma do App'}
        </Text>
        <View style={styles.optionsList}>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.card },
                  isSelected && { borderColor: '#4F46E5' },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }, isSelected && { color: '#4F46E5', fontWeight: '900' }]}>
                    {lang.label}
                  </Text>
                </View>
                {isSelected && <View style={styles.radioDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção: Segurança & Conformidade LGPD (RC05 Anti-Phishing & RC10 LGPD) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <ShieldCheck size={18} color="#10B981" style={styles.sectionIcon} /> {t('settings.securityAccount') || 'Segurança & Conta'}
        </Text>
        <View style={styles.optionsList}>
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>{t('profilePage.profileType') || 'Perfil tipo:'}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.tipoUsuario ? (t(`common.roles.${user.tipoUsuario}`) || user.tipoUsuario) : (t('common.roles.ALUNO') || 'Estudante')}
            </Text>
          </View>
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>{t('profilePage.accountStatus') || 'Status da conta:'}</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '900' }]}>
              {user?.isVerified ? (t('profilePage.statusVerified') || 'VERIFICADO') : (t('profilePage.statusActive') || 'ATIVO')}
            </Text>
          </View>
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>Protocolo de Criptografia:</Text>
            <Text style={[styles.infoValue, { color: '#3B82F6', fontWeight: '800' }]}>
              TLS 1.3 / AES-256 (Ativo)
            </Text>
          </View>

          {/* Botão Canal de Denúncia Antiphishing (RC05) */}
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}
            onPress={() => {
              Alert.alert(
                'Canal de Segurança & Denúncia',
                '🛡️ Diretrizes de Proteção EstudeMy:\n\n1. Nosso domínio oficial é estudemy.com / onrender.com.\n2. Nunca pedimos sua senha por e-mail ou mensagens externas.\n3. Suspeita de e-mail falso ou golpe? Comunique imediatamente nossa equipe em seguranca@estudemy.com.',
                [{ text: 'Entendido', style: 'default' }]
              );
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#F59E0B" />
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Canal Anti-Phishing & Denúncia
              </Text>
            </View>
          </TouchableOpacity>

          {/* Termos & Privacidade LGPD (RC10) */}
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: colors.card }]}
            onPress={() => {
              Alert.alert(
                'Privacidade e Proteção de Dados (LGPD)',
                'Seus dados pessoais (PII) estão protegidos conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). As senhas são protegidas com algoritmos de derivação forte (Bcrypt) com salt individual, e dados de sessão são cifrados no SecureStore.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="#10B981" />
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Termos de Privacidade & LGPD
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.9}>
        <LogOut size={20} color="#ffffff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{t('common.logout') || 'Sair da Conta'}</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  infoKey: {
    fontWeight: '700',
    fontSize: 14,
  },
  infoValue: {
    fontWeight: '800',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});
