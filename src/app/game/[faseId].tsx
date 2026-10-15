import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buscarFasePorId, concluirFase, Fase } from '../../services/faseService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FASE_BACKGROUNDS } from '../../constants/assets';
import { ArrowLeft, Check, X, ShieldAlert, Sparkles, Heart } from 'lucide-react-native';
import asyncLock from '../../utils/asyncLock';
import logger from '../../utils/logger';


const screenWidth = Dimensions.get('window').width;

// Dicionário estático para carregar os assets de GIFs via Metro Bundler
// Inclui fallbacks seguros em caso de caminhos inexistentes
const CHAR_ASSETS: Record<string, any> = {
  Samurai: {
    idle: require('../../../assets/assests/samurai/samurai_idle.gif'),
    attack: require('../../../assets/assests/samurai/samurai_Golpe_1 .gif'),
  },
  Guerreiro: {
    idle: require('../../../assets/assests/samurai/samurai_idle.gif'),
    attack: require('../../../assets/assests/samurai/samurai_Golpe_1 .gif'),
  },
  Mago: {
    idle: require('../../../assets/assests/samurai/samurai_idle.gif'),
    attack: require('../../../assets/assests/samurai/samurai_Golpe_1 .gif'),
  },
  spectre: {
    idle: require('../../../assets/assests/castelo/spectre/Spectre_Parado.gif'),
    attack: require('../../../assets/assests/castelo/spectre/Spectre_Golpe_1.gif'),
  },
  arqueira: {
    idle: require('../../../assets/assests/castelo/Arqueira/Arqueira/Arqueira Parada.gif'),
    attack: require('../../../assets/assests/castelo/Arqueira/Arqueira/Arqueira Golpe 1.gif'),
  },
  magoCorrompido: {
    idle: require('../../../assets/assests/castelo/Mago Corrompido/Mago Corrompido/Mago Corrompido Parado.gif'),
    attack: require('../../../assets/assests/castelo/Mago Corrompido/Mago Corrompido/Mago Corrompido Golpe 1.gif'),
  },
  cavaleiroDecaido: {
    idle: require('../../../assets/assests/castelo/Cavaleiro Decaido/Cavaleiro Decaido/Cavaleiro Decadente Parado.gif'),
    attack: require('../../../assets/assests/castelo/Cavaleiro Decaido/Cavaleiro Decaido/Cavaleiro Decadente Golpe 1.gif'),
  },
};

// Mapeamento auxiliar de inimigos com nome correto e HP base
interface EnemyInfo {
  id: string;
  name: string;
  maxHP: number;
}

const ENEMY_MAPPING: EnemyInfo[] = [
  { id: 'spectre', name: 'Spectre', maxHP: 100 },
  { id: 'arqueira', name: 'Arqueira', maxHP: 150 },
  { id: 'magoCorrompido', name: 'Mago Corrompido', maxHP: 200 },
  { id: 'cavaleiroDecaido', name: 'Cavaleiro Decaído', maxHP: 250 },
];

