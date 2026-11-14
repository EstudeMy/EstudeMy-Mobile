import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  obterContinue,
  obterNovidades,
  obterPopulares,
  buscarTrilhas,
  buscarTrilhaPorId,
  buscarTrilhaPorCodigo,
  getMappedIdioma,
  Trilha,
} from '../../services/trilhaService';
import {
  getAllKnownTrailCodes,
  getUnlockedTrails,
  validateAndUnlockTrail,
  unlockTrail,
  copyToClipboard,
  isTrilhaPrivada,
  removeTrailAccessCode,
} from '../../services/trilhaAcessoService';
import { getCharacterImage, getTrackImage, EXTRA_IMAGES } from '../../constants/assets';
import {
  Search,
  Zap,
  Sparkles,
  BookOpen,
  PlusCircle,
  X,
  Lock,
  Globe,
  DollarSign,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Camera,
  QrCode,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react-native';
import { AccessibilityIcon } from '../../components/AccessibilityIcon';
import QRCodeModal from '../../components/QRCodeModal';
import QRScannerModal from '../../components/QRScannerModal';
import { APP_FULL_VERSION_STRING } from '../../constants/version';
import { listarTodasTransacoes } from '../../services/pagamentoService';
import { obterMaterias } from '../../services/materiaService';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { isDark, colors, openAccessibilityModal } = useTheme();
  const { language, t } = useLanguage();

  const canCreateTrack =
    user?.tipoUsuario === 'PROFESSOR' ||
    user?.tipoUsuario === 'ADMINISTRADOR' ||
    user?.tipoUsuario === 'OWNER';

  const [searchQuery, setSearchQuery] = useState('');
  const latestSearchQueryRef = useRef('');
  const [searchLoading, setSearchLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [continueTrilhas, setContinueTrilhas] = useState<Trilha[]>([]);
  const [populares, setPopulares] = useState<Trilha[]>([]);
  const [novidades, setNovidades] = useState<Trilha[]>([]);
  const [searchResults, setSearchResults] = useState<Trilha[] | null>(null);

  // Estados de controle de acesso e trilhas privadas
  const [unlockedTrailIds, setUnlockedTrailIds] = useState<string[]>([]);
  const [purchasedTrailIds, setPurchasedTrailIds] = useState<string[]>([]);
  const [knownCodes, setKnownCodes] = useState<Record<string, string>>({});

  // Modal para Aluno desbloquear trilha clicada
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [targetTrailForUnlock, setTargetTrailForUnlock] = useState<Trilha | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Modal para busca direta por código
  const [enterCodeModalVisible, setEnterCodeModalVisible] = useState(false);
  const [directCode, setDirectCode] = useState('');
  const [directCodeError, setDirectCodeError] = useState<string | null>(null);
  const [directCodeLoading, setDirectCodeLoading] = useState(false);

  // Modal para Professor visualizar código da sua trilha privada
  const [viewCodeModalVisible, setViewCodeModalVisible] = useState(false);
  const [viewCodeTrail, setViewCodeTrail] = useState<Trilha | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Modais de QR Code
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [qrTargetTrail, setQrTargetTrail] = useState<Trilha | null>(null);

  // Estados dos Filtros de Trilhas (Pagas/Gratuitas, Abertas/Privadas, Valor Máximo, Matéria, Assunto, Dificuldade)
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState<'todas' | 'abertas' | 'privadas'>('todas');
  const [filtroPagamento, setFiltroPagamento] = useState<'todas' | 'gratuitas' | 'pagas'>('todas');
  const [precoMaximo, setPrecoMaximo] = useState<number | null>(null);
  const [precoMaximoInput, setPrecoMaximoInput] = useState('');
  const [filtroMateria, setFiltroMateria] = useState<string>('todas');
  const [filtroAssunto, setFiltroAssunto] = useState<string>('');
  const [filtroDificuldade, setFiltroDificuldade] = useState<'todas' | 'Facil' | 'Medio' | 'Dificil'>('todas');
  const [materiasDisponiveis, setMateriasDisponiveis] = useState<string[]>([]);

  const refreshAccessState = useCallback(async () => {
    try {
      const [unlocked, codes, allTxs] = await Promise.all([
        getUnlockedTrails(),
        getAllKnownTrailCodes(),
        listarTodasTransacoes(),
      ]);
      const currentUserId = user?._id || user?.id;
      const boughtIds = allTxs
        .filter((tx) => tx.status === 'CONCLUIDO' && (!currentUserId || tx.compradorId === currentUserId))
        .map((tx) => tx.trilhaId);

      setPurchasedTrailIds(boughtIds);
      setUnlockedTrailIds(unlocked);
      setKnownCodes(codes);
    } catch (e) {
      console.error('Erro ao carregar estado de acesso de trilhas:', e);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshAccessState();
  }, [refreshAccessState]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const mappedIdioma = getMappedIdioma(language);
      const [continueData, popularesData, novidadesData, materiasList] = await Promise.all([
        obterContinue(mappedIdioma),
        obterPopulares(mappedIdioma),
        obterNovidades(mappedIdioma),
        obterMaterias(),
      ]);

      const filterByLanguage = (trilhas: Trilha[]) => {
        return trilhas.filter((t) => {
          const trilhaIdioma = t.idioma || 'Português';
          return trilhaIdioma === mappedIdioma;
        });
      };

      setContinueTrilhas(filterByLanguage(continueData));
      setPopulares(filterByLanguage(popularesData));
      setNovidades(filterByLanguage(novidadesData));
      setMateriasDisponiveis(materiasList || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  const isTeacherOrCreator = (item: Trilha) => {
    const isCreator =
      (item.criadoPor && (item.criadoPor === user?._id || item.criadoPor === user?.id)) ||
      (typeof item.criadoPor === 'object' && (item.criadoPor as any)?._id === user?._id);
    const isStaff =
      user?.tipoUsuario === 'PROFESSOR' ||
      user?.tipoUsuario === 'ADMINISTRADOR' ||
      user?.tipoUsuario === 'OWNER';
    return Boolean(isCreator || isStaff);
  };

  const isTrilhaPrivate = (item: Trilha) => {
    return isTrilhaPrivada(item);
  };

  const isTrilhaPaid = (item: Trilha) => {
    return item.pagamento === 'Paga' || Boolean(item.preco && Number(item.preco) > 0);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filtroDisponibilidade !== 'todas') count++;
    if (filtroPagamento !== 'todas') count++;
    if (precoMaximo !== null) count++;
    if (filtroMateria !== 'todas') count++;
    if (filtroAssunto.trim().length > 0) count++;
    if (filtroDificuldade !== 'todas') count++;
    return count;
  }, [
    filtroDisponibilidade,
    filtroPagamento,
    precoMaximo,
    filtroMateria,
    filtroAssunto,
    filtroDificuldade,
  ]);

  const handleLimparFiltros = () => {
    setFiltroDisponibilidade('todas');
    setFiltroPagamento('todas');
    setPrecoMaximo(null);
    setPrecoMaximoInput('');
    setFiltroMateria('todas');
    setFiltroAssunto('');
    setFiltroDificuldade('todas');
  };

  const applyFilters = useCallback(
    (item: Trilha) => {
      // 1. Disponibilidade
      const isPrivate = isTrilhaPrivada(item);
      if (filtroDisponibilidade === 'abertas' && isPrivate) return false;
      if (filtroDisponibilidade === 'privadas' && !isPrivate) return false;

      // 2. Pagamento
      const isPaid = item.pagamento === 'Paga' || Boolean(item.preco && Number(item.preco) > 0);
      if (filtroPagamento === 'gratuitas' && isPaid) return false;
      if (filtroPagamento === 'pagas' && !isPaid) return false;

      // 3. Preço Máximo
      if (precoMaximo !== null) {
        const precoNumerico = isPaid ? (item.preco && Number(item.preco) > 0 ? Number(item.preco) : 29.9) : 0;
        if (precoNumerico > precoMaximo) return false;
      }

      // 4. Matéria
      if (filtroMateria !== 'todas') {
        if (item.materia?.toLowerCase() !== filtroMateria.toLowerCase()) return false;
      }

      // 5. Assunto / Palavra-chave
      if (filtroAssunto.trim().length > 0) {
        const q = filtroAssunto.trim().toLowerCase();
        const matchTitle = item.titulo?.toLowerCase().includes(q);
        const matchDesc = item.descricao?.toLowerCase().includes(q);
        const matchMat = item.materia?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMat) return false;
      }

      // 6. Dificuldade
      if (filtroDificuldade !== 'todas') {
        const diff = (item.dificuldade || item.nivelDificuldade || 'Facil').toLowerCase();
        const target = filtroDificuldade.toLowerCase();
        if (!diff.includes(target) && !target.includes(diff)) return false;
      }

      return true;
    },
    [
      filtroDisponibilidade,
      filtroPagamento,
      precoMaximo,
      filtroMateria,
      filtroAssunto,
      filtroDificuldade,
      knownCodes,
    ]
  );

  const allLoadedTrails = useMemo(() => {
    const map = new Map<string, Trilha>();
    [...continueTrilhas, ...populares, ...novidades].forEach((t) => {
      if (!map.has(t._id)) map.set(t._id, t);
    });
    return Array.from(map.values());
  }, [continueTrilhas, populares, novidades]);

  const filteredTrailsList = useMemo(() => {
    if (activeFiltersCount === 0) return [];
    return allLoadedTrails.filter(applyFilters);
  }, [activeFiltersCount, allLoadedTrails, applyFilters]);

  const handleCardPress = (item: Trilha) => {
    const isPrivate = isTrilhaPrivate(item);

    // Se a trilha for aberta, acessa diretamente
    if (!isPrivate) {
      router.push(`/trilha/${item._id}`);
      return;
    }

    // Se o usuário for criador, professor ou staff, acesso direto liberado
    if (isTeacherOrCreator(item)) {
      router.push(`/trilha/${item._id}`);
      return;
    }

    // Se o aluno já desbloqueou esta trilha anteriormente
    if (unlockedTrailIds.includes(item._id)) {
      router.push(`/trilha/${item._id}`);
      return;
    }

    // Trilha privada bloqueada: abre modal para digitar o código
    setTargetTrailForUnlock(item);
    setInputCode('');
    setUnlockError(null);
    setUnlockSuccess(false);
    setUnlockModalVisible(true);
  };

  const handleCopyCode = async (code: string) => {
    await copyToClipboard(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleUnlockSubmit = async () => {
    if (!targetTrailForUnlock || !inputCode.trim()) {
      setUnlockError('Digite o código de acesso fornecido pelo professor.');
      return;
    }

    const ok = await validateAndUnlockTrail(targetTrailForUnlock, inputCode);
    if (ok) {
      setUnlockSuccess(true);
      setUnlockError(null);
      await refreshAccessState();
      setTimeout(() => {
        setUnlockModalVisible(false);
        router.push(`/trilha/${targetTrailForUnlock._id}`);
      }, 700);
    } else {
      setUnlockError('Código de acesso incorreto. Verifique com seu professor.');
    }
  };

  const handleDirectCodeSubmit = async () => {
    const clean = directCode.trim().toUpperCase();
    if (!clean) {
      setDirectCodeError('Digite um código de acesso.');
      return;
    }

    setDirectCodeLoading(true);
    setDirectCodeError(null);

    try {
      const match = await buscarTrilhaPorCodigo(clean);

      if (match) {
        await unlockTrail(match._id);
        await refreshAccessState();
        setEnterCodeModalVisible(false);
        setDirectCode('');
        router.push(`/trilha/${match._id}`);
      } else {
        setDirectCodeError('Nenhuma trilha encontrada para este código. Verifique se digitou corretamente.');
      }
    } catch {
      setDirectCodeError('Erro ao buscar trilha pelo código. Tente novamente.');
    } finally {
      setDirectCodeLoading(false);
    }
  };

  const handleScannerResult = async (parsed: { trilhaId?: string; code?: string; raw: string }) => {
    setScannerModalVisible(false);
    setSearchLoading(true);

    try {
      const targetTrilhaId = parsed.trilhaId;
      const cleanCode = (parsed.code || parsed.raw || '').trim().toUpperCase();

      if (targetTrilhaId) {
        await unlockTrail(targetTrilhaId);
        await refreshAccessState();
        setSearchLoading(false);
        router.push(`/trilha/${targetTrilhaId}`);
        return;
      }

      if (cleanCode) {
        const match = await buscarTrilhaPorCodigo(cleanCode);

        if (match) {
          await unlockTrail(match._id);
          await refreshAccessState();
          setSearchLoading(false);
          router.push(`/trilha/${match._id}`);
          return;
        }
      }

      setSearchLoading(false);
      setDirectCode(cleanCode);
      setDirectCodeError('QR Code lido, mas nenhuma trilha correspondente foi encontrada.');
      setEnterCodeModalVisible(true);
    } catch (e) {
      setSearchLoading(false);
      console.error('Erro ao processar scanner:', e);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    latestSearchQueryRef.current = text;

    if (!text.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const cleanSearch = text.trim().toUpperCase();
      const results = await buscarTrilhas(text);
      if (latestSearchQueryRef.current !== text) {
        return;
      }

      const mappedIdioma = getMappedIdioma(language);
      const filteredResults = results.filter((t) => {
        const trilhaIdioma = t.idioma || 'Português';
        return trilhaIdioma === mappedIdioma;
      });

      // Busca complementar por código de acesso em todas as trilhas conhecidas
      const allLoaded = [...continueTrilhas, ...populares, ...novidades];
      const codeMatched: Trilha[] = [];

      for (const t of allLoaded) {
        if (filteredResults.some((r) => r._id === t._id) || codeMatched.some((m) => m._id === t._id)) continue;
        const code = (t.codigoAcesso || knownCodes[t._id])?.toUpperCase();
        if (code && (code.includes(cleanSearch) || cleanSearch.includes(code))) {
          codeMatched.push(t);
        }
      }

      // Se o usuário digitou um código que está no storage de códigos locais
      for (const [tId, code] of Object.entries(knownCodes)) {
        if (code.toUpperCase().includes(cleanSearch) || cleanSearch.includes(code.toUpperCase())) {
          if (!filteredResults.some((r) => r._id === tId) && !codeMatched.some((m) => m._id === tId)) {
            try {
              const fullTrail = await buscarTrilhaPorId(tId);
              if (fullTrail) {
                codeMatched.push(fullTrail);
              }
            } catch {
              // Silencioso
            }
          }
        }
      }

      setSearchResults([...codeMatched, ...filteredResults]);
    } catch (e) {
      if (latestSearchQueryRef.current === text) {
        console.error('Erro ao pesquisar trilhas:', e);
      }
    } finally {
      if (latestSearchQueryRef.current === text) {
        setSearchLoading(false);
      }
    }
  };

  // Cálculo de nível (ex: cada 100 XP sobe um nível)
  const xp = user?.xpTotal || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  // Card para os carrosséis horizontais
  const renderTrackCard = ({ item }: { item: Trilha }) => {
    const trackImage = getTrackImage(item);
    const diff = item.dificuldade || item.nivelDificuldade || 'Fácil';
    const isPrivate = isTrilhaPrivate(item);
    const isPaid = isTrilhaPaid(item);
    const isPurchased = purchasedTrailIds.includes(item._id);
    const isTeacher = isTeacherOrCreator(item);
    const precoNumerico = isPaid ? (item.preco && Number(item.preco) > 0 ? Number(item.preco) : 29.9) : 0;
    const precoFormatado = precoNumerico.toFixed(2).replace('.', ',');

    return (
      <TouchableOpacity
        style={[styles.trackCard, { backgroundColor: colors.card }]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={trackImage}
            style={styles.trackCoverImage}
            resizeMode="cover"
          />

          {/* Badges Flutuantes no Card */}
          <View style={styles.badgesTopRow}>
            {/* Pagamento com Valor em R$ Sempre Visível */}
            <View style={[styles.floatingBadge, isPurchased ? styles.badgePurchased : isPaid ? styles.badgePaid : styles.badgeFree]}>
              {isPurchased ? (
                <CheckCircle2 size={10} color="#ffffff" style={{ marginRight: 2 }} />
              ) : isPaid ? (
                <DollarSign size={10} color="#ffffff" style={{ marginRight: 2 }} />
              ) : null}
              <Text style={styles.floatingBadgeText}>
                {isPurchased ? 'Adquirida' : isPaid ? `R$ ${precoFormatado}` : 'Gratuita'}
              </Text>
            </View>

            {/* Disponibilidade: Aberta vs Privada */}
            <View style={[styles.floatingBadge, isPrivate ? styles.badgePrivate : styles.badgePublic]}>
              {isPrivate ? (
                <>
                  <Lock size={10} color="#ffffff" style={{ marginRight: 2 }} />
                  <Text style={styles.floatingBadgeText}>Privada</Text>
                </>
              ) : (
                <>
                  <Globe size={10} color="#ffffff" style={{ marginRight: 2 }} />
                  <Text style={styles.floatingBadgeText}>Aberta</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.trackCardContent}>
          <Text style={[styles.trackCardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {item.descricao ? (
            <Text style={[styles.trackCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}

          <View style={styles.trackCardFooter}>
            <Text style={[styles.trackCardMeta, { color: colors.textMuted }]} numberOfLines={1}>
              {item.materia} • <Text style={{ fontWeight: '800', color: colors.text }}>{diff}</Text>
            </Text>

            {/* Tag do Valor Visível no Rodapé do Card */}
            <View style={[styles.cardPricePill, isPurchased ? styles.cardPricePillPurchased : isPaid ? styles.cardPricePillPaid : styles.cardPricePillFree]}>
              <Text style={styles.cardPricePillText}>
                {isPurchased ? 'Adquirida ✓' : isPaid ? `R$ ${precoFormatado}` : 'Grátis'}
              </Text>
            </View>

            {/* Se professor/criador e for privada: botão para ver o código */}
            {isPrivate && isTeacher && (
              <TouchableOpacity
                style={styles.teacherViewCodeBtn}
                onPress={() => {
                  setViewCodeTrail(item);
                  setCodeCopied(false);
                  setViewCodeModalVisible(true);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Key size={12} color="#F59E0B" style={{ marginRight: 3 }} />
                <Text style={styles.teacherViewCodeBtnText}>Ver Código</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Card para o grid de pesquisa e filtros (2 trilhas por linha)
  const renderGridCard = (item: Trilha) => {
    const trackImage = getTrackImage(item);
    const diff = item.dificuldade || item.nivelDificuldade || 'Fácil';
    const isPrivate = isTrilhaPrivate(item);
    const isPaid = isTrilhaPaid(item);
    const isPurchased = purchasedTrailIds.includes(item._id);
    const isTeacher = isTeacherOrCreator(item);
    const precoNumerico = isPaid ? (item.preco && Number(item.preco) > 0 ? Number(item.preco) : 29.9) : 0;
    const precoFormatado = precoNumerico.toFixed(2).replace('.', ',');

    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.gridCard, { backgroundColor: colors.card }]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={trackImage}
            style={styles.gridCoverImage}
            resizeMode="cover"
          />

          {/* Badges Flutuantes no Grid com Preço em R$ Visível */}
          <View style={styles.badgesTopRowGrid}>
            <View style={[styles.floatingBadgeGrid, isPurchased ? styles.badgePurchased : isPaid ? styles.badgePaid : styles.badgeFree]}>
              {isPurchased ? (
                <CheckCircle2 size={9} color="#ffffff" style={{ marginRight: 2 }} />
              ) : isPaid ? (
                <DollarSign size={9} color="#ffffff" style={{ marginRight: 2 }} />
              ) : null}
              <Text style={styles.floatingBadgeTextGrid}>
                {isPurchased ? 'Adquirida' : isPaid ? `R$ ${precoFormatado}` : 'Gratuita'}
              </Text>
            </View>

            <View style={[styles.floatingBadgeGrid, isPrivate ? styles.badgePrivate : styles.badgePublic]}>
              {isPrivate ? (
                <>
                  <Lock size={9} color="#ffffff" style={{ marginRight: 2 }} />
                  <Text style={styles.floatingBadgeTextGrid}>Privada</Text>
                </>
              ) : (
                <>
                  <Globe size={9} color="#ffffff" style={{ marginRight: 2 }} />
                  <Text style={styles.floatingBadgeTextGrid}>Aberta</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.gridCardContent}>
          <Text style={[styles.gridCardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {item.descricao ? (
            <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}
          <Text style={[styles.gridCardMeta, { color: colors.textMuted }]} numberOfLines={1}>
            Matéria: <Text style={{ fontWeight: '800', color: colors.text }}>{item.materia}</Text>
          </Text>

          <View style={styles.gridBadgeContainer}>
            <View style={[styles.diffBadge, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <Text style={[styles.diffBadgeText, { color: colors.text }]}>{diff}</Text>
            </View>

            {/* Tag do Valor em R$ no Grid */}
            <View style={[styles.cardPricePill, isPurchased ? styles.cardPricePillPurchased : isPaid ? styles.cardPricePillPaid : styles.cardPricePillFree]}>
              <Text style={styles.cardPricePillText}>
                {isPurchased ? 'Adquirida ✓' : isPaid ? `R$ ${precoFormatado}` : 'Grátis'}
              </Text>
            </View>

            {isPrivate && isTeacher && (
              <TouchableOpacity
                style={styles.teacherGridCodeBtn}
                onPress={() => {
                  setViewCodeTrail(item);
                  setCodeCopied(false);
                  setViewCodeModalVisible(true);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Key size={11} color="#F59E0B" />
                <Text style={styles.teacherGridCodeBtnText}>Código</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 16, 16),
        },
      ]}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 16, 16),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header do Usuário */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <View style={styles.userRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image
              source={getCharacterImage(user?.personagem)}
              style={styles.headerAvatarImg}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>{t('common.hello') || 'Olá'}, {user?.nome || t('common.student') || 'Estudante'}!</Text>
              <Text style={[styles.avatarLabel, { color: colors.textSecondary }]}>{t('common.class') || 'Classe'}: {user?.personagem ? (t(`characterPage.classes.${user.personagem.toLowerCase()}`) || user.personagem) : (t('characterPage.classes.samurai') || 'Samurai')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={openAccessibilityModal}
              style={styles.accessibilityHeaderBtn}
              accessibilityRole="button"
              accessibilityLabel="Acessibilidade e Alto Contraste"
              activeOpacity={0.85}
            >
              <AccessibilityIcon size={24} color="#000000" accentColor="#00AEEF" />
            </TouchableOpacity>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lvl {level}</Text>
            </View>
          </View>
        </View>

        {/* Barra de XP */}
        <View style={styles.xpRow}>
          <Zap size={16} color="#EAB308" fill="#EAB308" />
          <Text style={[styles.xpText, { color: colors.text }]}>{xpInLevel}/100 XP</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.cardSecondary }]}>
          <View style={[styles.progressBarFill, { width: `${xpInLevel}%` }]} />
        </View>
      </View>

      {/* Barra de Pesquisa + Botão de Filtros */}
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { flex: 1 }]}>
          <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t('home.searchPlaceholder') || 'Pesquisar trilhas ou matérias...'}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => handleSearch('')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Botão de Abrir Filtros Avançados */}
        <TouchableOpacity
          style={[styles.filterToggleBtn, activeFiltersCount > 0 && styles.filterToggleBtnActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.85}
        >
          <SlidersHorizontal size={18} color="#ffffff" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Pílulas de Filtro Rápido */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersContainer}
        style={{ marginBottom: 16 }}
      >
        <TouchableOpacity
          style={[
            styles.quickFilterChip,
            activeFiltersCount === 0 && styles.quickFilterChipActive,
          ]}
          onPress={handleLimparFiltros}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.quickFilterChipText,
              activeFiltersCount === 0 && styles.quickFilterChipTextActive,
            ]}
          >
            {t('homeFilters.filterPillAll') || 'Todas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, filtroPagamento === 'gratuitas' && styles.quickFilterChipActiveGreen]}
          onPress={() => setFiltroPagamento((prev) => (prev === 'gratuitas' ? 'todas' : 'gratuitas'))}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickFilterChipText, filtroPagamento === 'gratuitas' && styles.quickFilterChipTextActive]}>
            {t('homeFilters.filterPillFree') || 'Gratuitas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, filtroPagamento === 'pagas' && styles.quickFilterChipActiveGold]}
          onPress={() => setFiltroPagamento((prev) => (prev === 'pagas' ? 'todas' : 'pagas'))}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickFilterChipText, filtroPagamento === 'pagas' && styles.quickFilterChipTextActive]}>
            {t('homeFilters.filterPillPaid') || 'Pagas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, filtroDisponibilidade === 'abertas' && styles.quickFilterChipActiveBlue]}
          onPress={() => setFiltroDisponibilidade((prev) => (prev === 'abertas' ? 'todas' : 'abertas'))}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickFilterChipText, filtroDisponibilidade === 'abertas' && styles.quickFilterChipTextActive]}>
            {t('homeFilters.filterPillPublic') || 'Abertas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, filtroDisponibilidade === 'privadas' && styles.quickFilterChipActivePurple]}
          onPress={() => setFiltroDisponibilidade((prev) => (prev === 'privadas' ? 'todas' : 'privadas'))}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickFilterChipText, filtroDisponibilidade === 'privadas' && styles.quickFilterChipTextActive]}>
            {t('homeFilters.filterPillPrivate') || 'Privadas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, styles.quickFilterChipMore, activeFiltersCount > 0 && styles.quickFilterChipMoreActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={13} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={[styles.quickFilterChipText, { color: '#ffffff' }]}>
            Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Atalho para Aluno: Entrar com Código ou QR Code de Trilha Privada */}
      <View style={[styles.enterCodeBanner, { backgroundColor: colors.card }]}>
        <View style={styles.enterCodeIconWrap}>
          <Key size={18} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.enterCodeTitle, { color: colors.text }]}>
            {t('homeFilters.enterCodeOrQr') || 'Trilha com Código ou QR Code'}
          </Text>
          <Text style={[styles.enterCodeDesc, { color: colors.textMuted }]}>
            {t('homeFilters.enterCodeOrQrDesc') || 'Recebeu um código de acesso ou QR Code do seu professor?'}
          </Text>
          <View style={styles.enterCodeButtonsRow}>
            <TouchableOpacity
              style={styles.enterCodePill}
              onPress={() => {
                setDirectCode('');
                setDirectCodeError(null);
                setEnterCodeModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.enterCodePillText}>
                {t('homeFilters.insertCode') || 'Inserir Código'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.enterQrPill}
              onPress={() => setScannerModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.enterQrPillText}>
                {t('homeFilters.readQrCode') || 'Ler QR Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Ações Exclusivas para Professor / Administrador / Owner */}
      {canCreateTrack && (
        <View style={styles.actionsGroup}>
          {/* Botão Prominente ConsultAi IA */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push('/consultai')}
            activeOpacity={0.9}
          >
            <Image source={EXTRA_IMAGES.consultai} style={styles.aiCardImg} resizeMode="contain" />
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiButtonTitle}>{t('home.aiTitle') || 'Consult.Ai'}</Text>
              <Text style={styles.aiButtonSub}>{t('home.aiDesc') || 'Gerador de trilhas e desafios com Inteligência Artificial'}</Text>
            </View>
          </TouchableOpacity>

          {/* Botão Criar Trilha Manual (Sem IA) */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => router.push('/criar-trilha' as any)}
            activeOpacity={0.9}
          >
            <View style={styles.manualIconBox}>
              <BookOpen size={24} color="#ffffff" />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiButtonTitle}>{t('home.manualTitle') || 'Criar Trilha Manual'}</Text>
              <Text style={styles.aiButtonSub}>{t('home.manualDesc') || 'Monte sua trilha com seus próprios temas e matérias'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Se estiver pesquisando, exibe em Grid de 2 trilhas por linha; se tiver filtros ativos, exibe trilhas filtradas; senão volta para os Carrosséis */}
      {isSearching ? (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
            <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>
              {t('common.searchResults') || 'Resultados da Pesquisa'}
            </Text>
          </View>
          {searchLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          ) : searchResults && searchResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('search.noResults') || 'Nenhuma trilha encontrada.'}
            </Text>
          ) : (
            <View style={styles.gridContainer}>
              {searchResults?.map(renderGridCard)}
            </View>
          )}
        </View>
      ) : activeFiltersCount > 0 ? (
        /* Seção de Trilhas com Filtros Aplicados */
        <View style={styles.section}>
          <View style={styles.filteredSectionHeaderRow}>
            <View style={[styles.sectionHeaderPill, { backgroundColor: '#8B5CF6' }]}>
              <SlidersHorizontal size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionHeaderPillText, { color: '#ffffff' }]}>
                Trilhas Filtradas ({filteredTrailsList.length})
              </Text>
            </View>

            <TouchableOpacity
              style={styles.clearFiltersHeaderBtn}
              onPress={handleLimparFiltros}
              activeOpacity={0.8}
            >
              <RotateCcw size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearFiltersHeaderBtnText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Chips que mostram os filtros aplicados */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilterTagsRow}>
            {filtroDisponibilidade !== 'todas' && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setFiltroDisponibilidade('todas')}
              >
                <Text style={styles.activeFilterTagText}>
                  {filtroDisponibilidade === 'abertas' ? 'Apenas Abertas' : 'Apenas Privadas'} ✕
                </Text>
              </TouchableOpacity>
            )}
            {filtroPagamento !== 'todas' && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setFiltroPagamento('todas')}
              >
                <Text style={styles.activeFilterTagText}>
                  {filtroPagamento === 'gratuitas' ? 'Apenas Gratuitas' : 'Apenas Pagas'} ✕
                </Text>
              </TouchableOpacity>
            )}
            {precoMaximo !== null && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => {
                  setPrecoMaximo(null);
                  setPrecoMaximoInput('');
                }}
              >
                <Text style={styles.activeFilterTagText}>
                  Até R$ {precoMaximo.toFixed(2).replace('.', ',')} ✕
                </Text>
              </TouchableOpacity>
            )}
            {filtroMateria !== 'todas' && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setFiltroMateria('todas')}
              >
                <Text style={styles.activeFilterTagText}>
                  Matéria: {filtroMateria} ✕
                </Text>
              </TouchableOpacity>
            )}
            {filtroAssunto.trim().length > 0 && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setFiltroAssunto('')}
              >
                <Text style={styles.activeFilterTagText}>
                  Assunto: {filtroAssunto} ✕
                </Text>
              </TouchableOpacity>
            )}
            {filtroDificuldade !== 'todas' && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setFiltroDificuldade('todas')}
              >
                <Text style={styles.activeFilterTagText}>
                  Dificuldade: {filtroDificuldade} ✕
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {filteredTrailsList.length === 0 ? (
            <View style={[styles.filterEmptyBox, { backgroundColor: colors.card }]}>
              <BookOpen size={40} color={colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.filterEmptyTitle, { color: colors.text }]}>
                Nenhuma trilha encontrada para essa combinação de filtros.
              </Text>
              <Text style={[styles.filterEmptyDesc, { color: colors.textMuted }]}>
                Experimente selecionar outra matéria, aumentar o preço máximo ou remover as restrições.
              </Text>
              <TouchableOpacity
                style={styles.filterEmptyResetBtn}
                onPress={handleLimparFiltros}
              >
                <RotateCcw size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.filterEmptyResetBtnText}>Redefinir Filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredTrailsList.map(renderGridCard)}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Carrossel Trilhas em Andamento */}
          {continueTrilhas.length > 0 && (
            <View style={styles.section}>
              <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
                <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.continueLearning') || 'Continuar Estudando'}</Text>
              </View>
              <FlatList
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                data={continueTrilhas}
                renderItem={renderTrackCard}
                keyExtractor={(item, index) => item._id || String(index)}
                contentContainerStyle={styles.carouselContainer}
              />
            </View>
          )}

          {/* Carrossel Trilhas Populares */}
          <View style={styles.section}>
            <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
              <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.popularTrails') || 'Melhores para você'}</Text>
            </View>
            {populares.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noPopularTrails') || 'Nenhuma trilha disponível.'}</Text>
            ) : (
              <FlatList
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                data={populares}
                renderItem={renderTrackCard}
                keyExtractor={(item, index) => item._id || String(index)}
                contentContainerStyle={styles.carouselContainer}
              />
            )}
          </View>

          {/* Carrossel Novidades */}
          <View style={styles.section}>
            <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
              <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.newTrails') || 'Novidades'}</Text>
            </View>
            {novidades.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noNewTrails') || 'Nenhuma trilha nova por enquanto.'}</Text>
            ) : (
              <FlatList
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                data={novidades}
                renderItem={renderTrackCard}
                keyExtractor={(item, index) => item._id || String(index)}
                contentContainerStyle={styles.carouselContainer}
              />
            )}
          </View>
        </>
      )}

      {/* Modal 1: Aluno Desbloqueando Trilha Clicada */}
      <Modal
        visible={unlockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnlockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconBubble, { backgroundColor: '#8B5CF6' }]}>
              <Lock size={32} color="#ffffff" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Trilha Privada</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              A trilha <Text style={{ fontWeight: '800', color: colors.text }}>&ldquo;{targetTrailForUnlock?.titulo}&rdquo;</Text> requer um código de acesso fornecido pelo professor para ser liberada.
            </Text>

            {unlockError && (
              <View style={styles.modalErrorCard}>
                <Text style={styles.modalErrorText}>{unlockError}</Text>
              </View>
            )}

            {unlockSuccess && (
              <View style={styles.modalSuccessCard}>
                <Text style={styles.modalSuccessText}>Código Correto! Desbloqueando trilha...</Text>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>Código de Acesso</Text>
              <TextInput
                style={[
                  styles.modalCodeInput,
                  { backgroundColor: colors.cardSecondary, color: colors.text },
                ]}
                placeholder="Ex: TRL-8K4M9Q"
                placeholderTextColor={colors.textMuted}
                value={inputCode}
                onChangeText={(text) => {
                  setInputCode(text.toUpperCase());
                  setUnlockError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { borderColor: colors.border || '#1b1b1b' }]}
                onPress={() => setUnlockModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleUnlockSubmit}
                activeOpacity={0.85}
              >
                <ShieldCheck size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Desbloquear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalScanQrBtn}
              onPress={() => {
                setUnlockModalVisible(false);
                setScannerModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.modalScanQrBtnText}>Ler QR Code da Trilha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Aluno Entrando Diretamente por Código */}
      <Modal
        visible={enterCodeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEnterCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconBubble, { backgroundColor: '#F59E0B' }]}>
              <Key size={32} color="#ffffff" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Acessar Trilha por Código</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Digite o código fornecido pelo professor da sua turma para localizar e desbloquear a trilha automaticamente.
            </Text>

            {directCodeError && (
              <View style={styles.modalErrorCard}>
                <Text style={styles.modalErrorText}>{directCodeError}</Text>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>Código da Trilha</Text>
              <TextInput
                style={[
                  styles.modalCodeInput,
                  { backgroundColor: colors.cardSecondary, color: colors.text },
                ]}
                placeholder="Ex: TRL-8K4M9Q"
                placeholderTextColor={colors.textMuted}
                value={directCode}
                onChangeText={(text) => {
                  setDirectCode(text.toUpperCase());
                  setDirectCodeError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { borderColor: colors.border || '#1b1b1b' }]}
                onPress={() => setEnterCodeModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleDirectCodeSubmit}
                disabled={directCodeLoading}
                activeOpacity={0.85}
              >
                {directCodeLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Key size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalPrimaryBtnText}>Buscar e Entrar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalScanQrBtn}
              onPress={() => {
                setEnterCodeModalVisible(false);
                setScannerModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.modalScanQrBtnText}>Escanear com Câmera (QR Code)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Professor Visualizando Código da sua Trilha Privada */}
      <Modal
        visible={viewCodeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconBubble, { backgroundColor: '#F59E0B' }]}>
              <Key size={32} color="#ffffff" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Código da sua Trilha</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Trilha: <Text style={{ fontWeight: '800', color: colors.text }}>&ldquo;{viewCodeTrail?.titulo}&rdquo;</Text>
            </Text>
            <Text style={[styles.modalHelperText, { color: colors.textMuted }]}>
              Apenas você (professor criador) e administradores podem ver este código. Compartilhe-o com os alunos para que eles possam ingressar.
            </Text>

            <View style={styles.modalDashedCodeBox}>
              <Text style={styles.modalDashedCodeText}>
                {viewCodeTrail?.codigoAcesso || (viewCodeTrail?._id && knownCodes[viewCodeTrail._id]) || 'TRL-ACESSO'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCopyBtn}
              onPress={() => handleCopyCode(viewCodeTrail?.codigoAcesso || (viewCodeTrail?._id && knownCodes[viewCodeTrail._id]) || '')}
              activeOpacity={0.85}
            >
              {codeCopied ? (
                <>
                  <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalCopyBtnText}>Código Copiado!</Text>
                </>
              ) : (
                <>
                  <Copy size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalCopyBtnText}>Copiar Código</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalQrBtn}
              onPress={() => {
                setQrTargetTrail(viewCodeTrail);
                setViewCodeModalVisible(false);
                setQrModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <QrCode size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.modalQrBtnText}>Exibir QR Code da Trilha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={() => setViewCodeModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.text }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Exibição de QR Code da Trilha (Professor) */}
      {qrTargetTrail && (
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => {
            setQrModalVisible(false);
            setQrTargetTrail(null);
          }}
          trilhaId={qrTargetTrail._id}
          trilhaTitulo={qrTargetTrail.titulo}
          codigoAcesso={
            qrTargetTrail.codigoAcesso ||
            (qrTargetTrail._id && knownCodes[qrTargetTrail._id]) ||
            'TRL-ACESSO'
          }
        />
      )}

      {/* Modal de Leitura de QR Code (Aluno) */}
      <QRScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onScanSuccess={handleScannerResult}
      />

      {/* Modal 4: Filtros Avançados de Trilhas */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalCard, { backgroundColor: colors.card }]}>
            {/* Header do Modal */}
            <View style={styles.filterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.filterModalIconWrap}>
                  <SlidersHorizontal size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={[styles.filterModalTitle, { color: colors.text }]}>
                    Filtrar Trilhas
                  </Text>
                  <Text style={[styles.filterModalSub, { color: colors.textMuted }]}>
                    Personalize os critérios de visualização
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.filterModalCloseBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* 1. Disponibilidade (Abertas vs Privadas) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                  Disponibilidade
                </Text>
                <View style={styles.filterButtonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroDisponibilidade === 'todas' && styles.filterSegmentBtnActive,
                    ]}
                    onPress={() => setFiltroDisponibilidade('todas')}
                  >
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroDisponibilidade === 'todas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroDisponibilidade === 'abertas' && styles.filterSegmentBtnActiveBlue,
                    ]}
                    onPress={() => setFiltroDisponibilidade('abertas')}
                  >
                    <Globe
                      size={13}
                      color={filtroDisponibilidade === 'abertas' ? '#ffffff' : colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroDisponibilidade === 'abertas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Abertas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroDisponibilidade === 'privadas' && styles.filterSegmentBtnActivePurple,
                    ]}
                    onPress={() => setFiltroDisponibilidade('privadas')}
                  >
                    <Lock
                      size={13}
                      color={filtroDisponibilidade === 'privadas' ? '#ffffff' : colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroDisponibilidade === 'privadas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Privadas
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Tipo de Cobrança (Gratuitas vs Pagas) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                  Cobrança / Preço
                </Text>
                <View style={styles.filterButtonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroPagamento === 'todas' && styles.filterSegmentBtnActive,
                    ]}
                    onPress={() => setFiltroPagamento('todas')}
                  >
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroPagamento === 'todas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroPagamento === 'gratuitas' && styles.filterSegmentBtnActiveGreen,
                    ]}
                    onPress={() => setFiltroPagamento('gratuitas')}
                  >
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroPagamento === 'gratuitas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Gratuitas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterSegmentBtn,
                      filtroPagamento === 'pagas' && styles.filterSegmentBtnActiveGold,
                    ]}
                    onPress={() => setFiltroPagamento('pagas')}
                  >
                    <DollarSign
                      size={13}
                      color={filtroPagamento === 'pagas' ? '#ffffff' : colors.textMuted}
                      style={{ marginRight: 2 }}
                    />
                    <Text
                      style={[
                        styles.filterSegmentBtnText,
                        filtroPagamento === 'pagas' && styles.filterSegmentBtnTextActive,
                      ]}
                    >
                      Pagas
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Valor Máximo (Abaixo de tal valor) */}
              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                    Preço Máximo (R$)
                  </Text>
                  {precoMaximo !== null && (
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#10B981' }}>
                      Até R$ {precoMaximo.toFixed(2).replace('.', ',')}
                    </Text>
                  )}
                </View>
                <View style={styles.pricePillsRow}>
                  {[
                    { label: 'Qualquer', val: null },
                    { label: 'Até R$ 20', val: 20 },
                    { label: 'Até R$ 35', val: 35 },
                    { label: 'Até R$ 50', val: 50 },
                    { label: 'Até R$ 100', val: 100 },
                  ].map((preset) => {
                    const isSelected = precoMaximo === preset.val;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[
                          styles.pricePresetPill,
                          isSelected && styles.pricePresetPillActive,
                        ]}
                        onPress={() => {
                          setPrecoMaximo(preset.val);
                          setPrecoMaximoInput(preset.val !== null ? String(preset.val) : '');
                        }}
                      >
                        <Text
                          style={[
                            styles.pricePresetPillText,
                            isSelected && styles.pricePresetPillTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Input para valor máximo customizado */}
                <View style={styles.customPriceInputWrap}>
                  <Text style={[styles.customPricePrefix, { color: colors.textMuted }]}>
                    Ou digite o valor máximo: R$
                  </Text>
                  <TextInput
                    style={[styles.customPriceInput, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                    placeholder="Ex: 40.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={precoMaximoInput}
                    onChangeText={(txt) => {
                      setPrecoMaximoInput(txt);
                      const parsed = parseFloat(txt.replace(',', '.'));
                      setPrecoMaximo(!isNaN(parsed) && parsed > 0 ? parsed : null);
                    }}
                  />
                </View>
              </View>

              {/* 4. Matéria / Disciplina */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                  Matéria / Disciplina
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.materiaFilterChip,
                      filtroMateria === 'todas' && styles.materiaFilterChipActive,
                    ]}
                    onPress={() => setFiltroMateria('todas')}
                  >
                    <Text
                      style={[
                        styles.materiaFilterChipText,
                        filtroMateria === 'todas' && styles.materiaFilterChipTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {materiasDisponiveis.map((mat) => {
                    const isSelected = filtroMateria.toLowerCase() === mat.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={mat}
                        style={[
                          styles.materiaFilterChip,
                          isSelected && styles.materiaFilterChipActive,
                        ]}
                        onPress={() => setFiltroMateria(isSelected ? 'todas' : mat)}
                      >
                        <Text
                          style={[
                            styles.materiaFilterChipText,
                            isSelected && styles.materiaFilterChipTextActive,
                          ]}
                        >
                          {mat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 5. Assunto / Palavra-Chave */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                  Assunto ou Palavra-Chave
                </Text>
                <TextInput
                  style={[styles.assuntoInput, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                  placeholder="Ex: Frações, Segunda Guerra, Sintaxe, Genética..."
                  placeholderTextColor={colors.textMuted}
                  value={filtroAssunto}
                  onChangeText={setFiltroAssunto}
                />
              </View>

              {/* 6. Dificuldade */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, { color: colors.text }]}>
                  Nível de Dificuldade
                </Text>
                <View style={styles.filterButtonGroup}>
                  {(['todas', 'Facil', 'Medio', 'Dificil'] as const).map((diff) => {
                    const isSelected = filtroDificuldade === diff;
                    const label =
                      diff === 'todas'
                        ? 'Todas'
                        : diff === 'Facil'
                        ? 'Fácil'
                        : diff === 'Medio'
                        ? 'Médio'
                        : 'Difícil';
                    return (
                      <TouchableOpacity
                        key={diff}
                        style={[
                          styles.filterSegmentBtn,
                          isSelected && styles.filterSegmentBtnActive,
                        ]}
                        onPress={() => setFiltroDificuldade(diff)}
                      >
                        <Text
                          style={[
                            styles.filterSegmentBtnText,
                            isSelected && styles.filterSegmentBtnTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer do Modal com Botões */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetModalBtn}
                onPress={handleLimparFiltros}
                activeOpacity={0.8}
              >
                <RotateCcw size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.filterResetModalBtnText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyModalBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.85}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.filterApplyModalBtnText}>
                  Aplicar Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rodapé com Versão Visível da Aplicação */}
      <View style={styles.homeVersionFooter}>
        <Text style={[styles.homeVersionText, { color: colors.textMuted }]}>
          EstudeMy Mobile • {APP_FULL_VERSION_STRING}
        </Text>
      </View>

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
  headerCard: {
    padding: 20,
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
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  avatarLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 4,
  },
  accessibilityHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  levelBadge: {
    backgroundColor: '#4F46E5', // indigo-600
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  xpText: {
    color: '#F3F4F6',
    fontWeight: '800',
    fontSize: 13,
  },
  progressBarBg: {
    height: 14,
    backgroundColor: '#1E1E2F',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EAB308', // yellow-500
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingLeft: 48,
    paddingRight: 44,
    fontSize: 15,
    fontWeight: '700',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
    padding: 6,
  },
  inputDark: {
    backgroundColor: '#2D2D44',
    color: '#ffffff',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    color: '#1b1b1b',
  },
  actionsGroup: {
    gap: 12,
    marginBottom: 24,
  },
  aiButton: {
    backgroundColor: '#6366F1', // indigo-500
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  manualButton: {
    backgroundColor: '#15803D', // green-700
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  manualIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIcon: {
    marginRight: 12,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiButtonTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  aiButtonSub: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sectionHeaderPillText: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#374151',
  },
  aiCardImg: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  carouselContainer: {
    gap: 16,
    paddingRight: 16,
    paddingBottom: 8,
  },
  trackCard: {
    width: 240,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  trackCoverImage: {
    width: '100%',
    height: 140,
    borderBottomWidth: 2,
    borderBottomColor: '#1b1b1b',
  },
  trackCardContent: {
    padding: 12,
  },
  trackCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
    lineHeight: 20,
  },
  trackCardDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 8,
  },
  trackCardMeta: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    width: '100%',
  },
  gridCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  gridCoverImage: {
    width: '100%',
    height: 105,
    borderBottomWidth: 2,
    borderBottomColor: '#1b1b1b',
  },
  gridCardContent: {
    padding: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridCardDesc: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 6,
  },
  gridCardMeta: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  diffBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  badgesTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  badgesTopRowGrid: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  floatingBadgeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  floatingBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  floatingBadgeTextGrid: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  badgeFree: {
    backgroundColor: '#10B981',
  },
  badgePaid: {
    backgroundColor: '#F59E0B',
  },
  badgePurchased: {
    backgroundColor: '#16A34A',
  },
  badgePublic: {
    backgroundColor: '#3B82F6',
  },
  badgePrivate: {
    backgroundColor: '#8B5CF6',
  },
  trackCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  teacherViewCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  teacherViewCodeBtnText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  teacherGridCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginLeft: 'auto',
  },
  teacherGridCodeBtnText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 2,
  },
  enterCodeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#F59E0B',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    gap: 12,
  },
  enterCodeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterCodeTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  enterCodeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  enterCodeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  enterCodePill: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  enterCodePillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  enterQrPill: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  enterQrPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  modalIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalHelperText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalErrorCard: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  modalErrorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSuccessCard: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  modalSuccessText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalInputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalCodeInput: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    flex: 1.3,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalDashedCodeBox: {
    backgroundColor: '#09090B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  modalDashedCodeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalCopyBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    marginBottom: 10,
  },
  modalCopyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalScanQrBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    marginTop: 12,
  },
  modalScanQrBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  modalQrBtn: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    marginBottom: 10,
  },
  modalQrBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  homeVersionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  homeVersionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  filterToggleBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  filterToggleBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  filterBadgeCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  filterBadgeCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  quickFiltersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  quickFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickFilterChipActive: {
    backgroundColor: '#4F46E5',
  },
  quickFilterChipActiveGold: {
    backgroundColor: '#F59E0B',
  },
  quickFilterChipActiveGreen: {
    backgroundColor: '#10B981',
  },
  quickFilterChipActiveBlue: {
    backgroundColor: '#3B82F6',
  },
  quickFilterChipActivePurple: {
    backgroundColor: '#8B5CF6',
  },
  quickFilterChipMore: {
    backgroundColor: '#6366F1',
  },
  quickFilterChipMoreActive: {
    backgroundColor: '#EC4899',
  },
  quickFilterChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickFilterChipTextActive: {
    color: '#FFFFFF',
  },
  filteredSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clearFiltersHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  clearFiltersHeaderBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
  },
  activeFilterTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  activeFilterTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  activeFilterTagText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '800',
  },
  filterEmptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 8,
  },
  filterEmptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  filterEmptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  filterEmptyResetBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  filterEmptyResetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  cardPricePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  cardPricePillFree: {
    backgroundColor: '#10B981',
  },
  cardPricePillPaid: {
    backgroundColor: '#F59E0B',
  },
  cardPricePillPurchased: {
    backgroundColor: '#16A34A',
  },
  cardPricePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterModalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  filterModalSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  filterModalCloseBtn: {
    padding: 6,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  filterButtonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  filterSegmentBtnActive: {
    backgroundColor: '#4F46E5',
  },
  filterSegmentBtnActiveBlue: {
    backgroundColor: '#3B82F6',
  },
  filterSegmentBtnActivePurple: {
    backgroundColor: '#8B5CF6',
  },
  filterSegmentBtnActiveGreen: {
    backgroundColor: '#10B981',
  },
  filterSegmentBtnActiveGold: {
    backgroundColor: '#F59E0B',
  },
  filterSegmentBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  filterSegmentBtnTextActive: {
    color: '#ffffff',
  },
  pricePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pricePresetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  pricePresetPillActive: {
    backgroundColor: '#10B981',
  },
  pricePresetPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  pricePresetPillTextActive: {
    color: '#ffffff',
  },
  customPriceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customPricePrefix: {
    fontSize: 11,
    fontWeight: '700',
  },
  customPriceInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '800',
  },
  materiaFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  materiaFilterChipActive: {
    backgroundColor: '#4F46E5',
  },
  materiaFilterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  materiaFilterChipTextActive: {
    color: '#ffffff',
  },
  assuntoInput: {
    width: '100%',
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  filterResetModalBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  filterResetModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  filterApplyModalBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  filterApplyModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
