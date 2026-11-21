import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { askGameOracle, ChatMessage } from '../../services/gameAiService';
import {
  Compass,
  Swords,
  Sparkles,
  Zap,
  Lock,
  Star,
  Check,
  BookOpen,
  Heart,
  Coins,
  Trophy,
  X,
  Send,
  RotateCcw,
  Shield,
  Flame,
  Clock,
  MapPin,
  Bot,
  User,
  Skull,
  Layers,
  Crown,
  ChevronRight,
} from 'lucide-react-native';

export interface GameGuideModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'trail' | 'game' | 'ai' | 'tips';
}

export default function GameGuideModal({
  visible,
  onClose,
  initialTab = 'trail',
}: GameGuideModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'trail' | 'game' | 'ai' | 'tips'>(initialTab);

  // Estados do Chat com IA (Oráculo do Jogo)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'oracle',
      text: '⚔️ **Saudações, nobre guerreiro do saber!**\n\nEu sou o **Oráculo e Mestre do EstudeMy Game**. Minha missão é guiar sua mente e sua lâmina pelas trilhas do conhecimento!\n\nPosso te ajudar com táticas contra chefões (como Ignis, Shogun e Khepri), mecânicas de Parry e Ultimate, heróis e modos de jogo. O que deseja saber?',
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<any>(null);

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  useEffect(() => {
    if (activeTab === 'ai') {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiLoading(true);

    try {
      const response = await askGameOracle(text, messages);
      const oracleMsg: ChatMessage = {
        id: 'orc_' + Date.now(),
        sender: 'oracle',
        text: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, oracleMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: 'orc_err_' + Date.now(),
        sender: 'oracle',
        text: '🛡️ Meus pergaminhos enfrentaram uma oscilação na fenda cósmica! Tente perguntar novamente sobre fraquezas dos chefões, Parry, Ultimate ou modos de jogo.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'oracle',
        text: '📜 Grimório de conversa reiniciado! Como posso guiar sua jornada no EstudeMy Game hoje?',
        timestamp: Date.now(),
      },
    ]);
  };

  const quickQuestions = [
    { label: '🔥 Vencer o Ignis', query: 'Como derrotar o Ignis, o Titã Vulcânico?' },
    { label: '⚡ Como usar o Ultimate', query: 'Como funciona a barra de Ultimate e quando ela ativa?' },
    { label: '🛡️ Parry & QTE', query: 'Como funciona o Parry e os reflexos de QTE no combate?' },
    { label: '👑 Modo Boss Rush', query: 'O que é o modo Boss Rush e quais são as regras?' },
    { label: '🗼 Torre do Conhecimento', query: 'Como funciona a Torre do Conhecimento?' },
    { label: '🥋 Melhores Heróis', query: 'Qual a diferença entre o Samurai Kaito, Guerreiro Boran e Mago Valerius?' },
    { label: '🗺️ Mundo Aberto RPG', query: 'Como funciona o Modo Mundo Aberto RPG?' },
    { label: '💀 Behemoth da Cripta', query: 'Quais as melhores dicas para vencer o Behemoth da Cripta?' },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderColor: isDark ? '#2D3748' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom + 12, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#262626' : '#F1F5F9' }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: '#4F46E522' }]}>
                <Crown size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('trail.guideTitle') || 'Guia do Jogo & Trilha'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {t('trail.guideSubtitle') || 'Mecânicas, Chefões, Modos e Mestre IA'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeModalBtn} activeOpacity={0.7}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Abas Superiores */}
          <View style={[styles.tabsBar, { borderBottomColor: isDark ? '#262626' : '#E5E7EB' }]}>
            {/* Tab 1: A Trilha */}
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'trail' && [styles.tabBtnActive, { borderBottomColor: '#4F46E5' }],
              ]}
              onPress={() => setActiveTab('trail')}
              activeOpacity={0.8}
            >
              <Compass size={16} color={activeTab === 'trail' ? '#4F46E5' : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'trail' ? '#4F46E5' : colors.textMuted },
                  activeTab === 'trail' && styles.tabBtnTextActive,
                ]}
              >
                {t('trail.guideTabTrail') || 'Trilha'}
              </Text>
            </TouchableOpacity>

            {/* Tab 2: O Jogo RPG */}
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'game' && [styles.tabBtnActive, { borderBottomColor: '#F59E0B' }],
              ]}
              onPress={() => setActiveTab('game')}
              activeOpacity={0.8}
            >
              <Swords size={16} color={activeTab === 'game' ? '#F59E0B' : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'game' ? '#F59E0B' : colors.textMuted },
                  activeTab === 'game' && styles.tabBtnTextActive,
                ]}
              >
                {t('trail.guideTabGame') || 'O Jogo'}
              </Text>
            </TouchableOpacity>

            {/* Tab 3: Oráculo IA (NOVA SUB-ABA) */}
            <TouchableOpacity
              style={[
                styles.tabBtn,
                styles.tabBtnAi,
                activeTab === 'ai' && [styles.tabBtnActive, { borderBottomColor: '#8B5CF6' }],
              ]}
              onPress={() => setActiveTab('ai')}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color={activeTab === 'ai' ? '#A855F7' : '#9333EA'} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'ai' ? '#8B5CF6' : colors.textMuted },
                  activeTab === 'ai' && styles.tabBtnTextActive,
                ]}
              >
                Oráculo IA
              </Text>
              <View style={styles.aiBadgePill}>
                <Text style={styles.aiBadgePillText}>IA</Text>
              </View>
            </TouchableOpacity>

            {/* Tab 4: Dicas */}
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'tips' && [styles.tabBtnActive, { borderBottomColor: '#10B981' }],
              ]}
              onPress={() => setActiveTab('tips')}
              activeOpacity={0.8}
            >
              <Zap size={16} color={activeTab === 'tips' ? '#10B981' : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'tips' ? '#10B981' : colors.textMuted },
                  activeTab === 'tips' && styles.tabBtnTextActive,
                ]}
              >
                {t('trail.guideTabTips') || 'Dicas'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ======================= CONTEÚDO TAB: A TRILHA ======================= */}
          {activeTab === 'trail' && (
            <ScrollView
              style={styles.tabBodyScroll}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                {t('trail.guideTrailIntro') || 'Sua jornada de aprendizado é organizada em uma trilha linear com fases e biomas temáticos.'}
              </Text>

              {/* Status das Fases */}
              <Text style={[styles.subheading, { color: colors.text }]}>📍 Status das Fases na Trilha</Text>
              
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#374151' }]}>
                  <Lock size={18} color="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideStatusLockedTitle') || 'Fase Bloqueada'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Fases futuras protegidas. Você precisa concluir as fases anteriores da trilha para liberá-las.
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#4F46E5' }]}>
                  <Star size={18} color="#ffffff" fill="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideStatusAvailableTitle') || 'Fase Atual (Disponível)'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    É o seu próximo grande desafio! O herói fica posicionado em cima desta fase no mapa.
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#10B981' }]}>
                  <Check size={18} color="#ffffff" strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideStatusCompletedTitle') || 'Fase Concluída'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Marcada com check verde. Você pode jogá-la novamente a qualquer instante para revisar matéria sem gastar vidas!
                  </Text>
                </View>
              </View>

              {/* Tipos de Fases */}
              <Text style={[styles.subheading, { color: colors.text, marginTop: 8 }]}>📚 Tipos de Fases</Text>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#3B82F6' }]}>
                  <BookOpen size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Fase de Conteúdo Teórico</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Módulos explicativos e resumos didáticos. Leia antes dos quizzes para dominar o conteúdo.
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#E11D48' }]}>
                  <Skull size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Batalha de Chefão Supremo</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Fases climáticas contra Ignis, Khepri, Shogun ou Behemoth com cutscenes e ataques devastadores!
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F97316' }]}>
                  <Layers size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Hordas de Monstros</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Enfrente de 1 a 3 monstros em campo simultâneo. Respostas certas limpam as fileiras inimigas!
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* ======================= CONTEÚDO TAB: O JOGO RPG ======================= */}
          {activeTab === 'game' && (
            <ScrollView
              style={styles.tabBodyScroll}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                Descubra todas as mecânicas, chefões, heróis e os 5 modos de jogo do EstudeMy RPG!
              </Text>

              {/* 1. Combate em Turnos */}
              <View style={[styles.featureCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={styles.featureHeader}>
                  <Swords size={20} color="#6366F1" />
                  <Text style={[styles.featureTitle, { color: '#4F46E5' }]}>Combate em Turnos RPG</Text>
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  • **Acertar a pergunta:** O herói desfere um ataque imediato com espada, arco ou magia elemental.{'\n'}
                  • **Errar a pergunta:** Os monstros contra-atacam e o herói perde HP/Vida.{'\n'}
                  • **Câmera Dinâmica:** Zooms de aproximação cinematográfica e tremor de tela nos impactos!
                </Text>
              </View>

              {/* 2. QTE & Parry Defensivo */}
              <View style={[styles.featureCard, { backgroundColor: isDark ? '#422006' : '#FEF3C7', borderColor: '#F59E0B' }]}>
                <View style={styles.featureHeader}>
                  <Shield size={20} color="#F59E0B" />
                  <Text style={[styles.featureTitle, { color: '#D97706' }]}>QTE & Parry Defensivo</Text>
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  • Quando o chefão prepara um golpe massivo, surge um botão dourado de reflexo.{'\n'}
                  • **Timing Perfeito:** Pressioná-lo no momento certo bloqueia até 70% do dano e engatilha um contra-ataque relâmpago!
                </Text>
              </View>

              {/* 3. Barra de Ultimate */}
              <View style={[styles.featureCard, { backgroundColor: isDark ? '#2E1065' : '#F3E8FF', borderColor: '#A855F7' }]}>
                <View style={styles.featureHeader}>
                  <Zap size={20} color="#A855F7" />
                  <Text style={[styles.featureTitle, { color: '#9333EA' }]}>Barra de Ultimate (0 a 100%)</Text>
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  • Cada resposta certa preenche sua barra de energia.{'\n'}
                  • **Ao atingir 100%:** Dispare o Golpe Supremo em tela cheia com animação devastadora em área!
                </Text>
              </View>

              {/* 4. Chefões Supremos */}
              <Text style={[styles.subheading, { color: colors.text, marginTop: 4 }]}>👑 Chefões Supremos</Text>
              
              <View style={[styles.bossGridItem, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: '#EF4444' }]}>
                <Flame size={20} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Ignis, o Titã Vulcânico</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Golpes sísmicos de magma e erupção de cratera. Use magias de água/gelo e combos velozes!
                  </Text>
                </View>
              </View>

              <View style={[styles.bossGridItem, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: '#EAB308' }]}>
                <SunIconComponent size={20} color="#EAB308" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#CA8A04' }]}>Khepri-Ra, o Escaravelho Solar</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Dunas do deserto e raios de sol ofuscantes. Mantenha alta taxa de crítico com o Samurai!
                  </Text>
                </View>
              </View>

              <View style={[styles.bossGridItem, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: '#8B5CF6' }]}>
                <Sparkles size={20} color="#8B5CF6" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#8B5CF6' }]}>Shogun do Vazio</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Quatro katanas dimensionais e fenda cósmica. Timing rápido de Parry é essencial aqui!
                  </Text>
                </View>
              </View>

              <View style={[styles.bossGridItem, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: '#10B981' }]}>
                <Skull size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#059669' }]}>Behemoth da Cripta</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Esqueleto colossal com chamas espectrais verdes. Use a alta resistência do Guerreiro Boran!
                  </Text>
                </View>
              </View>

              {/* 5. Os 5 Modos de Jogo */}
              <Text style={[styles.subheading, { color: colors.text, marginTop: 6 }]}>🎮 Os 5 Modos de Jogo</Text>

              <View style={[styles.modeCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <Text style={[styles.modeCardTitle, { color: colors.text }]}>1. Modo Campanha (Trilha da Sabedoria)</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  A história principal com biomas temáticos (Vila, Deserto, Vulcão, Vazio Cósmico).
                </Text>
              </View>

              <View style={[styles.modeCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <Text style={[styles.modeCardTitle, { color: colors.text }]}>2. Torre do Conhecimento (Sobrevivência)</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Estilo Mortal Kombat: suba andar por andar a cada vitória. Se perder, volta ao Andar 1! (2.0x XP).
                </Text>
              </View>

              <View style={[styles.modeCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <Text style={[styles.modeCardTitle, { color: colors.text }]}>3. Boss Rush (Arena dos Mestres)</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Enfrente todos os chefões supremos em sequência. Sua vida NÃO se regenera entre as lutas! (2.5x XP).
                </Text>
              </View>

              <View style={[styles.modeCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <Text style={[styles.modeCardTitle, { color: colors.text }]}>4. Speedrun (Contra o Tempo)</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Cronômetro regressivo acelerado: acertos concedem +3 segundos, erros penalizam com -5 segundos!
                </Text>
              </View>

              <View style={[styles.modeCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <Text style={[styles.modeCardTitle, { color: colors.text }]}>5. Mundo Aberto RPG</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Mapa livre navegável com aldeias medievais, NPCs interativos, baús secretos e lojas de poções.
                </Text>
              </View>

              {/* 6. Heróis e Skins */}
              <Text style={[styles.subheading, { color: colors.text, marginTop: 6 }]}>🥋 Heróis & Skins</Text>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                • **Kaito (Samurai):** Alta agilidade e 25% de taxa de acerto crítico.{'\n'}
                • **Boran (Guerreiro):** Tanque impenetrável com 140 HP e defesa pesada.{'\n'}
                • **Valerius (Mago):** Dano arcano elemental e começa com 20% da barra de Ultimate.{'\n'}
                • **Personalização:** Troque de herói e equipe skins lendárias no menu Perfil!
              </Text>
            </ScrollView>
          )}

          {/* ======================= CONTEÚDO TAB: ORÁCULO IA (CHAT INTELIGENTE) ======================= */}
          {activeTab === 'ai' && (
            <View style={styles.aiTabContainer}>
              {/* Banner de Guardrail Estrito */}
              <View style={[styles.aiGuardrailBanner, { backgroundColor: isDark ? '#2E1065' : '#F5F3FF', borderColor: '#8B5CF6' }]}>
                <Shield size={16} color="#8B5CF6" />
                <Text style={[styles.aiGuardrailText, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>
                  O Oráculo responde <Text style={{ fontWeight: '900' }}>exclusivamente sobre o EstudeMy Game</Text>. Dúvidas fora do jogo são estritamente recusadas.
                </Text>
                <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn} activeOpacity={0.7}>
                  <RotateCcw size={14} color="#8B5CF6" />
                </TouchableOpacity>
              </View>

              {/* Chips de Perguntas Rápidas */}
              <View style={styles.quickChipsWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickChipsContent}
                >
                  {quickQuestions.map((q, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.quickChip,
                        {
                          backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                          borderColor: isDark ? '#374151' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => handleSendMessage(q.query)}
                      disabled={isAiLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.quickChipText, { color: colors.text }]}>{q.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Chat Messages */}
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatMessagesScroll}
                contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatBubbleRow,
                        isUser ? styles.chatBubbleRowUser : styles.chatBubbleRowOracle,
                      ]}
                    >
                      {!isUser && (
                        <View style={[styles.chatAvatar, { backgroundColor: '#8B5CF6' }]}>
                          <Bot size={16} color="#ffffff" />
                        </View>
                      )}

                      <View
                        style={[
                          styles.chatBubble,
                          isUser
                            ? [styles.chatBubbleUser, { backgroundColor: '#4F46E5' }]
                            : [
                                styles.chatBubbleOracle,
                                {
                                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                  borderColor: isDark ? '#374151' : '#E2E8F0',
                                },
                              ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.chatMessageText,
                            { color: isUser ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </View>

                      {isUser && (
                        <View style={[styles.chatAvatar, { backgroundColor: '#4F46E5' }]}>
                          <User size={16} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Loading indicator */}
                {isAiLoading && (
                  <View style={[styles.chatBubbleRow, styles.chatBubbleRowOracle]}>
                    <View style={[styles.chatAvatar, { backgroundColor: '#8B5CF6' }]}>
                      <Bot size={16} color="#ffffff" />
                    </View>
                    <View
                      style={[
                        styles.chatBubble,
                        styles.chatBubbleOracle,
                        {
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E2E8F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        },
                      ]}
                    >
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text style={[styles.chatMessageText, { color: colors.textMuted, fontStyle: 'italic' }]}>
                        Mestre do Jogo consultando os pergaminhos...
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Chat Input Bar */}
              <View
                style={[
                  styles.chatInputBar,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderTopColor: isDark ? '#1F2937' : '#E2E8F0',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.chatTextInput,
                    {
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      color: colors.text,
                      borderColor: isDark ? '#374151' : '#CBD5E1',
                    },
                  ]}
                  placeholder="Pergunte sobre chefões, Parry, heróis..."
                  placeholderTextColor={colors.textMuted}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                  editable={!isAiLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: inputMessage.trim() && !isAiLoading ? '#8B5CF6' : '#9CA3AF',
                    },
                  ]}
                  onPress={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isAiLoading}
                  activeOpacity={0.8}
                >
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ======================= CONTEÚDO TAB: DICAS ======================= */}
          {activeTab === 'tips' && (
            <ScrollView
              style={styles.tabBodyScroll}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                {t('trail.guideTipsIntro') || 'Torne-se um estudante lendário com estas estratégias de jogo:'}
              </Text>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EAB308' }]}>
                  <Trophy size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideTipsRankingTitle') || 'Lidere o Ranking da Liga'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    {t('trail.guideTipsRankingDesc') || 'Acumule XP em todos os modos e suba de divisão a cada domingo!'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#10B981' }]}>
                  <Heart size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideTipsReviewTitle') || 'Revisão Segura'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    {t('trail.guideTipsReviewDesc') || 'Jogar fases já concluídas não consome vidas e ajuda a fixar o conteúdo antes de provas reais!'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#3B82F6' }]}>
                  <BookOpen size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('trail.guideTipsReadTitle') || 'Teoria Primeiro'}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    {t('trail.guideTipsReadDesc') || 'Sempre leia as fases de Conteúdo antes dos desafios de Quiz para acertar de primeira!'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F59E0B' }]}>
                  <Coins size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Sequência de Acertos (Combos)</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                    Acertos consecutivos ativam multiplicadores de moedas e carregam a barra de Ultimate mais rápido!
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Close Button */}
          {activeTab !== 'ai' && (
            <View style={[styles.modalFooter, { borderTopColor: isDark ? '#262626' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={styles.closeActionBtn}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <Text style={styles.closeActionBtnText}>
                  {t('trail.guideClose') || 'Entendi, vamos jogar!'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// Pequeno componente de auxílio para o sol se Sun não existir
function SunIconComponent({ size = 20, color = '#EAB308' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Star size={size} color={color} fill={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
    borderRadius: 8,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {},
  tabBtnAi: {
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    fontWeight: '900',
  },
  aiBadgePill: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  aiBadgePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  tabBodyScroll: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginVertical: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  featureCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  bossGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Estilos da Sub-Aba com IA
  aiTabContainer: {
    flex: 1,
  },
  aiGuardrailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  aiGuardrailText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  clearBtn: {
    padding: 4,
  },
  quickChipsWrapper: {
    paddingVertical: 8,
  },
  quickChipsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatBubbleRowUser: {
    justifyContent: 'flex-end',
  },
  chatBubbleRowOracle: {
    justifyContent: 'flex-start',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  chatBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleUser: {
    borderBottomRightRadius: 4,
  },
  chatBubbleOracle: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  chatMessageText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  closeActionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
