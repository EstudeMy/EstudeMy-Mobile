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
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function TrilhaDetailScreen() {
  const { id, code: urlCode } = useLocalSearchParams<{ id: string; code?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
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

  // Modais de QR Code
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'trail' | 'game' | 'tips'>('trail');

  const SAVED_TRAILS_KEY = 'saved_trails_list';
  const isInitialLoadRef = useRef(true);

  // Carrega se a trilha está salva
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!id) return;
      try {
        const listJson = await SecureStore.getItemAsync(SAVED_TRAILS_KEY);
        if (listJson) {
          const list = JSON.parse(listJson) as string[];
          setIsSaved(list.includes(id));
        }
      } catch (e) {
        console.error('Error checking saved status:', e);
      }
    };
    checkSavedStatus();
  }, [id]);

  const handleToggleSave = async () => {
    if (!id) return;
    try {
      const listJson = await SecureStore.getItemAsync(SAVED_TRAILS_KEY);
      let list = listJson ? (JSON.parse(listJson) as string[]) : [];
      
      if (list.includes(id)) {
        list = list.filter((savedId) => savedId !== id);
        setIsSaved(false);
      } else {
        list.push(id);
        setIsSaved(true);
      }
      
      await SecureStore.setItemAsync(SAVED_TRAILS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error toggling save status:', e);
    }
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

      // Buscar progresso atualizado (com timestamp para evitar cache)
      try {
        const progressoRes = await api.get(`/api/progresso/trilha/${id}?_t=${Date.now()}`);
        if (progressoRes.data) {
          setIniciada(true);
          const progMap = progressoRes.data.progresso;
          if (progMap && typeof progMap === 'object') {
            const completed = Object.keys(progMap).filter((fId) => progMap[fId] === true);
            setFasesConcluidas(completed);
          } else if (Array.isArray(progressoRes.data.fasesConcluidas)) {
            setFasesConcluidas(progressoRes.data.fasesConcluidas);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Trilha não iniciada ainda
          setIniciada(false);
        } else {
          console.error('Erro ao buscar progresso da trilha:', err);
        }
      }
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
    
    if (!iniciada) {
      return fases[0]._id === fase._id;
    }
    
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
      await fetchTrilhaDetails();
    } catch (e) {
      console.error('Erro ao iniciar trilha:', e);
    } finally {
      setLoadingAction(false);
    }
  };

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
        <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
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

        {/* Botão de Ação / Iniciar (apenas se desbloqueada) */}
        {isUnlocked && (
          !iniciada ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleIniciarTrilha}
              disabled={loadingAction}
              activeOpacity={0.9}
            >
              {loadingAction ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnText}>Iniciar Trilha 🚀</Text>
              )}
            </TouchableOpacity>
          ) : (
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
          )
        )}
      </View>

      {/* Box Exclusiva para o Professor ver o Código da Trilha Privada */}
      {isPrivateTrail && isTeacherOrCreator && Boolean(effectiveCode) && (
        <View style={styles.teacherCodeCard}>
          <View style={styles.teacherCodeHeader}>
            <Key size={22} color="#F59E0B" />
            <Text style={styles.teacherCodeTitle}>Código de Acesso dos Alunos 🔑</Text>
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
              <Text style={styles.teacherQrBtnText}>Ver QR Code 📱</Text>
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
            <Text style={[styles.lockedTitle, { color: colors.text }]}>Trilha Paga Exclusiva 💎</Text>
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
                  <Text style={styles.paymentMethodSubtitle}>Liberação imediata via QR Code ⚡</Text>
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
                  <Text style={styles.paymentMethodSubtitle}>Parcelamento em até 12x 💳</Text>
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
              <Sparkles size={20} color="#ffffff" style={{ marginRight: 8 }} />
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
                <>
                  <Key size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.lockedSubmitBtnText}>Liberar com Código</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
            <View style={styles.lockedIconBubble}>
              <Lock size={36} color="#ffffff" />
            </View>
            <Text style={[styles.lockedTitle, { color: colors.text }]}>Conteúdo Bloqueado 🔒</Text>
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
                  <>
                    <Key size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.lockedSubmitBtnText}>Desbloquear com Código</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lockedScanQrBtn}
                onPress={() => setScannerModalVisible(true)}
                activeOpacity={0.85}
              >
                <Camera size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.lockedScanQrBtnText}>Ler QR Code da Trilha 📷</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <>
          {/* Lista de Seções & Fases */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Jornada de Aprendizado</Text>
          {secoes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Esta trilha ainda não tem seções estruturadas.</Text>
          ) : (
            secoes.map((secao, secaoIdx) => {
              // Filtrar fases pertencentes a esta seção
              const fasesDaSecao = fases.filter((f) => f.secaoId === secao._id);
              const bannerColor = BANNER_COLORS[secaoIdx % BANNER_COLORS.length];

              return (
                <View key={secao._id} style={styles.secaoBlock}>
                  {/* Header da Seção estilo Duolingo */}
                  <View style={[styles.secaoHeader, { backgroundColor: bannerColor }]}>
                    <Text style={styles.secaoTitle}>{secao.titulo}</Text>
                    {secao.descricao && <Text style={styles.secaoDesc}>{secao.descricao}</Text>}
                  </View>

                  {/* Fases em zigue-zague */}
                  <View style={styles.fasesContainer}>
                    {fasesDaSecao.length === 0 ? (
                      <Text style={[styles.emptyFases, { color: colors.textMuted }]}>Nenhuma fase nesta seção.</Text>
                    ) : (
                      fasesDaSecao.map((fase) => {
                        const isCompleted = fasesConcluidas.includes(fase._id);
                        const isActive = isPhaseActive(fase);
                        
                        // Lógica para desbloquear a fase individual
                        let isPhaseUnlocked = false;
                        if (!iniciada) {
                          isPhaseUnlocked = false;
                        } else if (fases.indexOf(fase) === 0) {
                          isPhaseUnlocked = true;
                        } else {
                          const absoluteIndex = fases.indexOf(fase);
                          const prevFase = fases[absoluteIndex - 1];
                          isPhaseUnlocked = prevFase && fasesConcluidas.includes(prevFase._id);
                        }

                        if (isCompleted) {
                          isPhaseUnlocked = true;
                        }

                        const globalIdx = fases.indexOf(fase);

                        return (
                          <View key={fase._id} style={[styles.faseNodeContainer, getZigZagStyle(globalIdx)]}>
                            {/* Avatar do Personagem Flutuante */}
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

                            {/* Círculo da Fase */}
                            <TouchableOpacity
                              style={[
                                styles.faseCircle,
                                {
                                  backgroundColor: isCompleted
                                    ? '#10B981' // Verde concluído
                                    : isPhaseUnlocked
                                    ? '#4F46E5' // Azul ativo/desbloqueado
                                    : '#374151', // Cinza bloqueado
                                  borderColor: isCompleted
                                    ? '#059669'
                                    : isPhaseUnlocked
                                    ? '#3730A3'
                                    : '#1F2937',
                                },
                              ]}
                              disabled={!isPhaseUnlocked}
                              onPress={() => router.push(`/game/${fase._id}`)}
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

                            {/* Rótulo da Fase */}
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
                  {t('trail.guideTabTrail') || '🗺️ A Trilha'}
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
                  {t('trail.guideTabGame') || '⚔️ O Jogo'}
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
                  {t('trail.guideTabTips') || '🏆 Dicas'}
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
                    <Text style={{ fontSize: 24 }}>❤️</Text>
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
                    <Text style={{ fontSize: 24 }}>🪙</Text>
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
                    <Text style={{ fontSize: 24 }}>✨</Text>
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
                    <Text style={{ fontSize: 24 }}>🏆</Text>
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
                    <Text style={{ fontSize: 24 }}>📖</Text>
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
});
