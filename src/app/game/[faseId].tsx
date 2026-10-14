import React, { useEffect, useState } from 'react';
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
  },
  Guerreiro: {
    idle: require('../../../assets/assests/samurai/samurai_idle.gif'), // Usando samurai como base
  },
  Mago: {
    idle: require('../../../assets/assests/samurai/samurai_idle.gif'), // Usando samurai como base
  },
  spectre: {
    idle: require('../../../assets/assests/castelo/spectre/Spectre_Parado.gif'),
  },
  arqueira: {
    idle: require('../../../assets/assests/castelo/Arqueira/Arqueira/Arqueira Parada.gif'),
  },
  magoCorrompido: {
    idle: require('../../../assets/assests/castelo/Mago Corrompido/Mago Corrompido/Mago Corrompido Parado.gif'),
  },
  cavaleiroDecaido: {
    idle: require('../../../assets/assests/castelo/Cavaleiro Decaido/Cavaleiro Decaido/Cavaleiro Decadente Parado.gif'),
  },
};

// Mapeamento auxiliar de inimigo por ordem da fase
const ENEMY_MAPPING = ['spectre', 'arqueira', 'magoCorrompido', 'cavaleiroDecaido'];

export default function GameScreen() {
  const { faseId } = useLocalSearchParams<{ faseId: string }>();
  const router = useRouter();
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

  // Animação de ataque/dano (visual flash)
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!faseId) return;
      try {
        const faseData = await buscarFasePorId(faseId);
        setFase(faseData);
        
        // Define o HP do inimigo baseado na ordem da fase
        const enemyIndex = (faseData.ordem - 1) % ENEMY_MAPPING.length;
        const enemyId = ENEMY_MAPPING[enemyIndex];
        const initialEnemyHP = enemyId === 'spectre' ? 100 : enemyId === 'arqueira' ? 150 : 200;
        
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

    // A respostaCorreta no banco pode ser string ou número, validamos aqui
    let correctIdx = 0;
    const dbCorrect = currentQuestion.respostaCorreta;
    if (typeof dbCorrect === 'number') {
      correctIdx = dbCorrect;
    } else {
      correctIdx = currentQuestion.alternativas.indexOf(dbCorrect);
      if (correctIdx === -1) {
        correctIdx = parseInt(dbCorrect) || 0;
      }
    }

    const checkCorrect = selectedAnswer === correctIdx;
    setIsCorrect(checkCorrect);
    setAnswered(true);

    if (checkCorrect) {
      setAcertos((prev) => prev + 1);
      // Animação de dano no inimigo
      setEnemyHit(true);
      setTimeout(() => setEnemyHit(false), 600);

      // Causa dano proporcional no inimigo
      const damage = Math.ceil(enemyMaxHP / totalQuestions);
      setEnemyHP((prev) => {
        const nextHP = Math.max(0, prev - damage);
        if (nextHP <= 0) {
          setTimeout(() => setGameState('VICTORY'), 800);
        }
        return nextHP;
      });
    } else {
      setErros((prev) => prev + 1);
      // Animação de dano no jogador
      setPlayerHit(true);
      setTimeout(() => setPlayerHit(false), 600);

      // Inimigo ataca jogador
      const damage = 20; // 5 erros e você perde
      setPlayerHP((prev) => {
        const nextHP = Math.max(0, prev - damage);
        if (nextHP <= 0) {
          setTimeout(() => setGameState('DEFEAT'), 800);
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

  // Determinar asset do jogador e inimigo
  const playerClassName = user?.personagem || 'Samurai';
  const playerAsset = CHAR_ASSETS[playerClassName]?.idle || CHAR_ASSETS.Samurai.idle;

  const enemyIndex = (fase.ordem - 1) % ENEMY_MAPPING.length;
  const enemyId = ENEMY_MAPPING[enemyIndex];
  const enemyAsset = CHAR_ASSETS[enemyId]?.idle || CHAR_ASSETS.spectre.idle;

  if (gameState === 'VICTORY') {
    return (
      <View style={[styles.endContainer, { backgroundColor: '#1a1a2a' }]}>
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
      <View style={[styles.endContainer, { backgroundColor: '#1a1a2a' }]}>
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
    <View style={[styles.container, { backgroundColor: isDark ? '#11111f' : '#f3f4f6' }]}>
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
          <View style={[styles.characterBox, playerHit && styles.hitActive]}>
            <Text style={styles.characterName}>{playerClassName}</Text>
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

          {/* Inimigo */}
          <View style={[styles.characterBox, enemyHit && styles.hitActive]}>
            <Text style={styles.characterName}>{fase.titulo.split(' ')[0]}</Text>
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
      <ScrollView contentContainerStyle={styles.scrollQuiz} style={[styles.quizArea, { backgroundColor: colors.background }]}>
        {/* Enunciado */}
        <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <Text style={styles.questionIndexText}>Pergunta {currentQuestionIdx + 1} de {totalQuestions}</Text>
          <Text style={[styles.questionStatement, { color: colors.text }]}>{currentQuestion.enunciado}</Text>
        </View>

        {/* Alternativas */}
        <View style={styles.optionsContainer}>
          {currentQuestion.alternativas.map((opcao: string, index: number) => {
            const isSelected = selectedAnswer === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.card },
                  isSelected && styles.optionBtnSelected,
                  answered && index === currentQuestion.respostaCorreta && styles.optionBtnCorrect,
                  answered && isSelected && index !== currentQuestion.respostaCorreta && styles.optionBtnIncorrect,
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={answered}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLetter, { color: colors.textMuted }]}>{String.fromCharCode(65 + index)})</Text>
                <Text style={[styles.optionText, { color: answered ? '#ffffff' : colors.text }]}>{opcao}</Text>
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
    paddingTop: 52,
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
    backgroundColor: 'rgba(239, 68, 68, 0.4)', // Flash de dano vermelho
  },
  characterName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  characterGif: {
    width: 90,
    height: 90,
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
    borderColor: '#1b1b1b',
  },
  optionBtnIncorrect: {
    backgroundColor: '#EF4444', // Fundo vermelho se escolheu errado
    borderColor: '#1b1b1b',
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
