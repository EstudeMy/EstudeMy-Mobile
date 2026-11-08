import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCharacterImage } from '../constants/assets';
import api from '../services/api';
import { ArrowLeft, Copy, Check, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { alterarMinhaSenha } from '../services/adminService';
import { copyToClipboard } from '../services/trilhaAcessoService';

const CHARACTERS = ['Samurai', 'Mago', 'Guerreiro'];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [loadingChar, setLoadingChar] = useState<string | null>(null);

  // ID Copy state
  const [idCopied, setIdCopied] = useState(false);

  // Alterar Senha state
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [senhaFeedback, setSenhaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userId = user?._id || user?.id || '';

  const handleCopyId = async () => {
    if (!userId) return;
    await copyToClipboard(userId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

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

  const handleAlterarSenha = async () => {
    if (!senhaAtual.trim()) {
      setSenhaFeedback({ type: 'error', message: 'Digite sua senha atual.' });
      return;
    }
    if (novaSenha.length < 8) {
      setSenhaFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaFeedback({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setLoadingSenha(true);
    setSenhaFeedback(null);

    try {
      const res = await alterarMinhaSenha(senhaAtual, novaSenha);
      if (res.success) {
        setSenhaFeedback({ type: 'success', message: res.message || 'Senha atualizada com sucesso!' });
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        setSenhaFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSenhaFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Erro ao alterar senha.',
      });
    } finally {
      setLoadingSenha(false);
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
        
        {/* Tipo de Usuário Badge */}
        {user?.tipoUsuario && (
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.roleBadgeText}>{user.tipoUsuario}</Text>
          </View>
        )}

        {/* Nível e XP */}
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>{t('ranking.levelLabel') || 'Nível'} {level}</Text>
          <Text style={[styles.xpLabel, { backgroundColor: colors.cardSecondary, color: colors.text }]}>
            {t('profilePage.xpTotal') || 'Total:'} {xp} XP
          </Text>
        </View>

        {/* ID do Usuário Visível com Botão Copiar */}
        <View style={[styles.idContainer, { backgroundColor: colors.cardSecondary }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.idLabel, { color: colors.textMuted }]}>ID do Usuário</Text>
            <Text style={[styles.idValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
              {userId || 'Nenhum ID disponível'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.copyIdBtn, idCopied && styles.copyIdBtnSuccess]}
            onPress={handleCopyId}
            activeOpacity={0.8}
          >
            {idCopied ? (
              <>
                <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.copyIdBtnText}>Copiado!</Text>
              </>
            ) : (
              <>
                <Copy size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.copyIdBtnText}>Copiar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Seção: Escolha de Personagem */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('characterPage.chooseClass') || 'Classe / Personagem'}
        </Text>
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

      {/* Seção: Alterar Senha */}
      <View style={[styles.passwordSection, { backgroundColor: colors.card }]}>
        <View style={styles.passwordHeader}>
          <KeyRound size={22} color="#F59E0B" />
          <Text style={[styles.passwordSectionTitle, { color: colors.text }]}>Alterar Senha</Text>
        </View>
        <Text style={[styles.passwordSectionDesc, { color: colors.textMuted }]}>
          Para sua segurança, informe sua senha atual e digite a nova com pelo menos 8 caracteres.
        </Text>

        {senhaFeedback && (
          <View
            style={[
              styles.feedbackBox,
              senhaFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                senhaFeedback.type === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
              ]}
            >
              {senhaFeedback.message}
            </Text>
          </View>
        )}

        {/* Senha Atual */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Senha Atual</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Digite sua senha atual"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showSenhaAtual}
              value={senhaAtual}
              onChangeText={setSenhaAtual}
            />
            <TouchableOpacity onPress={() => setShowSenhaAtual(!showSenhaAtual)} style={styles.eyeBtn}>
              {showSenhaAtual ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nova Senha (Mínimo 8 dígitos)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Digite a nova senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNovaSenha}
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            <TouchableOpacity onPress={() => setShowNovaSenha(!showNovaSenha)} style={styles.eyeBtn}>
              {showNovaSenha ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmar Nova Senha</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Repita a nova senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)} style={styles.eyeBtn}>
              {showConfirmarSenha ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão de Salvar Senha */}
        <TouchableOpacity
          style={styles.savePasswordBtn}
          onPress={handleAlterarSenha}
          disabled={loadingSenha}
          activeOpacity={0.85}
        >
          {loadingSenha ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <KeyRound size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.savePasswordBtnText}>Atualizar Minha Senha</Text>
            </>
          )}
        </TouchableOpacity>
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginTop: 8,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
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
  idContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginTop: 18,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  idValue: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  copyIdBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  copyIdBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
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
  passwordSection: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  passwordSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  passwordSectionDesc: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 16,
  },
  feedbackBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackTextSuccess: {
    color: '#15803D',
  },
  feedbackTextError: {
    color: '#B91C1C',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  savePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginTop: 8,
  },
  savePasswordBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
