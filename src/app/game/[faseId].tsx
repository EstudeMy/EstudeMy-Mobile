import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SecureStore from 'expo-secure-store';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Sparkles,
  Trophy,
  HelpCircle,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import GameSplashScreen from '../../components/game/SplashScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThematicQuestions, getTrilhaTheme, ThemeKey } from '../../game/data/thematicQuestions';
import { buscarFasePorId, buscarFasesPorTrilha, Fase } from '../../services/faseService';
import { registrarFaseConcluida } from '../../services/progressoService';
import { buscarTrilhaPorId, listarTrilhas } from '../../services/trilhaService';
import GameGuideModal from '../../components/game/GameGuideModal';

export default function GameScreen() {
  const { faseId, trilhaId, modo, phase } = useLocalSearchParams<{
    faseId: string;
    trilhaId?: string;
    modo?: string;
    phase?: string;
  }>();
  const router = useRouter();
  const { user, refreshUser, updateUserState } = useAuth();
  const { colors } = useTheme();

  // Estados de Carregamento e Fases
  const [fase, setFase] = useState<Fase | null>(null);
  const [faseCarregada, setFaseCarregada] = useState(false);
  const [splashCompleta, setSplashCompleta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(1);
  const [gameData, setGameData] = useState<any>(null);
  const [useRemoteFallback, setUseRemoteFallback] = useState(false);

  // Estados de Fim de Fase
  const [fimDeJogo, setFimDeJogo] = useState<'vitoria' | 'derrota' | null>(null);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);

  // Estados de Rotação e Orientação
  const [portraitAngle, setPortraitAngle] = useState<90 | 270>(90);
  const [showRotationAnimation, setShowRotationAnimation] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Animação de Entrada em React Native puro (compatível com React 19)
  const [rotateAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const toastTimeoutRef = useRef<any>(null);

  const isWeb = Platform.OS === 'web';
  const webViewRef = useRef<any>(null);

  const exibirToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // 1. Bloqueio de Orientação Nativa para Paisagem (Landscape) no Mobile
  useEffect(() => {
    async function lockLandscape() {
      try {
        if (!isWeb) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch (e) {
        console.warn('Erro ao travar tela na horizontal:', e);
      }
    }

    void lockLandscape();

    return () => {
      if (!isWeb) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => { });
      }
    };
  }, [isWeb]);

  // 2. Animação de Entrada: Virar o Celular (0° -> 90°)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    const fadeOutTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowRotationAnimation(false);
      });
    }, 2200);

    return () => {
      clearTimeout(fadeOutTimer);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [rotateAnim, pulseAnim, overlayOpacity]);

  // 3. Voltar para a Trilha
  const handleVoltar = useCallback(() => {
    const targetTrilha = trilhaId || gameData?.trilhaId;
    if (targetTrilha) {
      router.replace(`/trilha/${targetTrilha}`);
    } else {
      router.replace('/(tabs)/home');
    }
  }, [router, trilhaId, gameData]);

  // 4. Salvar Progresso de Vitória no Backend e Storage Local por Modo
  const salvarProgressoVitoria = useCallback(async (customFaseId?: string, customTrilhaId?: string, customModo?: string) => {
    const realFaseId = customFaseId || gameData?.faseId || fase?._id || faseId;
    const realTrilhaId = customTrilhaId || trilhaId || gameData?.trilhaId;
    const realModo = customModo || modo || gameData?.modoJogo || 'campanha';
    if (!realFaseId) return;

    // Modo mundo aberto / livre não pontua XP
    const isMundoAberto = realModo === 'mundo_aberto';
    const xpGanho = isMundoAberto ? 0 : 100;

    setSalvandoProgresso(true);
    try {
      if (updateUserState && xpGanho > 0) {
        const currentXp = Number((user as any)?.xpTotal) || Number((user as any)?.xp) || 0;
        const newXp = currentXp + xpGanho;
        updateUserState({ xpTotal: newXp, xp: newXp } as any);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('estudemy_user_xp_acumulado', String(newXp));
        }
      }

      if (realModo === 'campanha') {
        await registrarFaseConcluida(realTrilhaId, realFaseId, xpGanho);
        console.log('[Progresso] Registrado campanha com sucesso:', realFaseId, 'na trilha:', realTrilhaId);
      } else if (realModo === 'speedrun' || realModo === 'boss_rush') {
        const key = `estudemy_progresso_${realModo}_${realTrilhaId}`;
        let list: string[] = [];
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            try { list = JSON.parse(raw); } catch (e) { }
          }
          if (!list.includes(realFaseId)) {
            list.push(realFaseId);
            window.localStorage.setItem(key, JSON.stringify(list));
          }
          if (realModo === 'boss_rush') {
            const prev = parseInt(window.localStorage.getItem('estudemy_user_bosses_derrotados') || '0', 10);
            window.localStorage.setItem('estudemy_user_bosses_derrotados', String(Math.min(4, Math.max(prev, list.length))));
          }
        }
        console.log(`[Progresso] Registrado modo ${realModo} localmente:`, realFaseId);
      }
    } catch (err) {
      console.error('[Progresso] Erro ao registrar progresso da fase:', err);
    } finally {
      setSalvandoProgresso(false);
      if (refreshUser && !isMundoAberto && realModo === 'campanha') {
        refreshUser().catch(() => { });
      }
    }
  }, [faseId, trilhaId, gameData, fase, modo, refreshUser, updateUserState, user]);

  // Cálculo da Próxima Fase da Trilha
  const proximaFaseIndex = (gameData?.phaseIndex !== undefined ? gameData.phaseIndex : 0) + 1;
  const listaFasesTrilha = Array.isArray(gameData?.fasesDaTrilha) ? gameData.fasesDaTrilha : [];
  const temProximaFase = proximaFaseIndex < listaFasesTrilha.length;

  const avancarParaProximaFase = useCallback(() => {
    setFimDeJogo(null);
    const targetTrilha = trilhaId || gameData?.trilhaId;
    const nextFase = listaFasesTrilha[proximaFaseIndex];
    if (nextFase && nextFase._id) {
      router.replace({
        pathname: '/game/[faseId]',
        params: {
          faseId: nextFase._id,
          trilhaId: targetTrilha,
          modo: modo || gameData?.modoJogo || 'campanha',
        },
      });
    } else {
      handleVoltar();
    }
  }, [proximaFaseIndex, listaFasesTrilha, trilhaId, gameData, modo, handleVoltar, router]);

  // 5. Carregamento e Preparação dos Dados da Fase Conectada à Trilha
  useEffect(() => {
    async function loadFase() {
      const cleanFaseId = (faseId || '').trim();
      const cleanTrilhaId = (trilhaId || '').trim();

      try {
        let currentFase: any = null;
        let resolvedTrilhaId = cleanTrilhaId;

        // Se faseId for um ID válido (MongoDB ObjectID ou UUID)
        const isFaseDirectId = /^[0-9a-fA-F]{24}$/.test(cleanFaseId) || /^[0-9a-fA-F-]{36}$/.test(cleanFaseId);
        if (isFaseDirectId && !cleanFaseId.startsWith('trilha_')) {
          currentFase = await buscarFasePorId(cleanFaseId).catch(() => null);
          if (currentFase && currentFase.trilhaId) {
            resolvedTrilhaId = resolvedTrilhaId || currentFase.trilhaId;
          }
        } else if (cleanFaseId.startsWith('trilha_')) {
          resolvedTrilhaId = resolvedTrilhaId || cleanFaseId.replace(/^trilha_/, '');
        }

        // Buscar dados da Trilha correspondente
        let trilhaData: any = null;
        let fasesDaTrilha: Fase[] = [];

        if (resolvedTrilhaId) {
          const isTrilhaDirectId = /^[0-9a-fA-F]{24}$/.test(resolvedTrilhaId) || /^[0-9a-fA-F-]{36}$/.test(resolvedTrilhaId);
          if (isTrilhaDirectId) {
            trilhaData = await buscarTrilhaPorId(resolvedTrilhaId).catch(() => null);
            fasesDaTrilha = await buscarFasesPorTrilha(resolvedTrilhaId).catch(() => []);
          }
          if (!trilhaData) {
            const allTrilhas = await listarTrilhas().catch(() => []);
            trilhaData = allTrilhas.find(
              (t) => t._id === resolvedTrilhaId || (t.titulo && t.titulo.toLowerCase().includes(resolvedTrilhaId.toLowerCase()))
            ) || null;
            if (trilhaData && (!fasesDaTrilha || fasesDaTrilha.length === 0)) {
              fasesDaTrilha = await buscarFasesPorTrilha(trilhaData._id).catch(() => []);
            }
          }
        }

        // Se não encontrou a fase específica pelo ID, seleciona a primeira fase disponível da trilha
        if (!currentFase && fasesDaTrilha.length > 0) {
          currentFase = fasesDaTrilha[0];
        }

        // Detectar o tema canônico da trilha (castelo, montanha, deserto, vila, vazio_cosmico)
        const themeKey: ThemeKey = getTrilhaTheme(trilhaData || currentFase || cleanTrilhaId || cleanFaseId);

        // Determinar índice e ordem da fase no tema (0 a 3)
        let phaseIndex = 0;
        const modoAtual = (modo || '').toLowerCase().trim();
        if (phase !== undefined && phase !== null && phase !== '') {
          const parsed = parseInt(phase, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            phaseIndex = parsed % 4;
          }
        } else if (modoAtual === 'boss_rush') {
          phaseIndex = 0;
        } else if (currentFase && fasesDaTrilha.length > 0) {
          const foundIdx = fasesDaTrilha.findIndex((f) => f._id === currentFase._id);
          if (foundIdx >= 0) phaseIndex = foundIdx % 4;
        } else if (currentFase && typeof currentFase.ordem === 'number') {
          phaseIndex = Math.max(0, (currentFase.ordem - 1) % 4);
        }

        const ordemFase = currentFase?.ordem || phaseIndex + 1;

        // Perguntas da fase: prioridade máxima para perguntas cadastradas pelo professor
        let perguntasOriginais: any[] = [];
        if (currentFase && Array.isArray(currentFase.perguntas) && currentFase.perguntas.length > 0) {
          perguntasOriginais = currentFase.perguntas;
        } else if (fasesDaTrilha.length > 0 && Array.isArray(fasesDaTrilha[phaseIndex]?.perguntas) && (fasesDaTrilha[phaseIndex].perguntas?.length || 0) > 0) {
          perguntasOriginais = fasesDaTrilha[phaseIndex].perguntas!;
        } else {
          perguntasOriginais = getThematicQuestions(themeKey, phaseIndex);
        }

        // Herói selecionado pelo usuário no Perfil (Samurai, Mago ou Guerreiro)
        let storedHero = '';
        let storedHeroSkin = '';
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            storedHero = window.localStorage.getItem('estudemy_selected_hero') || '';
            storedHeroSkin = window.localStorage.getItem('estudemy_hero_skin') || '';
          } catch { }
        } else {
          try {
            storedHero = (await SecureStore.getItemAsync('estudemy_selected_hero')) || '';
            storedHeroSkin = (await SecureStore.getItemAsync('estudemy_hero_skin')) || '';
          } catch { }
        }
        const rawPersonagem = storedHero || (user as any)?.personagem || 'Samurai';
        const personagemUsuario = rawPersonagem.toLowerCase().includes('mago') || rawPersonagem.toLowerCase().includes('valerius')
          ? 'mago'
          : rawPersonagem.toLowerCase().includes('guerreiro') || rawPersonagem.toLowerCase().includes('boran')
            ? 'guerreiro'
            : 'samurai';

        const defaultSkin = personagemUsuario === 'mago'
          ? 'mago_arcanista'
          : personagemUsuario === 'guerreiro'
            ? 'guerreiro_templario'
            : 'samurai_ronin';

        const skinUsuario = (
          (user as any)?.skin ||
          (user as any)?.skinSelecionada ||
          storedHeroSkin ||
          defaultSkin
        ).toLowerCase();

        const perguntasTransformadas = perguntasOriginais.map((p: any) => {
          const enunciadoTexto = p.enunciado || p.pergunta || p.titulo || 'Responda à questão:';
          const alternativasOriginais = Array.isArray(p.alternativas) ? [...p.alternativas] : [];

          let textoCorreto = '';
          if (typeof p.respostaCorreta === 'number' && alternativasOriginais[p.respostaCorreta] !== undefined) {
            textoCorreto = alternativasOriginais[p.respostaCorreta];
          } else if (
            typeof p.respostaCorreta === 'string' &&
            /^\d+$/.test(p.respostaCorreta.trim()) &&
            alternativasOriginais[parseInt(p.respostaCorreta.trim(), 10)] !== undefined
          ) {
            textoCorreto = alternativasOriginais[parseInt(p.respostaCorreta.trim(), 10)];
          } else if (typeof p.respostaCorreta === 'string' && alternativasOriginais.includes(p.respostaCorreta)) {
            textoCorreto = p.respostaCorreta;
          } else {
            textoCorreto = alternativasOriginais[0] || '';
          }

          const alternativasEmbaralhadas = [...alternativasOriginais];
          for (let i = alternativasEmbaralhadas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = alternativasEmbaralhadas[i];
            alternativasEmbaralhadas[i] = alternativasEmbaralhadas[j];
            alternativasEmbaralhadas[j] = temp;
          }

          const index = alternativasEmbaralhadas.findIndex((alt) => alt === textoCorreto);
          const novoIndexCorreto = index >= 0 ? index : 0;

          return {
            ...p,
            enunciado: enunciadoTexto,
            alternativas: alternativasEmbaralhadas,
            respostaCorreta: textoCorreto,
            indiceRespostaCorreta: novoIndexCorreto,
            indiceRespostaCorrecta: novoIndexCorreto,
            respostaCorretaIndex: novoIndexCorreto,
            _T5: enunciadoTexto,
            _U5: alternativasEmbaralhadas,
            _V5: novoIndexCorreto,
          };
        });

        const perguntasFinais = [...perguntasTransformadas].sort(() => Math.random() - 0.5);

        const phaseIdFinal = currentFase?._id || `fase_${resolvedTrilhaId || themeKey}_${phaseIndex + 1}`;
        const trilhaTituloFinal = trilhaData?.titulo || `Trilha ${themeKey.toUpperCase()}`;

        const prepared = {
          faseId: phaseIdFinal,
          trilhaId: resolvedTrilhaId || themeKey,
          trilhaTitulo: trilhaTituloFinal,
          trilhaTema: themeKey,
          cenario: themeKey,
          ordem: ordemFase,
          phaseIndex: phaseIndex,
          totalPhasesInTrail: Math.max(1, fasesDaTrilha.length || 4),
          fasesDaTrilha: fasesDaTrilha.map((f) => ({
            _id: f._id,
            titulo: f.titulo,
            ordem: f.ordem,
            perguntas: f.perguntas || [],
          })),
          titulo: currentFase?.titulo || trilhaTituloFinal,
          modoJogo: modo || 'campanha',
          personagem_selecionado: personagemUsuario,
          skin_selecionada: skinUsuario,
          perguntas: perguntasFinais,
          _q5: phaseIdFinal,
          _s5: trilhaTituloFinal,
          _u5: personagemUsuario,
          _D5: themeKey,
          _M5: perguntasFinais,
        };

        setFase(currentFase || {
          _id: phaseIdFinal,
          titulo: prepared.titulo,
          ordem: ordemFase,
          trilhaId: prepared.trilhaId,
          secaoId: '',
          perguntas: perguntasFinais,
        });

        setGameData(prepared);
        setFaseCarregada(true);

        if (typeof window !== 'undefined') {
          (window as any).gameData = prepared;
          try {
            sessionStorage.setItem('estudemy_game_data', JSON.stringify(prepared));
            localStorage.setItem('estudemy_game_data', JSON.stringify(prepared));
          } catch { }
        }
      } catch (err: any) {
        console.error('Erro ao conectar com dados da trilha e fase:', err);
        setErro(err.message || 'Falha ao carregar a fase. Verifique sua conexão.');
      }
    }

    void loadFase();
  }, [faseId, trilhaId, modo, phase, user?.personagem, (user as any)?.skin, (user as any)?.skinSelecionada]);

  // 6. Injeção de gameData na Window (Web) e Ponte de Mensagens
  useEffect(() => {
    if (isWeb && gameData && typeof window !== 'undefined') {
      (window as any).gameData = gameData;
      (window as any).jogar_voltar_js = handleVoltar;

      const handleMessage = async (event: MessageEvent) => {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }

        if (data?.type === 'VOLTAR_PAGINA' || data?.type === 'VOLTAR_TRILHA') {
          handleVoltar();
        } else if (data?.type === 'AVANCAR_FASE') {
          avancarParaProximaFase();
        } else if (data?.type === 'FIM_FASE') {
          if (data?.vitoria) {
            setFimDeJogo('vitoria');
            await salvarProgressoVitoria(data?.faseId, data?.trilhaId, data?.modo);
          } else {
            setFimDeJogo('derrota');
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [isWeb, gameData, handleVoltar, salvarProgressoVitoria, avancarParaProximaFase]);

  // Mensagem nativa recebida do WebView no Mobile
  const handleNativeMessage = async (msgEvent: any) => {
    let payload = msgEvent?.nativeEvent?.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return;
      }
    }

    if (payload?.type === 'VOLTAR_PAGINA' || payload?.type === 'VOLTAR_TRILHA') {
      handleVoltar();
    } else if (payload?.type === 'AVANCAR_FASE') {
      avancarParaProximaFase();
    } else if (payload?.type === 'FIM_FASE') {
      if (payload?.vitoria) {
        setFimDeJogo('vitoria');
        await salvarProgressoVitoria(payload?.faseId, payload?.trilhaId, payload?.modo);
      } else {
        setFimDeJogo('derrota');
      }
    }
  };

  const toggleRotationAngle = () => {
    setPortraitAngle((prev) => {
      const next = prev === 90 ? 270 : 90;
      exibirToast(`Rotação invertida (${next}°)`);
      return next;
    });
  };

  const resetRotation = () => {
    setPortraitAngle(90);
    exibirToast('Orientação padrão (90°)');
  };

  const tentarNovamente = () => {
    setFimDeJogo(null);
    setIframeKey((prev) => prev + 1);
  };

  const podeExibirJogo = faseCarregada && splashCompleta && gameData;

  const spinInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://18.222.3.101';
  const cleanBase = rawBaseUrl.replace(/:5000.*$/, '').replace(/\/api.*$/, '').replace(/\/$/, '');
  const initialTemaFallback = getTrilhaTheme(trilhaId || faseId);
  const activeTema = gameData?.trilhaTema || initialTemaFallback;
  const activeModo = (modo || gameData?.modoJogo || 'campanha').toLowerCase().trim();
  const parsedPhaseParam = phase !== undefined && phase !== '' ? parseInt(phase, 10) : null;
  const activePhase = parsedPhaseParam !== null && !isNaN(parsedPhaseParam)
    ? parsedPhaseParam
    : (activeModo === 'boss_rush' ? 0 : (gameData?.phaseIndex || 0));
  const isMundoAberto = activeModo === 'mundo_aberto';

  let localHero = '';
  let localSkin = '';
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      localHero = window.localStorage?.getItem('estudemy_selected_hero') || '';
      localSkin = window.localStorage?.getItem('estudemy_hero_skin') || '';
    } catch { }
  }
  const rawHero = localHero || (user as any)?.personagem || gameData?.personagem_selecionado || 'Samurai';
  const charKey = rawHero.toLowerCase().includes('mago') || rawHero.toLowerCase().includes('valerius')
    ? 'mago'
    : rawHero.toLowerCase().includes('guerreiro') || rawHero.toLowerCase().includes('boran')
      ? 'guerreiro'
      : 'samurai';
  const defaultSkin = charKey === 'mago' ? 'mago_arcanista' : charKey === 'guerreiro' ? 'guerreiro_templario' : 'samurai_ronin';
  const skinKey = localSkin || (user as any)?.skin || (user as any)?.skinSelecionada || defaultSkin;

  const webGameSrc = isMundoAberto
    ? `/game-pi/mundo_aberto.html?t=${iframeKey}&tema=${activeTema}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`
    : `/game-pi/index.html?t=${iframeKey}&tema=${activeTema}&phase=${activePhase}&modo=${activeModo}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`;

  const isAndroid = Platform.OS === 'android';
  const localAndroidGameSrc = isMundoAberto
    ? `file:///android_asset/game-pi/mundo_aberto.html?t=${iframeKey}&tema=${activeTema}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`
    : `file:///android_asset/game-pi/index.html?t=${iframeKey}&tema=${activeTema}&phase=${activePhase}&modo=${activeModo}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`;

  const remoteGameSrc = isMundoAberto
    ? `${cleanBase}/game-pi/mundo_aberto.html?t=${iframeKey}&tema=${activeTema}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`
    : `${cleanBase}/game-pi/index.html?t=${iframeKey}&tema=${activeTema}&phase=${activePhase}&modo=${activeModo}&personagem=${encodeURIComponent(charKey)}&skin=${encodeURIComponent(skinKey)}`;

  const mobileGameSrc = (isAndroid && !useRemoteFallback)
    ? localAndroidGameSrc
    : remoteGameSrc;

  if (erro) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <AlertTriangle size={56} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Não foi possível carregar o jogo</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>{erro}</Text>
        <View style={styles.errorButtonsRow}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace(`/game/${faseId}` as any)}>
            <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={handleVoltar}>
            <ArrowLeft size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.backBtnText, { color: colors.text }]}>Voltar à Trilha</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar hidden={true} />

      {/* 1. SplashScreen EstudeMy (E-S-T-U-D-E-M-Y) */}
      {!podeExibirJogo && (
        <GameSplashScreen
          onComplete={() => setSplashCompleta(true)}
          mensagem={faseCarregada ? 'INICIANDO JOGO...' : 'CARREGANDO DADOS DA FASE...'}
        />
      )}

      {/* 2. Animação de Entrada: Virar o Celular para Paisagem (Tela Deitada) */}
      {showRotationAnimation && (
        <Animated.View style={[styles.rotationOverlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.phoneIconBox,
              {
                transform: [{ rotate: spinInterpolate }, { scale: pulseAnim }],
              },
            ]}
          >
            <Smartphone size={68} color="#38BDF8" />
          </Animated.View>
          <Text style={styles.rotationTitle}>MODO PAISAGEM ATIVADO</Text>
          <Text style={styles.rotationSubtitle}>
            Segure seu celular na horizontal (tela deitada) para a melhor experiência épica de jogo!
          </Text>
        </Animated.View>
      )}

      {/* 3. Área do Jogo com Proporção 16:9 Widescreen */}
      <View style={styles.gameViewport}>
        <View style={styles.gameInnerCard}>
          {podeExibirJogo && isWeb && (
            <iframe
              key={iframeKey}
              src={webGameSrc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                backgroundColor: '#000000',
              }}
              title="EstudeMy GamePi"
              allow="autoplay; fullscreen; keyboard; orientation"
            />
          )}

          {podeExibirJogo && !isWeb && (
            <WebView
              ref={webViewRef}
              key={`${iframeKey}-${mobileGameSrc}`}
              source={{ uri: mobileGameSrc }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              mixedContentMode="always"
              injectedJavaScriptBeforeContentLoaded={`
                window.gameData = ${JSON.stringify(gameData)};
                window.locationParams = {
                  tema: '${activeTema}',
                  phase: ${activePhase},
                  modo: '${activeModo}',
                  personagem: '${encodeURIComponent(charKey)}',
                  skin: '${encodeURIComponent(skinKey)}'
                };
                true;
              `}
              onMessage={handleNativeMessage}
              originWhitelist={['*']}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error ao carregar jogo:', nativeEvent);
                if (!useRemoteFallback && isAndroid) {
                  setUseRemoteFallback(true);
                }
              }}
            />
          )}
        </View>

        {/* 4. Barra Superior Flutuante de Controles Rápidos */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.floatingControlBtn}
            onPress={handleVoltar}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingControlBtn}
            onPress={resetRotation}
            activeOpacity={0.8}
          >
            <RotateCcw size={16} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingControlBtn}
            onPress={toggleRotationAngle}
            activeOpacity={0.8}
          >
            <Text style={styles.angleLabelText}>{portraitAngle}°</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingControlBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => setShowGuide(true)}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Notificação Toast */}
        {toastMessage && (
          <View style={styles.toastWrap}>
            <Smartphone size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </View>

      {/* 5. Modal de Vitória Épica */}
      {fimDeJogo === 'vitoria' && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.resultCard, styles.victoryCard]}>
            <View style={styles.trophyGlow}>
              <Trophy size={48} color="#F59E0B" />
            </View>
            <View style={styles.stageCompletedBadge}>
              <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.stageCompletedText}>
                {fase?.titulo ? `FASE: ${fase.titulo.toUpperCase()}` : 'FASE CONCLUÍDA'}
              </Text>
            </View>
            <Text style={styles.modalMainTitle}>Vitória Épica!</Text>
            <Text style={styles.modalDescText}>
              Você derrotou o adversário, provou seu domínio no conteúdo e avançou na sua jornada!
            </Text>

            <View style={styles.rewardBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} color="#F59E0B" />
                <Text style={styles.rewardLabel}>Recompensa</Text>
              </View>
              <Text style={styles.rewardAmount}>
                {modo === 'mundo_aberto' || gameData?.modoJogo === 'mundo_aberto' ? '0 XP (Modo Livre)' : '+100 XP'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={avancarParaProximaFase}
              disabled={salvandoProgresso}
              activeOpacity={0.85}
            >
              <Text style={styles.advanceBtnText}>
                {salvandoProgresso
                  ? 'Salvando...'
                  : temProximaFase
                    ? 'Avançar para Próxima Fase'
                    : 'Finalizar Trilha'}
              </Text>
              <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 6. Modal de Derrota */}
      {fimDeJogo === 'derrota' && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.resultCard, styles.defeatCard]}>
            <View style={styles.defeatIconBox}>
              <AlertTriangle size={46} color="#EF4444" />
            </View>
            <Text style={styles.modalMainTitle}>Não foi dessa vez!</Text>
            <Text style={styles.modalDescText}>
              Sua energia esgotou, mas todo erro é uma oportunidade de aprender e evoluir!
            </Text>

            <View style={styles.defeatButtonsRow}>
              <TouchableOpacity
                style={styles.retryGameBtn}
                onPress={tentarNovamente}
                activeOpacity={0.85}
              >
                <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.retryGameBtnText}>Tentar Novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.studyBtn}
                onPress={handleVoltar}
                activeOpacity={0.85}
              >
                <Text style={styles.studyBtnText}>Voltar à Trilha</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal Guia do Jogo & Oráculo IA */}
      <GameGuideModal
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        initialTab="game"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#090a0f',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rotationOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 10, 15, 0.95)',
    zIndex: 9998,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  phoneIconBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  rotationTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  rotationSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  gameViewport: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000000',
  },
  gameInnerCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 50,
  },
  floatingControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  toastWrap: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: [{ translateX: -120 }],
    width: 240,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  errorButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    padding: 24,
    alignItems: 'center',
  },
  victoryCard: {
    backgroundColor: '#18181B',
    borderColor: '#F59E0B',
  },
  defeatCard: {
    backgroundColor: '#18181B',
    borderColor: '#EF4444',
  },
  trophyGlow: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  defeatIconBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stageCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 10,
  },
  stageCompletedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalMainTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 320,
  },
  rewardBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderWidth: 1.5,
    borderColor: '#3F3F46',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  rewardLabel: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
  },
  rewardAmount: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '900',
  },
  advanceBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  advanceBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  defeatButtonsRow: {
    width: '100%',
    gap: 10,
  },
  retryGameBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  retryGameBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  studyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3F3F46',
  },
  studyBtnText: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '800',
  },
});
