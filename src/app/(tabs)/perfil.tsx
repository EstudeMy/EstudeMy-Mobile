import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme, ThemePreference } from '../../contexts/ThemeContext';
import { getCharacterImage } from '../../constants/assets';
import api from '../../services/api';
import { LogOut, Globe, Shield, Sun, Moon, Smartphone } from 'lucide-react-native';

const CHARACTERS = ['Samurai', 'Mago', 'Guerreiro'];
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

export default function PerfilScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { themePreference, setThemePreference, isDark, colors } = useTheme();


  const [loadingChar, setLoadingChar] = useState<string | null>(null);

  const handleUpdateCharacter = async (charName: string) => {
    if (user?.personagem === charName) return;
    setLoadingChar(charName);
    try {
      await api.put('/api/users/atualizar-personagem', {
        personagem: charName,
      });
      await refreshUser();
    } catch (e) {
      console.error('Erro ao atualizar personagem:', e);
    } finally {
      setLoadingChar(null);
    }
  };

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await setLanguage(langCode, true);
    await refreshUser();
  };

  const handleThemeChange = async (pref: ThemePreference) => {
    await setThemePreference(pref, true);
  };

  // Cálculo de nível
  const xp = user?.xpTotal || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Título */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Meu Perfil 👤</Text>
      </View>

      {/* Card do Usuário */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={getCharacterImage(user?.personagem)}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.nome || 'Estudante'}</Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'email@provedor.com'}</Text>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Nível {level}</Text>
          <Text style={[styles.xpLabel, { backgroundColor: colors.cardSecondary, color: colors.text }]}>Total: {xp} XP</Text>
        </View>
      </View>

      {/* Seção: Escolha de Personagem */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Classe / Personagem</Text>
        <View style={styles.characterContainer}>
          {CHARACTERS.map((char) => {
            const isSelected = user?.personagem === char;
            const isLoading = loadingChar === char;

            return (
              <TouchableOpacity
                key={char}
                style={[
                  styles.charBtn,
                  { backgroundColor: isSelected ? '#16A34A' : colors.card },
                  isSelected && styles.charBtnActive,
                ]}
                onPress={() => handleUpdateCharacter(char)}
                disabled={isLoading || isSelected}
                activeOpacity={0.8}
              >
                <Image
                  source={getCharacterImage(char)}
                  style={styles.charSelectImg}
                  resizeMode="contain"
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 6 }} />
                ) : (
                  <Text style={[styles.charBtnText, { color: isSelected ? '#ffffff' : colors.text }, isSelected && styles.charBtnTextActive]}>
                    {char}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>


      {/* Seção: Aparência / Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Sun size={18} color={colors.textMuted} style={styles.sectionIcon} /> Tema do App
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
                    {tItem.label}
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

      {/* Seção: Informações Gerais */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Shield size={18} color={colors.textMuted} style={styles.sectionIcon} /> Segurança & Conta
        </Text>
        <View style={styles.optionsList}>
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>Perfil tipo:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.tipoUsuario || 'ALUNO'}</Text>
          </View>
          <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>Status da conta:</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '900' }]}>
              {user?.isVerified ? 'VERIFICADO' : 'ATIVO'}
            </Text>
          </View>
        </View>
      </View>

      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.9}>
        <LogOut size={20} color="#ffffff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: 24,
  },
  cardDark: {
    backgroundColor: '#2D2D44',
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#374151',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 74,
    height: 74,
  },
  charSelectImg: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 4,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 18,
  },
  levelLabel: {
    backgroundColor: '#CA8A04', // yellow-600
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  xpLabel: {
    backgroundColor: '#1E1E2F',
    color: '#F3F4F6',
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  characterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  charBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charBtnDark: {
    backgroundColor: '#1E1E2F',
  },
  charBtnLight: {
    backgroundColor: '#E5E7EB',
  },
  charBtnActive: {
    backgroundColor: '#16A34A', // green-600 active border
    borderColor: '#1b1b1b',
  },
  charBtnText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '900',
  },
  charBtnTextActive: {
    color: '#ffffff',
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
  optionRowActive: {
    borderColor: '#4F46E5', // indigo-600 active border
  },
  optionLabel: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '800',
  },
  optionLabelActive: {
    color: '#ffffff',
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
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  infoValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#DC2626', // red-600
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
