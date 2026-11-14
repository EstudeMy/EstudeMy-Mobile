import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView } from 'react-native-webview';
import { buscarFasePorId, concluirFase, Fase } from '../../services/faseService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import GameSplashScreen from '../../components/game/SplashScreen';
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';

export default function GameScreen() {
  const { faseId, trilhaId } = useLocalSearchParams<{ faseId: string; trilhaId?: string }>();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();

  // Estados de Carregamento e Fases
  const [fase, setFase] = useState<Fase | null>(null);
  const [faseCarregada, setFaseCarregada] = useState(false);
  const [splashCompleta, setSplashCompleta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(1);
  const [gameData, setGameData] = useState<any>(null);

  // Estados de Fim de Fase
  const [fimDeJogo, setFimDeJogo] = useState<'vitoria' | 'derrota' | null>(null);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);

  // Estados de Rotação e Orientação
  const [portraitAngle, setPortraitAngle] = useState<90 | 270>(90);
  const [showRotationAnimation, setShowRotationAnimation] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
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
    if (trilhaId) {
      router.replace(`/trilha/${trilhaId}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  }, [router, trilhaId]);

  // 4. Salvar Progresso de Vitória no Backend
  const salvarProgressoVitoria = useCallback(async () => {
    if (!faseId) return;
    setSalvandoProgresso(true);
    try {
      await concluirFase({ faseId, pontuacao: 100, acertos: 4, erros: 0 });
      console.log('✅ Progresso salvo com sucesso via concluirFase');
    } catch (err) {
      console.warn('⚠️ Tentando rota alternativa de progresso...', err);
      try {
        await api.post('/api/progresso/salvar', {
          faseId,
          pontuacao: 100,
          totalPerguntas: 4,
          respostasUsuario: [0, 0, 0, 0],
        });
      } catch (err2) {
        console.error('❌ Erro ao salvar progresso da fase:', err2);
      }
    } finally {
      setSalvandoProgresso(false);
      if (refreshUser) {
        refreshUser().catch(() => {});
      }
    }
  }, [faseId, refreshUser]);

  // 5. Carregamento e Preparação dos Dados da Fase (Fisher-Yates)
  useEffect(() => {
    async function loadFase() {
      if (!faseId) {
        setErro('ID da fase não fornecido.');
        return;
      }
      try {
        const res = await buscarFasePorId(faseId);
        setFase(res);

        // Transformar perguntas
        const personagemUsuario = (user?.personagem || 'samurai').toLowerCase();
        const perguntasTransformadas = (res.perguntas || []).map((p: any) => {
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
            alternativas: alternativasEmbaralhadas,
            respostaCorreta: textoCorreto,
            indiceRespostaCorreta: novoIndexCorreto,
            indiceRespostaCorrecta: novoIndexCorreto,
            respostaCorretaIndex: novoIndexCorreto,
            _T5: p.enunciado,
            _U5: alternativasEmbaralhadas,
            _V5: novoIndexCorreto,
          };
        });

        const perguntasFinais = [...perguntasTransformadas].sort(() => Math.random() - 0.5);

        const prepared = {
          faseId: res._id,
          titulo: res.titulo,
          personagem_selecionado: personagemUsuario,
          cenario: res.cenario || 'bg_dojo',
          perguntas: perguntasFinais,
          _q5: res._id,
          _s5: res.titulo,
          _u5: personagemUsuario,
          _D5: res.cenario || 'bg_dojo',
          _M5: perguntasFinais,
        };

        setGameData(prepared);
        setFaseCarregada(true);
      } catch (err: any) {
        console.error('Erro ao carregar dados da fase:', err);
        setErro(err.message || 'Falha ao carregar a fase. Verifique sua conexão.');
      }
    }

    void loadFase();
  }, [faseId, user?.personagem]);

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
        } else if (data?.type === 'FIM_FASE') {
          if (data?.vitoria) {
            setFimDeJogo('vitoria');
            await salvarProgressoVitoria();
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
  }, [isWeb, gameData, handleVoltar, salvarProgressoVitoria]);

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

    if (payload?.type === 'VOLTAR_PAGINA') {
      handleVoltar();
    } else if (payload?.type === 'FIM_FASE') {
      if (payload?.vitoria) {
        setFimDeJogo('vitoria');
        await salvarProgressoVitoria();
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
  const gameUri = `${cleanBase}/game-pi/index.html?t=${iframeKey}`;

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
          <Text style={styles.rotationTitle}>MODO PAISAGEM ATIVADO 📱🔄</Text>
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
              src={`/game-pi/index.html?t=${iframeKey}`}
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
              key={iframeKey}
              source={{ uri: gameUri }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScriptBeforeContentLoaded={`
                window.gameData = ${JSON.stringify(gameData)};
                true;
              `}
              onMessage={handleNativeMessage}
              originWhitelist={['*']}
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
            <Text style={styles.modalMainTitle}>Vitória Épica! 🎉</Text>
            <Text style={styles.modalDescText}>
              Você derrotou o adversário, provou seu domínio no conteúdo e avançou na sua jornada!
            </Text>

            <View style={styles.rewardBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} color="#F59E0B" />
                <Text style={styles.rewardLabel}>Recompensa</Text>
              </View>
              <Text style={styles.rewardAmount}>+100 XP</Text>
            </View>

            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={handleVoltar}
              disabled={salvandoProgresso}
              activeOpacity={0.85}
            >
              <Text style={styles.advanceBtnText}>
                {salvandoProgresso ? 'Salvando...' : 'Avançar para a Trilha'}
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