export default function GameScreen() {
  const { faseId } = useLocalSearchParams<{ faseId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { isDark, colors } = useTheme();


  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState<Fase | null>(null);
  
  // Estados do Jogo
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyMaxHP, setEnemyMaxHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'VICTORY' | 'DEFEAT'>('PLAYING');
  const [savingProgress, setSavingProgress] = useState(false);

  // Animação de ataque e dano (visual flash + troca de sprites)
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);

  // Helper para resolver o índice da resposta correta (seja string ou número no banco)
  const getCorrectAnswerIndex = useCallback((question: any): number => {
    if (!question) return 0;
    const dbCorrect = question.respostaCorreta;
    if (typeof dbCorrect === 'number') {
      return dbCorrect;
    }
    if (typeof dbCorrect === 'string') {
      // 1. Tenta achar o texto exato da alternativa
      const idx = question.alternativas?.findIndex(
        (alt: string) => alt.trim().toLowerCase() === dbCorrect.trim().toLowerCase()
      );
      if (idx !== undefined && idx !== -1) return idx;

      // 2. Tenta parsear número '0', '1', '2'
      const parsedNum = parseInt(dbCorrect, 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < (question.alternativas?.length || 4)) {
        return parsedNum;
      }

      // 3. Tenta letra 'A', 'B', 'C', 'D'
      const trimmed = dbCorrect.trim().toUpperCase();
      if (trimmed.length === 1) {
        const code = trimmed.charCodeAt(0);
        if (code >= 65 && code <= 68) {
          return code - 65;
        }
      }
    }
    return 0;
  }, []);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!faseId) return;
      try {
        const faseData = await buscarFasePorId(faseId);
        setFase(faseData);
        
        // Define o HP do inimigo baseado na ordem da fase
        const enemyIndex = (faseData.ordem - 1) % ENEMY_MAPPING.length;
        const currentEnemy = ENEMY_MAPPING[enemyIndex >= 0 ? enemyIndex : 0];
        const initialEnemyHP = currentEnemy.maxHP;
        
        setEnemyMaxHP(initialEnemyHP);
        setEnemyHP(initialEnemyHP);
      } catch (e) {
        console.error('Erro ao carregar fase do jogo:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, [faseId]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a2a' : '#f9fafb' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ color: '#ffffff', marginTop: 12 }}>Carregando batalha...</Text>
      </View>
    );
  }

  if (!fase || !fase.perguntas || fase.perguntas.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a2a' : '#f9fafb' }]}>
        <Text style={{ color: '#ffffff', fontSize: 16 }}>Nenhuma pergunta cadastrada nesta fase.</Text>
        <TouchableOpacity style={styles.backBtnText} onPress={() => router.back()}>
          <Text style={{ color: '#4F46E5', fontWeight: '900', marginTop: 14 }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = fase.perguntas[currentQuestionIdx];
  const totalQuestions = fase.perguntas.length;

  const handleSelectAnswer = (optionIdx: number) => {
    if (answered) return;
    setSelectedAnswer(optionIdx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || answered) return;

    const correctIdx = getCorrectAnswerIndex(currentQuestion);
    const checkCorrect = selectedAnswer === correctIdx;
    setIsCorrect(checkCorrect);
    setAnswered(true);

    if (checkCorrect) {
      setAcertos((prev) => prev + 1);

      // Animação de ataque do jogador e dano no inimigo
      setIsPlayerAttacking(true);
      setEnemyHit(true);
      setTimeout(() => {
        setIsPlayerAttacking(false);
        setEnemyHit(false);
      }, 750);

      // Causa dano proporcional no inimigo
      const damage = Math.ceil(enemyMaxHP / totalQuestions);
      setEnemyHP((prev) => {
        const nextHP = Math.max(0, prev - damage);
        if (nextHP <= 0) {
          setTimeout(() => setGameState('VICTORY'), 850);
        }
        return nextHP;
      });
    } else {
      setErros((prev) => prev + 1);

      // Animação de ataque do inimigo e dano no jogador
      setIsEnemyAttacking(true);
      setPlayerHit(true);
      setTimeout(() => {
        setIsEnemyAttacking(false);
        setPlayerHit(false);
      }, 750);

      // Inimigo ataca jogador
      const damage = 20; // 5 erros e você perde
      setPlayerHP((prev) => {
        const nextHP = Math.max(0, prev - damage);
        if (nextHP <= 0) {
          setTimeout(() => setGameState('DEFEAT'), 850);
        }
        return nextHP;
      });
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setAnswered(false);

    if (currentQuestionIdx + 1 < totalQuestions) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Perguntas acabaram. Se o inimigo ainda tem HP, o jogador perdeu
      if (enemyHP > 0) {
        setGameState('DEFEAT');
      } else {
        setGameState('VICTORY');
      }
    }
  };

  const handleFinishPhase = async () => {
    if (!faseId || savingProgress) return;

    // RC09: Prevenção de Race Condition usando trava atômica no cliente
    await asyncLock.runExclusive(`finish_phase_${faseId}`, async () => {
      setSavingProgress(true);
      try {
        await concluirFase({
          faseId: String(faseId),
          pontuacao: acertos,
          totalPerguntas: totalQuestions,
          acertos: acertos,
          erros: erros,
        });
        await refreshUser(); // Atualiza XP do usuário atomicamente
        router.back();
      } catch (e) {
        logger.error('Erro ao salvar progresso');
        router.back(); // Volta de qualquer forma para não travar
      } finally {
        setSavingProgress(false);
      }
    });
  };

  // Determinar asset e nome do jogador e inimigo (idle vs attack)
  const playerClassName = user?.personagem || 'Samurai';
  const playerDisplayName = user?.username || user?.nome || playerClassName || 'Jogador';
  const playerAsset = isPlayerAttacking
    ? (CHAR_ASSETS[playerClassName]?.attack || CHAR_ASSETS.Samurai.attack)
    : (CHAR_ASSETS[playerClassName]?.idle || CHAR_ASSETS.Samurai.idle);

  const enemyIndex = (fase.ordem - 1) % ENEMY_MAPPING.length;
  const currentEnemy = ENEMY_MAPPING[enemyIndex >= 0 ? enemyIndex : 0];
  const enemyAsset = isEnemyAttacking
    ? (CHAR_ASSETS[currentEnemy.id]?.attack || CHAR_ASSETS.spectre.attack)
    : (CHAR_ASSETS[currentEnemy.id]?.idle || CHAR_ASSETS.spectre.idle);
  const bossDisplayName = currentEnemy.name;

  if (gameState === 'VICTORY') {
    return (
      <View
        style={[
          styles.endContainer,
          {
            backgroundColor: '#1a1a2a',
            paddingTop: Math.max(insets.top + 20, 24),
            paddingBottom: Math.max(insets.bottom + 16, 16),
          },
        ]}
      >
        <View style={styles.victoryCard}>
          <Sparkles size={48} color="#FBBF24" />
          <Text style={styles.victoryTitle}>Vitória!</Text>
          <Text style={styles.endSubtitle}>Você derrotou o monstro e completou a fase!</Text>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Acertos: {acertos}</Text>
            <Text style={styles.statsText}>Erros: {erros}</Text>
            <Text style={styles.xpGainText}>+50 XP Obtidos!</Text>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishPhase} disabled={savingProgress}>
            {savingProgress ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.finishBtnText}>Concluir Batalha</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameState === 'DEFEAT') {
    return (
      <View
        style={[
          styles.endContainer,
          {
            backgroundColor: '#1a1a2a',
            paddingTop: Math.max(insets.top + 20, 24),
            paddingBottom: Math.max(insets.bottom + 16, 16),
          },
        ]}
      >
        <View style={styles.defeatCard}>
          <ShieldAlert size={48} color="#EF4444" />
          <Text style={styles.defeatTitle}>Derrota...</Text>
          <Text style={styles.endSubtitle}>Seu HP chegou a zero. Revise a matéria e tente de novo!</Text>

          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Perguntas respondidas: {currentQuestionIdx + 1}</Text>
            <Text style={styles.statsText}>Acertos: {acertos}</Text>
          </View>

          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace(`/game/${faseId}`)}>
            <Text style={styles.finishBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backBtnText} onPress={() => router.back()}>
            <Text style={{ color: '#9CA3AF', fontWeight: '800', marginTop: 16 }}>Voltar para a Trilha</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#11111f' : '#f3f4f6',
          paddingTop: Math.max(insets.top + 8, 48),
        },
      ]}
    >
      {/* Botão de Fechar */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <ArrowLeft size={20} color="#ffffff" />
      </TouchableOpacity>

      {/* ÁREA DE COMBATE RPG */}
      <ImageBackground
        source={FASE_BACKGROUNDS.castelo}
        style={styles.combatArea}
        resizeMode="cover"
      >
        <View style={styles.combatOverlay}>
          {/* Jogador */}
          <View style={[styles.characterBox, isPlayerAttacking && styles.playerAttacking, playerHit && styles.hitActive]}>
            <Text style={styles.characterName} numberOfLines={1}>{playerDisplayName}</Text>
            <Image source={playerAsset} style={styles.characterGif} contentFit="contain" />
            <View style={styles.hpContainer}>
              <Heart size={12} color="#EF4444" fill="#EF4444" style={{ marginRight: 4 }} />
              <View style={styles.hpBarBg}>
                <View style={[styles.hpBarFill, { width: `${playerHP}%` }]} />
              </View>
            </View>
            <Text style={styles.hpText}>{playerHP}/100 HP</Text>
          </View>

          {/* VS */}
          <Text style={styles.vsText}>VS</Text>

          {/* Inimigo / Boss */}
          <View style={[styles.characterBox, isEnemyAttacking && styles.enemyAttacking, enemyHit && styles.hitActive]}>
            <Text style={styles.characterName} numberOfLines={1}>{bossDisplayName}</Text>
            <Image source={enemyAsset} style={styles.characterGif} contentFit="contain" />
            <View style={styles.hpContainer}>
              <Heart size={12} color="#EF4444" fill="#EF4444" style={{ marginRight: 4 }} />
              <View style={styles.hpBarBg}>
                <View style={[styles.hpBarFill, { width: `${(enemyHP / enemyMaxHP) * 100}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
            <Text style={styles.hpText}>{enemyHP}/{enemyMaxHP} HP</Text>
          </View>
        </View>
      </ImageBackground>

      {/* PERGUNTA E ALTERNATIVAS */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollQuiz,
          { paddingBottom: Math.max(insets.bottom + 16, 16) },
        ]}
        style={[styles.quizArea, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Enunciado */}
        <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <Text style={styles.questionIndexText}>Pergunta {currentQuestionIdx + 1} de {totalQuestions}</Text>
          <Text style={[styles.questionStatement, { color: colors.text }]}>{currentQuestion.enunciado}</Text>
        </View>

        {/* Alternativas */}
        <View style={styles.optionsContainer}>
          {currentQuestion.alternativas.map((opcao: string, index: number) => {
            const isSelected = selectedAnswer === index;
            const correctIdx = getCorrectAnswerIndex(currentQuestion);
            const isThisCorrect = index === correctIdx;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.card },
                  isSelected && !answered && styles.optionBtnSelected,
                  answered && isThisCorrect && styles.optionBtnCorrect,
                  answered && isSelected && !isThisCorrect && styles.optionBtnIncorrect,
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={answered}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLetter, { color: answered && (isThisCorrect || isSelected) ? '#ffffff' : colors.textMuted }]}>{String.fromCharCode(65 + index)})</Text>
                <Text style={[styles.optionText, { color: answered && (isThisCorrect || isSelected) ? '#ffffff' : colors.text }]}>{opcao}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback da Resposta */}
        {answered && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
            <View style={styles.feedbackHeader}>
              {isCorrect ? (
                <>
                  <Check size={20} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.feedbackTitleText}>Excelente! Você acertou!</Text>
                </>
              ) : (
                <>
                  <X size={20} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.feedbackTitleText}>Ops! Resposta errada.</Text>
                </>
              )}
            </View>
            {currentQuestion.explicacao && (
              <Text style={styles.explanationText}>{currentQuestion.explicacao}</Text>
            )}
            
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentQuestionIdx + 1 < totalQuestions ? 'Próxima Questão' : 'Finalizar Batalha'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botão de Enviar (se ainda não respondido) */}
        {!answered && (
          <TouchableOpacity
            style={[styles.submitBtn, selectedAnswer === null && styles.submitBtnDisabled]}
            disabled={selectedAnswer === null}
            onPress={handleSubmitAnswer}
            activeOpacity={0.9}
          >
            <Text style={styles.submitBtnText}>Confirmar Ataque ⚔️</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  combatArea: {
    borderBottomWidth: 4,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
  },
  combatOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 18,
    backgroundColor: 'rgba(15, 15, 26, 0.72)',
  },
  characterBox: {
    alignItems: 'center',
    width: screenWidth * 0.4,
    padding: 8,
    borderRadius: 12,
  },
  hitActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.45)', // Flash de dano vermelho
    transform: [{ scale: 0.96 }],
  },
  playerAttacking: {
    transform: [{ translateX: 12 }, { scale: 1.06 }],
  },
  enemyAttacking: {
    transform: [{ translateX: -12 }, { scale: 1.06 }],
  },
  characterName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  characterGif: {
    width: 96,
    height: 96,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  hpBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#374151',
    borderRadius: 5,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#EF4444', // Vermelho HP
  },
  hpText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  vsText: {
    color: '#EAB308',
    fontSize: 18,
    fontWeight: '900',
  },
  quizArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollQuiz: {
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  questionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#2D2D44',
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  questionIndexText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#818CF8', // indigo-400
    marginBottom: 6,
  },
  questionStatement: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  optionBtnSelected: {
    borderColor: '#F59E0B', // Borda amarela de seleção
    backgroundColor: '#374151',
  },
  optionBtnCorrect: {
    backgroundColor: '#10B981', // Fundo verde para a correta
    borderColor: '#059669',
  },
  optionBtnIncorrect: {
    backgroundColor: '#EF4444', // Fundo vermelho se escolheu errado
    borderColor: '#B91C1C',
  },
  optionLetter: {
    color: '#9CA3AF',
    fontWeight: '900',
    marginRight: 8,
  },
  optionText: {
    color: '#ffffff',
    fontWeight: '700',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#CA8A04',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginTop: 10,
  },
  feedbackCorrect: {
    backgroundColor: '#16A34A',
  },
  feedbackIncorrect: {
    backgroundColor: '#DC2626',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  explanationText: {
    color: '#F3F4F6',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#1b1b1b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  nextBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  victoryCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1E1E2F',
    borderRadius: 16,
    padding: 28,
    borderWidth: 4,
    borderColor: '#FBBF24', // Borda dourada
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  defeatCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1E1E2F',
    borderRadius: 16,
    padding: 28,
    borderWidth: 4,
    borderColor: '#EF4444', // Borda vermelha
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  victoryTitle: {
    color: '#FBBF24',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
  },
  defeatTitle: {
    color: '#EF4444',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
  },
  endSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    width: '100%',
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  statsText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  xpGainText: {
    color: '#FBBF24',
    fontWeight: '900',
    fontSize: 15,
    marginTop: 4,
  },
  finishBtn: {
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    marginTop: 24,
  },
  retryBtn: {
    backgroundColor: '#CA8A04',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    marginTop: 24,
  },
  finishBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  backBtnText: {
    alignItems: 'center',
  },
});
