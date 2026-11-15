import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCharacterImage } from '../constants/assets';
import api from '../services/api';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Calendar,
  Zap,
  Trophy,
  BookOpen,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { alterarMinhaSenha } from '../services/adminService';
import { obterContinue } from '../services/trilhaService';

export interface HeroSkin {
  id: string;
  name: string;
  title: string;
  rarity: 'Comum' | 'Rara' | 'Épica' | 'Lendária';
  rarityColor: string;
  description: string;
  badge: string;
}

export const HERO_SKINS: HeroSkin[] = [
  {
    id: 'samurai_ronin',
    name: 'Kaito Ronin',
    title: 'Espadachim da Honra',
    rarity: 'Comum',
    rarityColor: '#0ea5e9',
    description: 'Estilo clássico da escola Kenjutsu. Combina serenidade com precisão cirúrgica.',
    badge: '⚔️ Clássica',
  },
  {
    id: 'samurai_cyber_void',
    name: 'Kaito Cyber-Void',
    title: 'Andarilho Dimensional',
    rarity: 'Lendária',
    rarityColor: '#a855f7',
    description: 'Armadura de nanotubos e lâmina de plasma fotônico que distorcem o vácuo.',
    badge: '⚡ Lendária',
  },
  {
    id: 'samurai_shogun_solar',
    name: 'Kaito Shogun Solar',
    title: 'Lorde do Dragão Solar',
    rarity: 'Épica',
    rarityColor: '#f59e0b',
    description: 'Armadura dourada forjada nas dunas com corte avassalador de fogo solar.',
    badge: '🔥 Épica',
  },
  {
    id: 'samurai_shinobi_sombra',
    name: 'Kaito Shinobi Sombrio',
    title: 'Mestre do Eclipse',
    rarity: 'Rara',
    rarityColor: '#6366f1',
    description: 'Manto da meia-noite e lâminas espirituais para ataques velozes nas sombras.',
    badge: '🌙 Rara',
  },
];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, updateUserState } = useAuth();
  const { t, language } = useLanguage();
  const { colors } = useTheme();

  const SKIN_STORAGE_KEY = 'estudemy_hero_skin';

  const initialSkin = (user as any)?.skin || (user as any)?.skinSelecionada || 'samurai_ronin';
  const [selectedSkin, setSelectedSkin] = useState<string>(initialSkin);
  const [loadingSkin, setLoadingSkin] = useState<string | null>(null);

  // Carrega a skin salva
  useEffect(() => {
    const loadSkin = async () => {
      try {
        let saved: string | null = null;
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            saved = window.localStorage.getItem(SKIN_STORAGE_KEY);
          }
        } else {
          saved = await SecureStore.getItemAsync(SKIN_STORAGE_KEY);
        }
        const userSkin = (user as any)?.skin || (user as any)?.skinSelecionada || saved;
        if (userSkin) {
          setSelectedSkin(userSkin);
        }
      } catch {}
    };
    loadSkin();
  }, [user]);

  const handleSelectSkin = async (skinId: string) => {
    if (selectedSkin === skinId) return;
    setLoadingSkin(skinId);
    try {
      setSelectedSkin(skinId);
      // Salva no storage local com proteção multiplataforma
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(SKIN_STORAGE_KEY, skinId);
        }
      } else {
        await SecureStore.setItemAsync(SKIN_STORAGE_KEY, skinId);
      }

      // Atualiza o estado em memória do usuário
      if (updateUserState) {
        updateUserState({
          personagem: 'Samurai',
          skin: skinId,
        } as any);
      }

      // Sincroniza com o backend
      await api.put('/api/users/atualizar-personagem', {
        personagem: 'Samurai',
        skin: skinId,
      }).catch(() => {});

      if (refreshUser) {
        await refreshUser().catch(() => {});
      }
    } catch (e) {
      logger.error('Erro ao atualizar skin:', e);
    } finally {
      setLoadingSkin(null);
    }
  };

  // Estatísticas de progresso
  const [trilhasAndamentoCount, setTrilhasAndamentoCount] = useState(0);
  const [fasesConcluidasCount, setFasesConcluidasCount] = useState(0);

  // Alterar Senha state
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [senhaFeedback, setSenhaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    const carregarEstatisticas = async () => {
      try {
        const [continueData, progressoRes] = await Promise.allSettled([
          obterContinue(),
          api.get('/api/progresso/usuario'),
        ]);

        if (isMounted) {
          if (continueData.status === 'fulfilled' && Array.isArray(continueData.value)) {
            setTrilhasAndamentoCount(continueData.value.length);
          }
          if (progressoRes.status === 'fulfilled' && progressoRes.value?.data) {
            const data = progressoRes.value.data;
            if (Array.isArray(data)) {
              setFasesConcluidasCount(data.length);
            } else if (typeof data.concluidas === 'number') {
              setFasesConcluidasCount(data.concluidas);
            } else if (Array.isArray(data.fasesConcluidas)) {
              setFasesConcluidasCount(data.fasesConcluidas.length);
            }
          }
        }
      } catch (err) {
        logger.warn('Erro ao carregar estatísticas do usuário:', err);
      }
    };

    carregarEstatisticas();
    return () => {
      isMounted = false;
    };
  }, []);

  const fraseCadastro = useMemo(() => {
    const rawDate =
      (user as any)?.createdAt ||
      (user as any)?.dataCriacao ||
      (user as any)?.dataCadastro;

    let dateObj: Date;
    if (rawDate) {
      dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
    } else {
      dateObj = new Date();
    }

    const mesesPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const mesesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const mesesEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const lang = language || 'pt-BR';
    const monthIndex = dateObj.getMonth();
    const ano = dateObj.getFullYear();

    if (lang === 'en-US') {
      return `Member since ${mesesEn[monthIndex]} ${ano}`;
    } else if (lang === 'es-ES') {
      return `Miembro desde ${mesesEs[monthIndex]} de ${ano}`;
    }
    return `Membro desde ${mesesPt[monthIndex]} de ${ano}`;
  }, [user, language]);

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
        <Text style={[styles.title, { color: colors.text }]}>{t('profilePage.title') || 'Meu Perfil'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Card do Usuário */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={getCharacterImage('Samurai')}
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

        {/* Herói e Skin Ativa */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <View style={[styles.heroPill, { backgroundColor: '#1E293B' }]}>
            <Text style={styles.heroPillText}>⚔️ Herói: Kaito (Samurai)</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: (HERO_SKINS.find((s) => s.id === selectedSkin) || HERO_SKINS[0]).rarityColor }]}>
            <Text style={[styles.heroPillText, { color: '#ffffff', fontWeight: '800' }]}>
              {(HERO_SKINS.find((s) => s.id === selectedSkin) || HERO_SKINS[0]).badge} {(HERO_SKINS.find((s) => s.id === selectedSkin) || HERO_SKINS[0]).name}
            </Text>
          </View>
        </View>

        {/* Frase: Membro desde Mês e Ano */}
        <View style={styles.memberSinceRow}>
          <Calendar size={13} color="#8B5CF6" style={{ marginRight: 5 }} />
          <Text style={[styles.memberSinceText, { color: colors.textMuted }]}>
            {fraseCadastro}
          </Text>
        </View>

        {/* Nível e XP */}
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>{t('ranking.levelLabel') || 'Nível'} {level}</Text>
          <Text style={[styles.xpLabel, { backgroundColor: colors.cardSecondary, color: colors.text }]}>
            {t('profilePage.xpTotal') || 'Total:'} {xp} XP
          </Text>
        </View>
      </View>

      {/* Seção: Estatísticas do Usuário */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsHeaderRow}>
          <View style={styles.statsIconBubble}>
            <Trophy size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statsCardTitle, { color: colors.text }]}>
              {t('profile.learningStats') || 'Estatísticas de Aprendizado'}
            </Text>
            <Text style={[styles.statsCardSubtitle, { color: colors.textMuted }]}>
              {t('profile.learningStatsDesc') || 'Seu progresso e conquistas na jornada EstudeMy'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Nível Atual */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Trophy size={18} color="#8B5CF6" />
            <Text style={[styles.statItemValue, { color: colors.text }]}>{t('ranking.levelLabel') || 'Nível'} {level}</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.currentLevel') || 'Nível Atual'}</Text>
          </View>

          {/* Card 2: XP Total */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Zap size={18} color="#F59E0B" />
            <Text style={[styles.statItemValue, { color: '#F59E0B' }]}>{xp} XP</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.experience') || 'Experiência'}</Text>
          </View>

          {/* Card 3: Trilhas Ativas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <BookOpen size={18} color="#3B82F6" />
            <Text style={[styles.statItemValue, { color: '#3B82F6' }]}>
              {trilhasAndamentoCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.activeTrails') || 'Trilhas Ativas'}</Text>
          </View>

          {/* Card 4: Fases Completadas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: '#10B981' }]}>
              {fasesConcluidasCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.completedPhases') || 'Fases Concluídas'}</Text>
          </View>

          {/* Card 5: Ofensiva */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Flame size={18} color="#EF4444" />
            <Text style={[styles.statItemValue, { color: '#EF4444' }]}>
              {(user as any)?.ofensiva || (user as any)?.streak || 3} {t('common.days') || 'dias'}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.streak') || 'Ofensiva'}</Text>
          </View>

          {/* Card 6: Conquistas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Award size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: colors.text }]}>
              {Math.min(level, 10)}/10
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.achievements') || 'Conquistas'}</Text>
          </View>
        </View>
      </View>

      {/* Seção: Customização de Skins do Herói Kaito */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Skins do Herói: Kaito (Samurai)
          </Text>
          <View style={[styles.skinRarityPill, { backgroundColor: (HERO_SKINS.find((s) => s.id === selectedSkin) || HERO_SKINS[0]).rarityColor }]}>
            <Text style={styles.skinRarityPillText}>
              {(HERO_SKINS.find((s) => s.id === selectedSkin) || HERO_SKINS[0]).badge}
            </Text>
          </View>
        </View>

        <Text style={[styles.skinSectionSubtitle, { color: colors.textMuted }]}>
          Mago, Guerreiro e Spectre são os inimigos das fases! O herói jogável é Kaito. Escolha sua skin exclusiva para as batalhas:
        </Text>

        <View style={styles.skinsGrid}>
          {HERO_SKINS.map((skin) => {
            const isSelected = selectedSkin === skin.id;
            const isLoading = loadingSkin === skin.id;

            return (
              <TouchableOpacity
                key={skin.id}
                style={[
                  styles.skinCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? '#10B981' : colors.border,
                  },
                  isSelected && styles.skinCardSelected,
                ]}
                onPress={() => handleSelectSkin(skin.id)}
                disabled={isLoading || isSelected}
                activeOpacity={0.85}
              >
                <View style={styles.skinCardHeader}>
                  <View style={[styles.skinBadgeBox, { backgroundColor: skin.rarityColor }]}>
                    <Text style={styles.skinBadgeText}>{skin.badge}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.equippedBadge}>
                      <CheckCircle2 size={13} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.equippedText}>EQUIPADA</Text>
                    </View>
                  )}
                </View>

                <View style={styles.skinCardBody}>
                  <Image
                    source={getCharacterImage('Samurai')}
                    style={[
                      styles.skinAvatarImg,
                      skin.id === 'samurai_cyber_void' && { tintColor: '#C084FC' },
                      skin.id === 'samurai_shogun_solar' && { tintColor: '#F59E0B' },
                      skin.id === 'samurai_shinobi_sombra' && { tintColor: '#818CF8' },
                    ]}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skinNameText, { color: colors.text }]}>{skin.name}</Text>
                    <Text style={[styles.skinTitleText, { color: skin.rarityColor }]}>{skin.title}</Text>
                    <Text style={[styles.skinDescText, { color: colors.textMuted }]} numberOfLines={2}>
                      {skin.description}
                    </Text>
                  </View>
                </View>

                {isLoading && (
                  <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
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
          <Text style={[styles.passwordSectionTitle, { color: colors.text }]}>
            {t('profile.changePassword') || 'Alterar Senha'}
          </Text>
        </View>
        <Text style={[styles.passwordSectionDesc, { color: colors.textMuted }]}>
          {t('profile.changePasswordDesc') || 'Para sua segurança, informe sua senha atual e digite a nova com pelo menos 8 caracteres.'}
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
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.currentPassword') || 'Senha Atual'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.currentPassword') || 'Digite sua senha atual'}
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
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.newPassword') || 'Nova Senha (Mínimo 8 dígitos)'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.newPassword') || 'Digite a nova senha'}
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
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.confirmNewPassword') || 'Confirmar Nova Senha'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.confirmNewPassword') || 'Repita a nova senha'}
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
              <Text style={styles.savePasswordBtnText}>
                {t('profile.updatePassword') || 'Atualizar Minha Senha'}
              </Text>
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
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  memberSinceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  statsIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  statsCardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItemCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItemValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  statItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
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
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  heroPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  skinRarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skinRarityPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  skinSectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 17,
  },
  skinsGrid: {
    gap: 10,
  },
  skinCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  skinCardSelected: {
    borderWidth: 2.5,
    borderColor: '#10B981',
  },
  skinCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skinBadgeBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skinBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equippedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skinCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skinAvatarImg: {
    width: 52,
    height: 52,
  },
  skinNameText: {
    fontSize: 15,
    fontWeight: '900',
  },
  skinTitleText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
    marginBottom: 3,
  },
  skinDescText: {
    fontSize: 11.5,
    lineHeight: 15,
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
