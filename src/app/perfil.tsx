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
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCharacterImage } from '../constants/assets';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import logger from '../utils/logger';
import { sanitizeInput } from '../utils/security';

const CHARACTERS = ['Samurai', 'Mago', 'Guerreiro'];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [loadingChar, setLoadingChar] = useState<string | null>(null);

  const handleUpdateCharacter = async (charName: string) => {
    const cleanCharName = sanitizeInput(charName);
    if (user?.personagem === cleanCharName || !cleanCharName) return;
    setLoadingChar(cleanCharName);
    try {
      await api.put('/api/users/atualizar-personagem', {
        personagem: cleanCharName,
      });
      await refreshUser();
    } catch (e) {
      logger.error('Erro ao atualizar personagem:', e);
    } finally {
      setLoadingChar(null);
    }
  };

  // Cálculo de nível
  const xp = user?.xpTotal || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 48),
        },
      ]}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 16, 16),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Título */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('profilePage.title') || 'Meu Perfil'} 👤</Text>
        <View style={{ width: 26 }} />
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
          <Text style={styles.levelLabel}>{t('ranking.levelLabel') || 'Nível'} {level}</Text>
          <Text style={[styles.xpLabel, { backgroundColor: colors.cardSecondary, color: colors.text }]}>{t('profilePage.xpTotal') || 'Total:'} {xp} XP</Text>
        </View>
      </View>

      {/* Seção: Escolha de Personagem */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('characterPage.chooseClass') || 'Classe / Personagem'}</Text>
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
                    {t(`characterPage.classes.${char.toLowerCase()}`) || char}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 18,
  },
  levelLabel: {
    backgroundColor: '#CA8A04',
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  charBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#1b1b1b',
  },
  charBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  charBtnTextActive: {
    color: '#ffffff',
  },
});
