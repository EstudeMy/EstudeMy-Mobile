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
} from 'react-native';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { alterarMinhaSenha } from '../services/adminService';
import { obterContinue } from '../services/trilhaService';

const CHARACTERS = ['Samurai', 'Mago', 'Guerreiro'];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [loadingChar, setLoadingChar] = useState<string | null>(null);

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

    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const mes = meses[dateObj.getMonth()];
    const ano = dateObj.getFullYear();
    return `Membro desde ${mes} de ${ano}`;
  }, [user]);

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
              Estatísticas de Aprendizado 📊
            </Text>
            <Text style={[styles.statsCardSubtitle, { color: colors.textMuted }]}>
              Seu progresso e conquistas na jornada EstudeMy
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Nível Atual */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Trophy size={18} color="#8B5CF6" />
            <Text style={[styles.statItemValue, { color: colors.text }]}>Nível {level}</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Nível Atual</Text>
          </View>

          {/* Card 2: XP Total */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Zap size={18} color="#F59E0B" />
            <Text style={[styles.statItemValue, { color: '#F59E0B' }]}>{xp} XP</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Experiência</Text>
          </View>

          {/* Card 3: Trilhas Ativas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <BookOpen size={18} color="#3B82F6" />
            <Text style={[styles.statItemValue, { color: '#3B82F6' }]}>
              {trilhasAndamentoCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Trilhas Ativas</Text>
          </View>

          {/* Card 4: Fases Completadas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: '#10B981' }]}>
              {fasesConcluidasCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Fases Concluídas</Text>
          </View>

          {/* Card 5: Ofensiva */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Flame size={18} color="#EF4444" />
            <Text style={[styles.statItemValue, { color: '#EF4444' }]}>
              {(user as any)?.ofensiva || (user as any)?.streak || 3} dias
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Ofensiva 🔥</Text>
          </View>

          {/* Card 6: Conquistas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Award size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: colors.text }]}>
              {Math.min(level, 10)}/10
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>Conquistas</Text>
          </View>
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
