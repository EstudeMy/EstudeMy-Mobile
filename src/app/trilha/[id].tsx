import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTrackImage, getCharacterImage } from '../../constants/assets';
import { buscarTrilhaPorId, iniciarTrilha, Trilha } from '../../services/trilhaService';
import {
  isTrailUnlocked,
  validateAndUnlockTrail,
  copyToClipboard,
  getTrailAccessCode,
  isTrilhaPrivada,
  removeTrailAccessCode,
} from '../../services/trilhaAcessoService';

import { buscarSecoesPorTrilha, Secao } from '../../services/secaoService';
import { buscarFasesPorTrilha, Fase } from '../../services/faseService';
import { obterFasesConcluidasLocalmente } from '../../services/progressoService';
import api from '../../services/api';
import QRCodeModal from '../../components/QRCodeModal';
import QRScannerModal from '../../components/QRScannerModal';
import { CheckoutModal } from '../../components/CheckoutModal';
import { isTrilhaComprada } from '../../services/pagamentoService';
import {
  Lock,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  HelpCircle,
  X,
  Key,
  Copy,
  DollarSign,
  Globe,
  QrCode,
  Camera,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Percent,
  Heart,
  Coins,
  Zap,
  Trophy,
  Book,
  Swords,
  Shield,
  Compass,
  Clock,
  Flame,
  Skull,
  Crown,
  Play,
  Users,
  MessageSquare,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { AccessibilityIcon } from '../../components/AccessibilityIcon';
import { GAME_MODES_CONFIG } from '../../game/data/gameModesData';
import { GameModeId } from '../../game/types';

export default function TrilhaDetailScreen() {
  const { id, code: urlCode, autoPlay } = useLocalSearchParams<{ id: string; code?: string; autoPlay?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, openAccessibilityModal } = useTheme();
  const [selectedMode, setSelectedMode] = useState<GameModeId>('campanha');
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  
  // Progresso do usuário nesta trilha
  const [iniciada, setIniciada] = useState(false);
  const [fasesConcluidas, setFasesConcluidas] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Controle de acesso e código para trilhas privadas
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [localAccessCode, setLocalAccessCode] = useState<string | null>(null);
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [studentCodeError, setStudentCodeError] = useState<string | null>(null);
  const [studentUnlocking, setStudentUnlocking] = useState(false);
  const [teacherCodeCopied, setTeacherCodeCopied] = useState(false);

  // Pagamento e Checkout
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');

  // Estados dos Modos Especiais (Torre Mortal Kombat e Speedrun)
  const [towerFloor, setTowerFloor] = useState<number>(1);
  const [towerRecord, setTowerRecord] = useState<number>(1);

  // Progresso isolado para modos especiais (Speedrun e Boss Rush)
  const [speedrunConcluidas, setSpeedrunConcluidas] = useState<string[]>([]);
  const [bossRushConcluidas, setBossRushConcluidas] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const floor = parseInt(window.sessionStorage?.getItem('estudemy_tower_floor') || '1', 10);
        const record = parseInt(window.localStorage?.getItem('estudemy_tower_record') || '1', 10);
        if (!isNaN(floor) && floor > 0) setTowerFloor(floor);
        if (!isNaN(record) && record > 0) setTowerRecord(record);

        if (id && window.localStorage) {
          const srRaw = window.localStorage.getItem(`estudemy_progresso_speedrun_${id}`);
          if (srRaw) {
            try {
              const parsed = JSON.parse(srRaw);
              if (Array.isArray(parsed)) setSpeedrunConcluidas(parsed);
            } catch (e) {}
          }
          const brRaw = window.localStorage.getItem(`estudemy_progresso_boss_rush_${id}`);
          if (brRaw) {
            try {
              const parsed = JSON.parse(brRaw);
              if (Array.isArray(parsed)) setBossRushConcluidas(parsed);
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }, [id, selectedMode]);

  const handleIniciarModo = (modo: GameModeId, customFaseId?: string, customPhaseIndex?: number) => {
    let targetPhase = 0;
    let targetFase = customFaseId;

    if (modo === 'boss_rush') {
      const firstUncompletedIdx = fases.findIndex((f) => !bossRushConcluidas.includes(f._id));
      const safeBossIdx = customPhaseIndex !== undefined
        ? customPhaseIndex
        : (firstUncompletedIdx >= 0 ? firstUncompletedIdx : 0);
      targetPhase = safeBossIdx;
      targetFase = customFaseId || fases[safeBossIdx]?._id || `boss_fase_${safeBossIdx + 1}`;
    } else if (modo === 'speedrun') {
      const firstUncompleted = fases.find((f) => !speedrunConcluidas.includes(f._id)) || fases[0];
      targetFase = customFaseId || firstUncompleted?._id || `trilha_${id}`;
      targetPhase = customPhaseIndex !== undefined ? customPhaseIndex : Math.max(0, fases.indexOf(firstUncompleted));
    } else {
      const activeFase = fases.find((f) => !fasesConcluidas.includes(f._id)) || fases[0];
      targetFase = customFaseId || activeFase?._id || `trilha_${id}`;
      targetPhase = customPhaseIndex !== undefined ? customPhaseIndex : Math.max(0, fases.indexOf(activeFase));
    }

    router.push({
      pathname: '/game/[faseId]',
      params: { faseId: targetFase, trilhaId: id, modo: modo, phase: String(targetPhase) },
    });
  };

  // Modais de QR Code
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'trail' | 'game' | 'tips'>('trail');

  const SAVED_TRAILS_KEY = 'saved_trails_list';
  const isInitialLoadRef = useRef(true);

  // Carrega se a trilha está salva de forma segura (compatível com Web e Mobile)
  const getSavedTrailsListSafe = async (): Promise<string[]> => {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(SAVED_TRAILS_KEY) : null;
      } else {
        raw = await SecureStore.getItemAsync(SAVED_TRAILS_KEY);
      }
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  };

  const setSavedTrailsListSafe = async (list: string[]): Promise<void> => {
    try {
      const json = JSON.stringify(list);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(SAVED_TRAILS_KEY, json);
        }
      } else {
        await SecureStore.setItemAsync(SAVED_TRAILS_KEY, json);
      }
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const checkSavedStatus = async () => {
      try {
        if (!id) return;
        const list = await getSavedTrailsListSafe();
        if (isMounted && Array.isArray(list)) {
          setIsSaved(list.includes(String(id)));
        }
      } catch (e) {
        // Silencioso para evitar toasts ou alertas no cliente
      }
    };
    checkSavedStatus().catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggleSave = async () => {
    if (!id) return;
    const list = await getSavedTrailsListSafe();
    let updated: string[];
    if (list.includes(id)) {
      updated = list.filter((savedId) => savedId !== id);
      setIsSaved(false);
    } else {
      updated = [...list, id];
      setIsSaved(true);
    }
    await setSavedTrailsListSafe(updated);
  };

  const fetchTrilhaDetails = useCallback(async () => {
    if (!id) return;
    // Só exibe spinner de tela cheia no primeiro carregamento
    if (isInitialLoadRef.current) {
      setLoading(true);
    }
    try {
      const [trilhaData, secoesData, fasesData, localCode, purchased] = await Promise.all([
        buscarTrilhaPorId(id),
        buscarSecoesPorTrilha(id),
        buscarFasesPorTrilha(id),
        getTrailAccessCode(id),
        isTrilhaComprada(id, user?._id || user?.id),
      ]);
      const isPrivate = isTrilhaPrivada(trilhaData);
      if (!isPrivate) {
        setLocalAccessCode(null);
        await removeTrailAccessCode(id);
      } else {
        setLocalAccessCode(localCode);
      }
      setTrilha(trilhaData);
      setIsPurchased(purchased);

      // Verificação de trilha privada, paga e permissões
      const isPaid =
        trilhaData.pagamento === 'Paga' ||
        Boolean(trilhaData.preco && Number(trilhaData.preco) > 0);

      const currentUserId = user?._id || user?.id;
      const isCreator = Boolean(
        currentUserId && (
          trilhaData.criadoPor === currentUserId ||
          (typeof trilhaData.criadoPor === 'object' && (trilhaData.criadoPor as any)?._id === currentUserId) ||
          (trilhaData as any).usuario === currentUserId ||
          (typeof (trilhaData as any).usuario === 'object' && (trilhaData as any).usuario?._id === currentUserId)
        )
      );
      const isAdminOrOwner =
        user?.tipoUsuario === 'ADMINISTRADOR' ||
        user?.tipoUsuario === 'OWNER';

      if (isCreator || isAdminOrOwner) {
        // Criador da trilha ou Administrador/Owner sempre têm acesso irrestrito
        setIsUnlocked(true);
      } else if (isPaid) {
        // Trilha PAGA: SÓ LIBERA SE O PAGAMENTO FOR EFETUADO!
        if (purchased) {
          if (!isPrivate) {
            setIsUnlocked(true);
          } else {
            const unlocked = await isTrailUnlocked(id);
            setIsUnlocked(unlocked);
          }
        } else {
          // NÃO COMPRADA: Bloqueio estrito! Exibe a tela de pagamento
          setIsUnlocked(false);
        }
      } else if (!isPrivate) {
        // Trilha aberta e gratuita: 100% liberada sem pedir código
        setIsUnlocked(true);
      } else {
        // Trilha privada e gratuita: requer código de acesso da turma
        const unlocked = await isTrailUnlocked(id);
        setIsUnlocked(unlocked);
      }

      const sortedSecoes = secoesData.sort((a, b) => a.ordem - b.ordem);
      setSecoes(sortedSecoes);

      // Ordenar as fases seguindo a ordem das seções e depois a ordem das fases
      const sortedFases: Fase[] = [];
      sortedSecoes.forEach((secao) => {
        const fasesDaSecao = fasesData
          .filter((f) => f.secaoId === secao._id)
          .sort((a, b) => a.ordem - b.ordem);
        sortedFases.push(...fasesDaSecao);
      });
      setFases(sortedFases);

      // 1. Buscar progresso local garantido (offline-first)
      const localCompleted = await obterFasesConcluidasLocalmente(id);

      // 2. Buscar progresso atualizado no backend (com timestamp para evitar cache)
      let backendCompleted: string[] = [];
      try {
        const progressoRes = await api.get(`/api/progresso/trilha/${id}?_t=${Date.now()}`);
        if (progressoRes.data) {
          setIniciada(true);
          const progMap = progressoRes.data.progresso;
          if (progMap && typeof progMap === 'object') {
            backendCompleted = Object.keys(progMap).filter((fId) => progMap[fId] === true);
          } else if (Array.isArray(progressoRes.data.fasesConcluidas)) {
            backendCompleted = progressoRes.data.fasesConcluidas;
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Trilha não registrada no backend ainda; usa o estado local
          setIniciada(localCompleted.length > 0);
        } else {
          console.error('Erro ao buscar progresso da trilha:', err);
        }
      }

      // 3. Unifica progresso do backend com o storage local
      const todasConcluidas = Array.from(new Set([...backendCompleted, ...localCompleted]));
      if (todasConcluidas.length > 0) {
        setIniciada(true);
      }
      setFasesConcluidas(todasConcluidas);
    } catch (e) {
      console.error('Erro ao carregar detalhes da trilha:', e);
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [id, user]);

  // useFocusEffect recarrega os dados e o progresso sempre que o usuário volta da tela do jogo!
  useFocusEffect(
    useCallback(() => {
      fetchTrilhaDetails();
    }, [fetchTrilhaDetails])
  );

  // Determina se esta é a fase onde o avatar do personagem deve ficar
  const isPhaseActive = (fase: Fase) => {
    if (fases.length === 0) return false;
    
    const firstActive = fases.find((f) => !fasesConcluidas.includes(f._id));
    if (firstActive) {
      return firstActive._id === fase._id;
    }
    
    return fases[fases.length - 1]._id === fase._id;
  };

  const getZigZagStyle = (index: number) => {
    const mod = index % 4;
    if (mod === 0) return { alignSelf: 'center' as const };
    if (mod === 1) return { alignSelf: 'center' as const, transform: [{ translateX: -65 }] };
    if (mod === 2) return { alignSelf: 'center' as const };
    return { alignSelf: 'center' as const, transform: [{ translateX: 65 }] };
  };

  const BANNER_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  const handleIniciarTrilha = async () => {
    if (!id) return;
    setLoadingAction(true);
    try {
      await iniciarTrilha(id);
      setIniciada(true);
    } catch (e) {
      console.error('Erro ao iniciar trilha:', e);
    } finally {
      setLoadingAction(false);
      // Abre o jogo imediatamente na primeira fase ou na fase ativa!
      const firstFaseId = fases[0]?._id || `trilha_${id}`;
      router.push({
        pathname: '/game/[faseId]',
        params: { faseId: firstFaseId, trilhaId: id, modo: selectedMode },
      });
    }
  };

  // O usuário sempre visualiza a página da trilha com suas seções e fases, e clica para jogar
  const currentUserId = user?._id || user?.id;
  const isTeacherOrCreator = Boolean(
    (currentUserId && (
      trilha?.criadoPor === currentUserId ||
      (typeof trilha?.criadoPor === 'object' && (trilha?.criadoPor as any)?._id === currentUserId) ||
      (trilha as any)?.usuario === currentUserId ||
      (typeof (trilha as any)?.usuario === 'object' && (trilha as any)?.usuario?._id === currentUserId)
    )) ||
    user?.tipoUsuario === 'ADMINISTRADOR' ||
    user?.tipoUsuario === 'OWNER'
  );

  const isPrivateTrail = isTrilhaPrivada(trilha);

  const isPaidTrail = Boolean(
    trilha?.pagamento === 'Paga' ||
    Boolean(trilha?.preco && Number(trilha.preco) > 0)
  );

  const effectiveCode = isPrivateTrail ? (trilha?.codigoAcesso || localAccessCode || '') : '';

  const handleTeacherCopy = async (code: string) => {
    await copyToClipboard(code);
    setTeacherCodeCopied(true);
    setTimeout(() => setTeacherCodeCopied(false), 2500);
  };

  const handleStudentUnlock = async () => {
    if (!trilha || !studentCodeInput.trim()) {
      setStudentCodeError('Digite o código de acesso fornecido pelo professor.');
      return;
    }

    setStudentUnlocking(true);
    setStudentCodeError(null);

    const ok = await validateAndUnlockTrail(trilha, studentCodeInput);
    if (ok) {
      setIsUnlocked(true);
      setStudentCodeInput('');
      setStudentCodeError(null);
    } else {
      setStudentCodeError('Código de acesso incorreto. Verifique com seu professor.');
    }
    setStudentUnlocking(false);
  };

  // Se o aluno entrou via link direto de QR Code com parâmetro ?code=
  useEffect(() => {
    if (urlCode && trilha && !isUnlocked) {
      validateAndUnlockTrail(trilha, urlCode).then((ok) => {
        if (ok) {
          setIsUnlocked(true);
        }
      });
    }
  }, [urlCode, trilha, isUnlocked]);

  const handleScannerResult = async (parsed: { trilhaId?: string; code?: string; raw: string }) => {
    setScannerModalVisible(false);
    if (!trilha) return;

    const codeToTest = parsed.code || parsed.raw;
    const ok = await validateAndUnlockTrail(trilha, codeToTest);
    if (ok) {
      setIsUnlocked(true);
      setStudentCodeError(null);
    } else {
      setStudentCodeError('QR Code inválido para esta trilha.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!trilha) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Trilha não encontrada.</Text>
      </View>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO DAS TRILHAS ESPECÍFICAS POR MODO DE JOGO
  // =========================================================================

  const renderCampanhaTrack = () => (
    <>
      <Text style={[styles.sectionHeading, { color: colors.text }]}>Jornada de Aprendizado</Text>
      {secoes.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Esta trilha ainda não tem seções estruturadas.</Text>
      ) : (
        secoes.map((secao, secaoIdx) => {
          const fasesDaSecao = fases.filter((f) => f.secaoId === secao._id);
          const bannerColor = BANNER_COLORS[secaoIdx % BANNER_COLORS.length];

          return (
            <View key={secao._id} style={styles.secaoBlock}>
              <View style={[styles.secaoHeader, { backgroundColor: bannerColor }]}>
                <Text style={styles.secaoTitle}>{secao.titulo}</Text>
                {secao.descricao && <Text style={styles.secaoDesc}>{secao.descricao}</Text>}
              </View>

              <View style={styles.fasesContainer}>
                {fasesDaSecao.length === 0 ? (
                  <Text style={[styles.emptyFases, { color: colors.textMuted }]}>Nenhuma fase nesta seção.</Text>
                ) : (
                  fasesDaSecao.map((fase) => {
                    const isCompleted = fasesConcluidas.includes(fase._id);
                    const isActive = isPhaseActive(fase);
                    
                    let isPhaseUnlocked = false;
                    if (fases.indexOf(fase) === 0) {
                      isPhaseUnlocked = true;
                    } else {
                      const absoluteIndex = fases.indexOf(fase);
                      const prevFase = fases[absoluteIndex - 1];
                      isPhaseUnlocked = Boolean(prevFase && fasesConcluidas.includes(prevFase._id));
                    }

                    if (isCompleted) {
                      isPhaseUnlocked = true;
                    }

                    const globalIdx = fases.indexOf(fase);

                    return (
                      <View key={fase._id} style={[styles.faseNodeContainer, getZigZagStyle(globalIdx)]}>
                        {isActive && (
                          <View style={styles.avatarContainer}>
                            <Image
                              source={getCharacterImage(user?.personagem)}
                              style={styles.avatarImg}
                              resizeMode="contain"
                            />
                            <View style={styles.avatarPointer} />
                          </View>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.faseCircle,
                            {
                              backgroundColor: isCompleted
                                ? '#10B981'
                                : isPhaseUnlocked
                                ? '#4F46E5'
                                : '#374151',
                              borderColor: isCompleted
                                ? '#059669'
                                : isPhaseUnlocked
                                ? '#3730A3'
                                : '#1F2937',
                            },
                          ]}
                          disabled={!isPhaseUnlocked}
                          onPress={() =>
                            router.push({
                              pathname: '/game/[faseId]',
                              params: { faseId: fase._id, trilhaId: id, modo: 'campanha' },
                            })
                          }
                          activeOpacity={0.8}
                        >
                          {isCompleted ? (
                            <Check size={30} color="#ffffff" strokeWidth={3} />
                          ) : isPhaseUnlocked ? (
                            <Star size={30} color="#ffffff" fill="#ffffff" />
                          ) : (
                            <Lock size={26} color="#9CA3AF" />
                          )}
                        </TouchableOpacity>

                        <Text
                          style={[
                            styles.faseLabel,
                            { color: colors.text },
                            !isPhaseUnlocked && { color: colors.textMuted },
                          ]}
                          numberOfLines={2}
                        >
                          {fase.titulo}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })
      )}
    </>
  );

  const renderSpeedrunTrack = () => {
    const speedPhases = [
      { id: 1, title: fases[0]?.titulo || 'Aquecimento Veloz', time: 50, desc: 'Ritmo inicial para testar seus reflexos', bg: '#F59E0B' },
      { id: 2, title: fases[1]?.titulo || 'Pressão Crescente', time: 40, desc: 'O relógio acelera! Menos tempo por decisão', bg: '#D97706' },
      { id: 3, title: fases[2]?.titulo || 'Zona Crítica', time: 30, desc: 'Alta adrenalina: apenas 30 segundos no contador', bg: '#B45309' },
      { id: 4, title: fases[3]?.titulo || 'Sprint Final do Conhecimento', time: 20, desc: '20 segundos extremos! Apenas respostas imediatas', bg: '#78350F' },
    ];

    return (
      <View style={styles.specialModeContainer}>
        <View style={[styles.specialModeBanner, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
          <View style={styles.specialModeBannerHeader}>
            <View style={[styles.specialModeIconCircle, { backgroundColor: '#F59E0B' }]}>
              <Zap size={24} color="#ffffff" fill="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specialModeTitle, { color: colors.text }]}>TRILHA CONTRA O TEMPO</Text>
              <Text style={[styles.specialModeSubtitle, { color: '#F59E0B' }]}>Cronômetro Regressivo Decrescente</Text>
            </View>
          </View>
          <Text style={[styles.specialModeRuleDesc, { color: colors.textMuted }]}>
            ⏱️ Cada fase diminui seu tempo total no relógio! Respostas corretas concedem <Text style={{ color: '#FACC15', fontWeight: '800' }}>+3s de bônus</Text>, enquanto erros descontam <Text style={{ color: '#EF4444', fontWeight: '800' }}>5 segundos</Text>. Responda rápido antes que o tempo zere!
          </Text>
        </View>

        <View style={styles.speedrunCardsList}>
          {speedPhases.map((sp, idx) => {
            const relatedFase = fases[idx] || fases[0];
            const isCompleted = relatedFase ? speedrunConcluidas.includes(relatedFase._id) : false;
            const isUnlocked = idx === 0 || (fases[idx - 1] && speedrunConcluidas.includes(fases[idx - 1]._id));
            return (
              <TouchableOpacity
                key={sp.id}
                style={[
                  styles.speedrunPhaseCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isCompleted && { borderColor: '#10B981' },
                  !isUnlocked && { opacity: 0.6 },
                ]}
                disabled={!isUnlocked}
                onPress={() => handleIniciarModo('speedrun', relatedFase?._id)}
                activeOpacity={0.88}
              >
                <View style={[styles.speedrunTimeBadge, { backgroundColor: sp.bg }]}>
                  <Clock size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.speedrunTimeText}>{sp.time}s</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[styles.speedrunPhaseTitle, { color: colors.text }]} numberOfLines={1}>
                    Fase {sp.id}: {sp.title}
                  </Text>
                  <Text style={[styles.speedrunPhaseDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {sp.desc}
                  </Text>
                </View>

                <View style={[styles.speedrunActionCircle, { backgroundColor: isCompleted ? '#10B981' : isUnlocked ? '#F59E0B' : '#4B5563' }]}>
                  {isCompleted ? (
                    <Check size={18} color="#ffffff" strokeWidth={3} />
                  ) : isUnlocked ? (
                    <Play size={16} color="#ffffff" fill="#ffffff" />
                  ) : (
                    <Lock size={16} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.bigModeCtaBtn, { backgroundColor: '#F59E0B' }]}
          onPress={() => handleIniciarModo('speedrun')}
          activeOpacity={0.88}
        >
          <Zap size={22} color="#ffffff" fill="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.bigModeCtaText}>INICIAR DESAFIO CONTRA O TEMPO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTowerTrack = () => {
    const towerFloors = [
      { floor: 10, name: 'Mestre do Vazio Supremo', title: 'Chefe Final da Torre', icon: '👑', color: '#E11D48' },
      { floor: 9, name: 'Guardião da Meia-Noite', title: 'Cavaleiro Espectral', icon: '⚔️', color: '#9333EA' },
      { floor: 8, name: 'Arcano do Conhecimento', title: 'Mago Ancestral', icon: '🔮', color: '#7C3AED' },
      { floor: 7, name: 'Titã de Ferro Forjado', title: 'Defensor Pesado', icon: '🛡️', color: '#6366F1' },
      { floor: 6, name: 'Caçador das Sombras', title: 'Arqueira Mística', icon: '🏹', color: '#2563EB' },
      { floor: 5, name: 'Sentinela Veterana', title: 'Guerreiro de Elite', icon: '⚔️', color: '#0284C7' },
      { floor: 4, name: 'Gárgula do Labirinto', title: 'Fera Alada', icon: '💀', color: '#0D9488' },
      { floor: 3, name: 'Fera do Abismo', title: 'Monstro Rastejante', icon: '🐺', color: '#16A34A' },
      { floor: 2, name: 'Soldado das Trevas', title: 'Guarda da Entrada', icon: '🗡️', color: '#CA8A04' },
      { floor: 1, name: 'Primeiro Desafio', title: 'A Base da Torre', icon: '🌱', color: '#475569' },
    ];

    return (
      <View style={styles.specialModeContainer}>
        <View style={[styles.specialModeBanner, { borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.08)' }]}>
          <View style={styles.specialModeBannerHeader}>
            <View style={[styles.specialModeIconCircle, { backgroundColor: '#9333EA' }]}>
              <Shield size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specialModeTitle, { color: colors.text }]}>TORRE DO SABER</Text>
              <Text style={[styles.specialModeSubtitle, { color: '#C084FC' }]}>Desafio Vertical Estilo Mortal Kombat</Text>
            </View>
          </View>
          <Text style={[styles.specialModeRuleDesc, { color: colors.textMuted }]}>
            💀 <Text style={{ color: '#F43F5E', fontWeight: '900' }}>REGRA DA MORTE:</Text> A cada inimigo derrotado você sobe um degrau na torre. Se você morrer em qualquer andar, <Text style={{ color: '#F43F5E', fontWeight: '800' }}>volta tudo para o Andar 1</Text>!
          </Text>

          <View style={styles.towerStatsRow}>
            <View style={styles.towerStatCard}>
              <Text style={styles.towerStatLabel}>ANDAR ATUAL</Text>
              <Text style={[styles.towerStatVal, { color: '#FACC15' }]}>{towerFloor}º ANDAR</Text>
            </View>
            <View style={styles.towerStatCard}>
              <Text style={styles.towerStatLabel}>MELHOR RECORDE</Text>
              <Text style={[styles.towerStatVal, { color: '#34D399' }]}>{Math.max(towerFloor, towerRecord)}º ANDAR</Text>
            </View>
          </View>
        </View>

        <View style={styles.mkTowerContainer}>
          {towerFloors.map((tf) => {
            const isConquered = tf.floor < towerFloor;
            const isCurrent = tf.floor === towerFloor;
            const isLocked = tf.floor > towerFloor;

            return (
              <View
                key={tf.floor}
                style={[
                  styles.mkFloorRung,
                  { backgroundColor: isCurrent ? 'rgba(234, 179, 8, 0.15)' : colors.card },
                  isCurrent && { borderColor: '#FACC15', borderWidth: 2.5 },
                  isConquered && { borderColor: '#10B981', opacity: 0.8 },
                  isLocked && { borderColor: colors.border, opacity: 0.55 },
                ]}
              >
                <View style={[styles.mkFloorBadge, { backgroundColor: isCurrent ? '#FACC15' : tf.color }]}>
                  <Text style={[styles.mkFloorNumber, isCurrent && { color: '#000000' }]}>{tf.floor}</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[styles.mkFloorName, { color: isCurrent ? '#FACC15' : colors.text }]}>
                    {tf.icon} {tf.name}
                  </Text>
                  <Text style={[styles.mkFloorTitle, { color: colors.textMuted }]}>
                    {tf.title}
                  </Text>
                </View>

                {isCurrent && (
                  <View style={styles.mkCurrentIndicator}>
                    <Image
                      source={getCharacterImage(user?.personagem)}
                      style={styles.mkAvatarSmall}
                      resizeMode="contain"
                    />
                    <Text style={styles.mkCurrentText}>VOCÊ ESTÁ AQUI</Text>
                  </View>
                )}

                {isConquered && (
                  <View style={styles.mkConqueredBadge}>
                    <Check size={16} color="#10B981" strokeWidth={3} />
                    <Text style={styles.mkConqueredText}>VENCIDO</Text>
                  </View>
                )}

                {isLocked && (
                  <Lock size={18} color={colors.textMuted} />
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.bigModeCtaBtn, { backgroundColor: '#9333EA' }]}
          onPress={() => handleIniciarModo('sobrevivencia')}
          activeOpacity={0.88}
        >
          <Shield size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.bigModeCtaText}>DESAFIAR ANDAR {towerFloor} DA TORRE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBossRushTrack = () => {
    const bossList = [
      { id: 1, name: 'Guardião de Pedra', hp: 150, trait: 'Golpes Sísmicos & Defesa Alta', icon: '🛡️', color: '#D97706' },
      { id: 2, name: 'Spectre da Meia-Noite', hp: 175, trait: 'Respostas Rápidas & Dano Veloz', icon: '❄️', color: '#3B82F6' },
      { id: 3, name: 'Arquimago das Sombras', hp: 200, trait: 'QTEs Arcanos & Magia Pesada', icon: '🔮', color: '#8B5CF6' },
      { id: 4, name: 'Soberano do Conhecimento', hp: 250, trait: 'O Titã Final da Trilha', icon: '👑', color: '#EF4444' },
    ];

    return (
      <View style={styles.specialModeContainer}>
        <View style={[styles.specialModeBanner, { borderColor: '#F43F5E', backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}>
          <View style={styles.specialModeBannerHeader}>
            <View style={[styles.specialModeIconCircle, { backgroundColor: '#E11D48' }]}>
              <Trophy size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specialModeTitle, { color: colors.text }]}>ARENA DOS MESTRES</Text>
              <Text style={[styles.specialModeSubtitle, { color: '#FDA4AF' }]}>Boss Rush: Duelo Consecutivo de Titãs</Text>
            </View>
          </View>
          <Text style={[styles.specialModeRuleDesc, { color: colors.textMuted }]}>
            🩸 <Text style={{ color: '#F43F5E', fontWeight: '900' }}>VIDA CONSECUTIVA:</Text> Apenas Chefes Poderosos! Sua vida <Text style={{ color: '#F43F5E', fontWeight: '800' }}>NÃO regenera entre as fases</Text>: você inicia o combate com a mesma vida que sobrou do chefe anterior. Sobreviva à sequência inteira!
          </Text>
        </View>

        <View style={styles.bossRushList}>
          {bossList.map((boss, idx) => {
            const relatedFase = fases[idx] || fases[0];
            const isCompleted = relatedFase ? bossRushConcluidas.includes(relatedFase._id) : false;
            const isUnlocked = idx === 0 || (fases[idx - 1] && bossRushConcluidas.includes(fases[idx - 1]._id));

            return (
              <View
                key={boss.id}
                style={[
                  styles.bossCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isCompleted && { borderColor: '#10B981' },
                  !isUnlocked && { opacity: 0.6 },
                ]}
              >
                <View style={[styles.bossAvatarCircle, { backgroundColor: boss.color }]}>
                  <Text style={styles.bossAvatarIcon}>{boss.icon}</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.bossCardName, { color: colors.text }]}>{boss.name}</Text>
                    <View style={styles.bossHpPill}>
                      <Text style={styles.bossHpText}>{boss.hp} HP</Text>
                    </View>
                  </View>
                  <Text style={[styles.bossTraitText, { color: colors.textMuted }]}>{boss.trait}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bossFightBtn,
                    { backgroundColor: isCompleted ? '#10B981' : isUnlocked ? boss.color : '#4B5563' },
                  ]}
                  disabled={!isUnlocked}
                  onPress={() => handleIniciarModo('boss_rush', relatedFase?._id, idx)}
                  activeOpacity={0.85}
                >
                  {isCompleted ? (
                    <>
                      <Check size={16} color="#ffffff" strokeWidth={3} style={{ marginRight: 4 }} />
                      <Text style={styles.bossFightBtnText}>Venceu</Text>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Swords size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.bossFightBtnText}>Duelo</Text>
                    </>
                  ) : (
                    <>
                      <Lock size={15} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.bossFightBtnText}>Bloq.</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.bigModeCtaBtn, { backgroundColor: '#E11D48' }]}
          onPress={() => handleIniciarModo('boss_rush', undefined, 0)}
          activeOpacity={0.88}
        >
          <Trophy size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.bigModeCtaText}>ENTRAR NA ARENA DOS MESTRES</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMundoAbertoTrack = () => {
    const npcs = [
      { id: 1, name: 'Mestre Valerius', role: 'Arquivista Ancestral', tip: 'Ensina segredos da história das trilhas e memorização ativa.', icon: '🧙‍♂️' },
      { id: 2, name: 'Sophia', role: 'A Exploradora', tip: 'Compartilha rotas do vale, orientação geográfica e curiosidades.', icon: '🏹' },
      { id: 3, name: 'Boran', role: 'O Guardião', tip: 'Treina foco inabalável, postura e disciplina de guerreiro.', icon: '🛡️' },
      { id: 4, name: 'Roland', role: 'O Andarilho', tip: 'Dicas práticas de raciocínio lógico e resolução de problemas.', icon: '⚔️' },
    ];

    return (
      <View style={styles.specialModeContainer}>
        <View style={[styles.specialModeBanner, { borderColor: '#0284C7', backgroundColor: 'rgba(2, 132, 199, 0.08)' }]}>
          <View style={styles.specialModeBannerHeader}>
            <View style={[styles.specialModeIconCircle, { backgroundColor: '#0284C7' }]}>
              <Compass size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specialModeTitle, { color: colors.text }]}>MUNDO ABERTO</Text>
              <Text style={[styles.specialModeSubtitle, { color: '#38BDF8' }]}>Exploração Livre 2D • Converse com NPCs</Text>
            </View>
          </View>
          <Text style={[styles.specialModeRuleDesc, { color: colors.textMuted }]}>
            🌍 Ande livremente com seu herói pelo vale panorâmico, explore diferentes áreas e converse com mentores para aprender lições valiosas. <Text style={{ color: '#38BDF8', fontWeight: '800' }}>Sem relógio, sem perda de vida e sem pressão de XP</Text>!
          </Text>
        </View>

        <View style={[styles.controlsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.controlsTitle, { color: colors.text }]}>🎮 Como Jogar no Mundo Aberto:</Text>
          <Text style={[styles.controlsLine, { color: colors.textMuted }]}>
            • <Text style={{ color: '#FACC15', fontWeight: '700' }}>PC / Teclado:</Text> Use [W][A][S][D] ou as Setas para andar, [E] para conversar com NPCs e [Espaço] para pular.
          </Text>
          <Text style={[styles.controlsLine, { color: colors.textMuted }]}>
            • <Text style={{ color: '#38BDF8', fontWeight: '700' }}>Celular / Toque:</Text> Use o D-Pad virtual no canto inferior esquerdo e o botão [💬 Conversar] ao se aproximar de um mentor.
          </Text>
        </View>

        <Text style={[styles.npcSectionTitle, { color: colors.text }]}>Sábios & Mentores no Mapa:</Text>
        <View style={styles.npcGrid}>
          {npcs.map((npc) => (
            <View key={npc.id} style={[styles.npcCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.npcHeaderRow}>
                <Text style={styles.npcEmoji}>{npc.icon}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.npcName, { color: colors.text }]}>{npc.name}</Text>
                  <Text style={styles.npcRole}>{npc.role}</Text>
                </View>
              </View>
              <Text style={[styles.npcTipText, { color: colors.textMuted }]}>{npc.tip}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.bigModeCtaBtn, { backgroundColor: '#0284C7' }]}
          onPress={() => {
            router.push({
              pathname: '/game/[faseId]',
              params: { faseId: `mundo_aberto_${id}`, trilhaId: id, modo: 'mundo_aberto' },
            });
          }}
          activeOpacity={0.88}
        >
          <Compass size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.bigModeCtaText}>ENTRAR NO MUNDO ABERTO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleVoltarDaTrilha = () => {
    // Retorna com segurança garantida para a Home sem cair em loop de histórico
    router.replace('/(tabs)/home');
  };

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
      {/* Top Header Buttons */}
      <View style={styles.headerButtonsRow}>
        <TouchableOpacity style={styles.headerCircleBtn} onPress={handleVoltarDaTrilha} activeOpacity={0.8}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Botão Acessibilidade */}
          <TouchableOpacity
            style={[styles.headerCircleBtn, { backgroundColor: '#FFFFFF', borderColor: '#0284C7', borderWidth: 2 }]}
            onPress={openAccessibilityModal}
            accessibilityRole="button"
            accessibilityLabel="Acessibilidade e Alto Contraste"
            activeOpacity={0.8}
          >
            <AccessibilityIcon size={22} color="#000000" accentColor="#00AEEF" />
          </TouchableOpacity>

          {/* Botão Guia */}
          <TouchableOpacity style={styles.headerCircleBtn} onPress={() => setShowGuide(true)} activeOpacity={0.8}>
            <HelpCircle size={22} color="#ffffff" />
          </TouchableOpacity>

          {/* Botão Salvar */}
          <TouchableOpacity style={styles.headerCircleBtn} onPress={handleToggleSave} activeOpacity={0.8}>
            <Bookmark size={22} color={isSaved ? '#F59E0B' : '#ffffff'} fill={isSaved ? '#F59E0B' : 'transparent'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header da Trilha */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <Image
          source={getTrackImage(trilha)}
          style={styles.trackHeaderCover}
          resizeMode="cover"
        />
        <View style={{ padding: 16 }}>
          {/* Badges de Pagamento e Disponibilidade */}
          <View style={styles.detailBadgesRow}>
            {isPaidTrail && isPurchased ? (
              <View style={[styles.detailBadge, styles.badgePurchased]}>
                <CheckCircle2 size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.detailBadgeText}>Adquirida ✓</Text>
              </View>
            ) : (
              <View style={[styles.detailBadge, isPaidTrail ? styles.badgePaid : styles.badgeFree]}>
                {isPaidTrail ? <DollarSign size={12} color="#ffffff" style={{ marginRight: 3 }} /> : null}
                <Text style={styles.detailBadgeText}>
                  {isPaidTrail
                    ? `Paga • R$ ${Number(trilha.preco || 29.9).toFixed(2).replace('.', ',')}`
                    : 'Gratuita'}
                </Text>
              </View>
            )}
            <View style={[styles.detailBadge, isPrivateTrail ? styles.badgePrivate : styles.badgePublic]}>
              {isPrivateTrail ? (
                <>
                  <Lock size={12} color="#ffffff" style={{ marginRight: 3 }} />
                  <Text style={styles.detailBadgeText}>Privada</Text>
                </>
              ) : (
                <>
                  <Globe size={12} color="#ffffff" style={{ marginRight: 3 }} />
                  <Text style={styles.detailBadgeText}>Aberta</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.trackSubject}>{trilha.materia.toUpperCase()}</Text>
          <Text style={[styles.trackTitle, { color: colors.text }]}>{trilha.titulo}</Text>
          {trilha.descricao && <Text style={[styles.trackDesc, { color: colors.textMuted }]}>{trilha.descricao}</Text>}
        </View>

        {/* Botão de Compra no Header (se for paga e não foi comprada) */}
        {!isUnlocked && isPaidTrail && !isPurchased && (
          <TouchableOpacity
            style={styles.buyHeaderBtn}
            onPress={() => setCheckoutModalVisible(true)}
            activeOpacity={0.9}
          >
            <CreditCard size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.buyHeaderBtnText}>
              Comprar por R$ {Number(trilha.preco || 29.9).toFixed(2).replace('.', ',')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botão de Ação / Iniciar ou Continuar Jogo (apenas se desbloqueada) */}
        {isUnlocked && (
          <View style={{ marginTop: 12 }}>
            {/* Seletor de Modo de Jogo */}
            <View style={styles.gameModeSection}>
              <View style={styles.gameModeHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Swords size={16} color="#FACC15" />
                  <Text style={[styles.gameModeSectionTitle, { color: colors.text }]}>Modo de Batalha:</Text>
                </View>
                <View style={styles.modeXpBadge}>
                  <Text style={styles.modeXpBadgeText}>
                    {GAME_MODES_CONFIG[selectedMode]?.xpMultiplier > 0 ? `${GAME_MODES_CONFIG[selectedMode].xpMultiplier}x XP` : 'Sem XP'}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gameModesRow}
              >
                {(Object.keys(GAME_MODES_CONFIG) as GameModeId[]).map((modeKey) => {
                  const mode = GAME_MODES_CONFIG[modeKey];
                  const isSelected = selectedMode === modeKey;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.modeCard,
                        { backgroundColor: colors.card, borderColor: isSelected ? '#FACC15' : colors.border },
                        isSelected && styles.modeCardSelected,
                      ]}
                      onPress={() => setSelectedMode(mode.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.modeCardTop}>
                        <View style={[styles.modeIconBox, isSelected && styles.modeIconBoxSelected]}>
                          {mode.id === 'campanha' && <Swords size={18} color={isSelected ? '#FACC15' : '#818CF8'} />}
                          {mode.id === 'speedrun' && <Zap size={18} color={isSelected ? '#FACC15' : '#F59E0B'} />}
                          {mode.id === 'sobrevivencia' && <Shield size={18} color={isSelected ? '#FACC15' : '#34D399'} />}
                          {mode.id === 'boss_rush' && <Trophy size={18} color={isSelected ? '#FACC15' : '#F43F5E'} />}
                          {mode.id === 'mundo_aberto' && <Compass size={18} color={isSelected ? '#FACC15' : '#38BDF8'} />}
                        </View>
                        <View style={[styles.modeMultiplierPill, isSelected && styles.modeMultiplierPillSelected]}>
                          <Text style={styles.modeMultiplierText}>
                            {mode.xpMultiplier > 0 ? `${mode.xpMultiplier}x XP` : 'Sem XP'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.modeName, { color: isSelected ? '#FACC15' : colors.text }]}>
                        {mode.name}
                      </Text>
                      <Text style={[styles.modeTagline, { color: colors.textMuted }]} numberOfLines={1}>
                        {mode.tagline}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {!iniciada ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleIniciarTrilha}
                disabled={loadingAction}
                activeOpacity={0.9}
              >
                {loadingAction ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>⚔️ Iniciar Trilha & Jogar</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 12, marginTop: 14 }}>
                {/* Botão de Jogar / Continuar Batalha */}
                <TouchableOpacity
                  style={styles.playNowBtn}
                  onPress={() => {
                    const activeFase = fases.find((f) => !fasesConcluidas.includes(f._id)) || fases[0];
                    const targetFase = activeFase?._id || `trilha_${id}`;
                    router.push({
                      pathname: '/game/[faseId]',
                      params: { faseId: targetFase, trilhaId: id, modo: selectedMode },
                    });
                  }}
                  activeOpacity={0.88}
                >
                <View style={styles.playNowIconBox}>
                  <Zap size={20} color="#ffffff" fill="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playNowTitle}>JOGAR TRILHA</Text>
                  <Text style={styles.playNowSubtitle} numberOfLines={1}>
                    {fases.find((f) => !fasesConcluidas.includes(f._id))?.titulo || 'Continuar Batalha'}
                  </Text>
                </View>
                <ArrowRight size={22} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.progressSummary}>
                <Text style={[styles.progressSummaryText, { color: colors.text }]}>
                  Progresso: {fasesConcluidas.length} de {fases.length} fases completadas
                </Text>
                <View style={[styles.progressBg, { backgroundColor: colors.cardSecondary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(fasesConcluidas.length / (fases.length || 1)) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
            )}
          </View>
        )}
      </View>

      {/* Box Exclusiva para o Professor ver o Código da Trilha Privada */}
      {isPrivateTrail && isTeacherOrCreator && Boolean(effectiveCode) && (
        <View style={styles.teacherCodeCard}>
          <View style={styles.teacherCodeHeader}>
            <Key size={22} color="#F59E0B" />
            <Text style={styles.teacherCodeTitle}>Código de Acesso dos Alunos</Text>
          </View>
          <Text style={styles.teacherCodeDesc}>
            Apenas você (professor criador) e administradores conseguem ver este código. Passe para seus alunos para que eles possam desbloquear esta trilha:
          </Text>

          <View style={styles.teacherCodeBox}>
            <Text style={styles.teacherCodeText}>{effectiveCode}</Text>
          </View>

          <View style={styles.teacherActionsRow}>
            <TouchableOpacity
              style={styles.teacherCopyBtn}
              onPress={() => handleTeacherCopy(effectiveCode)}
              activeOpacity={0.85}
            >
              {teacherCodeCopied ? (
                <>
                  <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.teacherCopyBtnText}>Código Copiado!</Text>
                </>
              ) : (
                <>
                  <Copy size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.teacherCopyBtnText}>Copiar Código</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.teacherQrBtn}
              onPress={() => setQrModalVisible(true)}
              activeOpacity={0.85}
            >
              <QrCode size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.teacherQrBtnText}>Ver QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Conteúdo: Bloqueado (se for paga/privada e aluno não adquiriu) OU Desbloqueado com Jornada */}
      {!isUnlocked ? (
        isPaidTrail && !isPurchased ? (
          <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
            <View style={styles.lockedIconBubblePaid}>
              <CreditCard size={36} color="#ffffff" />
            </View>
            <Text style={[styles.lockedTitle, { color: colors.text }]}>Trilha Paga Exclusiva</Text>
            <Text style={[styles.lockedDesc, { color: colors.textMuted }]}>
              Esta trilha requer aquisição para liberação de todas as fases, exercícios e quizzes interativos.
            </Text>

            {/* Split de Transparência */}
            <View style={[styles.splitPreviewCard, { backgroundColor: colors.cardSecondary }]}>
              <View style={styles.splitPreviewHeader}>
                <Percent size={16} color="#16A34A" />
                <Text style={[styles.splitPreviewTitle, { color: colors.text }]}>
                  Divisão de Valores da Compra
                </Text>
              </View>
              <View style={styles.splitPreviewRow}>
                <View style={styles.splitPreviewItem}>
                  <Text style={styles.splitPreviewLabel}>Professor (85%):</Text>
                  <Text style={styles.splitPreviewValProf}>
                    R$ {(Number(trilha.preco || 29.9) * 0.85).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.splitPreviewItem}>
                  <Text style={styles.splitPreviewLabel}>EstudeMy (15%):</Text>
                  <Text style={styles.splitPreviewValEstude}>
                    R$ {(Number(trilha.preco || 29.9) * 0.15).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
              <Text style={styles.splitPreviewHint}>
                A maior parte da sua compra (85%) remunera diretamente o professor autor.
              </Text>
            </View>

            {/* Formas de Pagamento Aceitas (PIX e Cartão de Crédito) */}
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodOptionBtn,
                  { backgroundColor: colors.cardSecondary, borderColor: '#10B981' },
                ]}
                onPress={() => {
                  setSelectedPaymentMethod('PIX');
                  setCheckoutModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodIconPix}>
                  <QrCode size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Pagar com PIX</Text>
                  <Text style={styles.paymentMethodSubtitle}>Liberação imediata via QR Code</Text>
                </View>
                <ArrowRight size={18} color="#10B981" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOptionBtn,
                  { backgroundColor: colors.cardSecondary, borderColor: '#4F46E5' },
                ]}
                onPress={() => {
                  setSelectedPaymentMethod('CARTAO');
                  setCheckoutModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.paymentMethodIconCard}>
                  <CreditCard size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Cartão de Crédito</Text>
                  <Text style={styles.paymentMethodSubtitle}>Parcelamento em até 12x</Text>
                </View>
                <ArrowRight size={18} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Botão de Compra Principal */}
            <TouchableOpacity
              style={styles.buyNowBtn}
              onPress={() => {
                setSelectedPaymentMethod('PIX');
                setCheckoutModalVisible(true);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.buyNowBtnText}>
                Comprar por R$ {Number(trilha.preco || 29.9).toFixed(2).replace('.', ',')}
              </Text>
            </TouchableOpacity>

            {/* Se tiver código de cortesia/acesso concedido pelo professor */}
            <View style={styles.couponDividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OU POSSUI UM CÓDIGO?
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {studentCodeError && (
              <View style={styles.lockedErrorCard}>
                <Text style={styles.lockedErrorText}>{studentCodeError}</Text>
              </View>
            )}

            <TextInput
              style={[
                styles.lockedCodeInput,
                { backgroundColor: colors.cardSecondary, color: colors.text },
              ]}
              placeholder="Digite o código de acesso"
              placeholderTextColor={colors.textMuted}
              value={studentCodeInput}
              onChangeText={(txt) => {
                setStudentCodeInput(txt.toUpperCase());
                setStudentCodeError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.lockedSubmitBtn}
              onPress={handleStudentUnlock}
              disabled={studentUnlocking}
              activeOpacity={0.85}
            >
              {studentUnlocking ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.lockedSubmitBtnText}>Liberar com Código</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
            <View style={styles.lockedIconBubble}>
              <Lock size={36} color="#ffffff" />
            </View>
            <Text style={[styles.lockedTitle, { color: colors.text }]}>Conteúdo Bloqueado</Text>
            <Text style={[styles.lockedDesc, { color: colors.textMuted }]}>
              Esta trilha é privada e requer o código de acesso exclusivo fornecido pelo seu professor para liberar o conteúdo e as lições.
            </Text>

            {studentCodeError && (
              <View style={styles.lockedErrorCard}>
                <Text style={styles.lockedErrorText}>{studentCodeError}</Text>
              </View>
            )}

            <TextInput
              style={[
                styles.lockedCodeInput,
                { backgroundColor: colors.cardSecondary, color: colors.text },
              ]}
              placeholder="Ex: TRL-8K4M9Q"
              placeholderTextColor={colors.textMuted}
              value={studentCodeInput}
              onChangeText={(txt) => {
                setStudentCodeInput(txt.toUpperCase());
                setStudentCodeError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.lockedButtonsCol}>
              <TouchableOpacity
                style={styles.lockedSubmitBtn}
                onPress={handleStudentUnlock}
                disabled={studentUnlocking}
                activeOpacity={0.85}
              >
                {studentUnlocking ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.lockedSubmitBtnText}>Desbloquear com Código</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lockedScanQrBtn}
                onPress={() => setScannerModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.lockedScanQrBtnText}>Ler QR Code da Trilha</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <>
          {selectedMode === 'campanha' && renderCampanhaTrack()}
          {selectedMode === 'speedrun' && renderSpeedrunTrack()}
          {selectedMode === 'sobrevivencia' && renderTowerTrack()}
          {selectedMode === 'boss_rush' && renderBossRushTrack()}
          {selectedMode === 'mundo_aberto' && renderMundoAbertoTrack()}
        </>
      )}

      {/* Modal do Guia de Estudos estilo Duolingo */}
      <Modal
        visible={showGuide}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderTopColor: isDark ? '#1b1b1b' : '#E5E7EB', paddingBottom: Math.max(insets.bottom + 16, 16) }]}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('trail.guideTitle') || 'Guia da Trilha'}</Text>
              <TouchableOpacity onPress={() => setShowGuide(false)} style={styles.closeModalBtn}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {t('trail.guideSubtitle') || 'Entenda como funciona a plataforma!'}
            </Text>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { borderBottomColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  guideTab === 'trail' && { borderBottomColor: '#4F46E5', borderBottomWidth: 3 },
                ]}
                onPress={() => setGuideTab('trail')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    guideTab === 'trail' && { color: '#4F46E5', fontWeight: '900' },
                  ]}
                >
                  {t('trail.guideTabTrail') || 'A Trilha'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  guideTab === 'game' && { borderBottomColor: '#F59E0B', borderBottomWidth: 3 },
                ]}
                onPress={() => setGuideTab('game')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    guideTab === 'game' && { color: '#F59E0B', fontWeight: '900' },
                  ]}
                >
                  {t('trail.guideTabGame') || 'O Jogo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  guideTab === 'tips' && { borderBottomColor: '#10B981', borderBottomWidth: 3 },
                ]}
                onPress={() => setGuideTab('tips')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    guideTab === 'tips' && { color: '#10B981', fontWeight: '900' },
                  ]}
                >
                  {t('trail.guideTabTips') || 'Dicas'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conteúdo da Tab */}
            <ScrollView style={styles.modalScrollView} contentContainerStyle={{ paddingVertical: 16 }}>
              {guideTab === 'trail' && (
                <View style={styles.guideTabContent}>
                  <Text style={[styles.guideIntroText, { color: colors.text }]}>
                    {t('trail.guideTrailIntro') || 'Sua jornada é organizada em uma trilha linear.'}
                  </Text>
                  
                  {/* Status das Fases */}
                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <View style={[styles.badgeIndicator, { backgroundColor: '#374151', borderColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
                      <Lock size={16} color="#9CA3AF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideStatusLockedTitle') || 'Bloqueada'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideStatusLockedDesc') || 'Fases futuras que você ainda não pode acessar.'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <View style={[styles.badgeIndicator, { backgroundColor: '#4F46E5', borderColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
                      <Star size={16} color="#ffffff" fill="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideStatusAvailableTitle') || 'Disponível'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideStatusAvailableDesc') || 'A fase atual onde você deve jogar!'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <View style={[styles.badgeIndicator, { backgroundColor: '#10B981', borderColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
                      <Check size={16} color="#ffffff" strokeWidth={3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideStatusCompletedTitle') || 'Concluída'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideStatusCompletedDesc') || 'Fases que você já finalizou com sucesso.'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {guideTab === 'game' && (
                <View style={styles.guideTabContent}>
                  <Text style={[styles.guideIntroText, { color: colors.text }]}>
                    {t('trail.guideGameIntro') || 'Estude jogando como em um RPG!'}
                  </Text>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <Heart size={24} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideGameLivesTitle') || 'Vidas'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideGameLivesDesc') || 'Você começa cada Quiz com vidas.'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <Coins size={24} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideGameCoinsTitle') || 'Moedas'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideGameCoinsDesc') || 'Sua recompensa de ouro!'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <Zap size={24} color="#3B82F6" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideGameXpTitle') || 'Experiência (XP)'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideGameXpDesc') || 'Pontos de experiência recebidos.'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {guideTab === 'tips' && (
                <View style={styles.guideTabContent}>
                  <Text style={[styles.guideIntroText, { color: colors.text }]}>
                    {t('trail.guideTipsIntro') || 'Torne-se um estudante lendário com estas estratégias:'}
                  </Text>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <Trophy size={24} color="#EAB308" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideTipsRankingTitle') || 'Lidere o Ranking'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideTipsRankingDesc') || 'Suba de nível para escalar a tabela.'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.guideCard, { borderColor: isDark ? '#1b1b1b' : '#E5E7EB', backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <Book size={24} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideCardTitle, { color: colors.text }]}>
                        {t('trail.guideTipsReadTitle') || 'Teoria Primeiro'}
                      </Text>
                      <Text style={[styles.guideCardDesc, { color: colors.textMuted }]}>
                        {t('trail.guideTipsReadDesc') || 'Sempre leia as fases de Conteúdo antes.'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Rodapé Close */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGuide(false)} activeOpacity={0.9}>
              <Text style={styles.closeButtonText}>{t('trail.guideClose') || 'Entendi, vamos jogar!'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Exibição de QR Code da Trilha */}
      {trilha && (
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          trilhaId={trilha._id}
          trilhaTitulo={trilha.titulo}
          codigoAcesso={effectiveCode}
        />
      )}

      {/* Modal de Leitura de QR Code pelo Aluno */}
      <QRScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onScanSuccess={handleScannerResult}
      />

      {/* Modal de Checkout / Compra da Trilha */}
      {trilha && (
        <CheckoutModal
          visible={checkoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          trilha={trilha}
          initialMetodo={selectedPaymentMethod}
          onSuccess={async () => {
            setIsPurchased(true);
            setIsUnlocked(true);
            await fetchTrilhaDetails();
          }}
        />
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerCircleBtn: {
    backgroundColor: '#1b1b1b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: 28,
    overflow: 'hidden',
  },
  trackHeaderCover: {
    width: '100%',
    height: 180,
    borderBottomWidth: 3,
    borderBottomColor: '#1b1b1b',
  },
  cardDark: {
    backgroundColor: '#2D2D44',
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  trackSubject: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8', // sky-400
    letterSpacing: 1,
    marginBottom: 6,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  trackDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: '#16A34A', // green-600
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  gameModeSection: {
    marginBottom: 14,
  },
  gameModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  gameModeSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modeXpBadge: {
    backgroundColor: '#854D0E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  modeXpBadgeText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '900',
  },
  gameModesRow: {
    gap: 10,
    paddingBottom: 4,
  },
  modeCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeCardSelected: {
    borderColor: '#FACC15',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  modeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconBoxSelected: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  modeMultiplierPill: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeMultiplierPillSelected: {
    backgroundColor: '#713F12',
  },
  modeMultiplierText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '800',
  },
  modeName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeTagline: {
    fontSize: 10,
  },
  playNowBtn: {
    backgroundColor: '#4F46E5', // indigo-600
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  playNowIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#3730A3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playNowTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  playNowSubtitle: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  progressSummary: {
    marginTop: 18,
  },
  progressSummaryText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBg: {
    height: 12,
    backgroundColor: '#1E1E2F',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // emerald-500
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
  },
  secaoBlock: {
    marginBottom: 36,
  },
  secaoHeader: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginVertical: 20,
  },
  secaoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  secaoDesc: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.95,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  fasesContainer: {
    alignItems: 'center',
    marginVertical: 10,
    gap: 20,
  },
  faseNodeContainer: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
    width: 140,
  },
  faseCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  faseLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
    width: 130,
    lineHeight: 16,
  },
  avatarContainer: {
    position: 'absolute',
    top: -54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarImg: {
    width: 44,
    height: 44,
    backgroundColor: '#374151',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  avatarPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1b1b1b',
    alignSelf: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyFases: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#1b1b1b',
    padding: 20,
    height: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalScrollView: {
    flex: 1,
  },
  guideTabContent: {
    gap: 16,
  },
  guideIntroText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  guideCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  badgeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  guideCardDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  detailBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  detailBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  badgeFree: {
    backgroundColor: '#10B981',
  },
  badgePaid: {
    backgroundColor: '#F59E0B',
  },
  badgePublic: {
    backgroundColor: '#3B82F6',
  },
  badgePrivate: {
    backgroundColor: '#8B5CF6',
  },
  badgePurchased: {
    backgroundColor: '#16A34A',
  },
  buyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buyHeaderBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  lockedIconBubblePaid: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F46E5',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitPreviewCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginVertical: 14,
  },
  splitPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  splitPreviewTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  splitPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  splitPreviewItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  splitPreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  splitPreviewValProf: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 2,
  },
  splitPreviewValEstude: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4F46E5',
    marginTop: 2,
  },
  splitPreviewHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  paymentMethodsRow: {
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  paymentMethodOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  paymentMethodIconPix: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  paymentMethodIconCard: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  paymentMethodSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 12,
  },
  buyNowBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  couponDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#374151',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  teacherCodeCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#F59E0B',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  teacherCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  teacherCodeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F59E0B',
  },
  teacherCodeDesc: {
    fontSize: 12.5,
    color: '#D4D4D8',
    lineHeight: 18,
    marginBottom: 14,
  },
  teacherCodeBox: {
    backgroundColor: '#09090B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  teacherCodeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  teacherCopyBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  teacherCopyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  lockedCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginVertical: 16,
  },
  lockedIconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#8B5CF6',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  lockedErrorCard: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    marginBottom: 14,
  },
  lockedErrorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedCodeInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lockedSubmitBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  lockedSubmitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  teacherActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  teacherQrBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  teacherQrBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  lockedButtonsCol: {
    width: '100%',
    gap: 10,
  },
  lockedScanQrBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  lockedScanQrBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  // =========================================================================
  // ESTILOS DOS MODOS ESPECIAIS DE JOGO
  // =========================================================================
  specialModeContainer: {
    marginTop: 12,
    paddingBottom: 24,
  },
  specialModeBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  specialModeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  specialModeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialModeTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  specialModeSubtitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  specialModeRuleDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  speedrunCardsList: {
    gap: 10,
    marginBottom: 16,
  },
  speedrunPhaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  speedrunTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  speedrunTimeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  speedrunPhaseTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  speedrunPhaseDesc: {
    fontSize: 11,
  },
  speedrunActionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigModeCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bigModeCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  towerStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  towerStatCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  towerStatLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  towerStatVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  mkTowerContainer: {
    gap: 8,
    marginBottom: 16,
  },
  mkFloorRung: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  mkFloorBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mkFloorNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  mkFloorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  mkFloorTitle: {
    fontSize: 11,
  },
  mkCurrentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  mkAvatarSmall: {
    width: 22,
    height: 22,
  },
  mkCurrentText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
  },
  mkConqueredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mkConqueredText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  bossRushList: {
    gap: 10,
    marginBottom: 16,
  },
  bossCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  bossAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossAvatarIcon: {
    fontSize: 20,
  },
  bossCardName: {
    fontSize: 13,
    fontWeight: '800',
  },
  bossHpPill: {
    backgroundColor: '#450A0A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  bossHpText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  bossTraitText: {
    fontSize: 11,
    marginTop: 2,
  },
  bossFightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bossFightBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  controlsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  controlsLine: {
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 4,
  },
  npcSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  npcGrid: {
    gap: 10,
    marginBottom: 16,
  },
  npcCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  npcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  npcEmoji: {
    fontSize: 24,
  },
  npcName: {
    fontSize: 13,
    fontWeight: '800',
  },
  npcRole: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  npcTipText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
