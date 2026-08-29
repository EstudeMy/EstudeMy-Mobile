import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTrackImage, getCharacterImage } from '../../constants/assets';
import { buscarTrilhaPorId, iniciarTrilha, Trilha } from '../../services/trilhaService';

import { buscarSecoesPorTrilha, Secao } from '../../services/secaoService';
import { buscarFasesPorTrilha, Fase } from '../../services/faseService';
import api from '../../services/api';
import { Lock, Star, Check, ArrowLeft, Bookmark, HelpCircle, X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function TrilhaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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

  const [isSaved, setIsSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'trail' | 'game' | 'tips'>('trail');

  const SAVED_TRAILS_KEY = 'saved_trails_list';

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
    setLoading(true);
    try {
      const [trilhaData, secoesData, fasesData] = await Promise.all([
        buscarTrilhaPorId(id),
        buscarSecoesPorTrilha(id),
        buscarFasesPorTrilha(id),
      ]);
      setTrilha(trilhaData);
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

      // Buscar progresso
      try {
        const progressoRes = await api.get(`/api/progresso/trilha/${id}`);
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
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrilhaDetails();
  }, [fetchTrilhaDetails]);

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={styles.trackSubject}>{trilha.materia.toUpperCase()}</Text>
          <Text style={[styles.trackTitle, { color: colors.text }]}>{trilha.titulo}</Text>
          {trilha.descricao && <Text style={[styles.trackDesc, { color: colors.textMuted }]}>{trilha.descricao}</Text>}
        </View>

        {/* Botão de Ação / Iniciar */}
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
        )}
      </View>

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
                    
                    // Lógica para desbloquear a fase
                    let isUnlocked = false;
                    if (!iniciada) {
                      isUnlocked = false;
                    } else if (fases.indexOf(fase) === 0) {
                      isUnlocked = true;
                    } else {
                      const absoluteIndex = fases.indexOf(fase);
                      const prevFase = fases[absoluteIndex - 1];
                      isUnlocked = prevFase && fasesConcluidas.includes(prevFase._id);
                    }

                    if (isCompleted) {
                      isUnlocked = true;
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
                                : isUnlocked
                                ? '#4F46E5' // Azul ativo/desbloqueado
                                : '#374151', // Cinza bloqueado
                              borderColor: isCompleted
                                ? '#059669'
                                : isUnlocked
                                ? '#3730A3'
                                : '#1F2937',
                            },
                          ]}
                          disabled={!isUnlocked}
                          onPress={() => router.push(`/game/${fase._id}`)}
                          activeOpacity={0.8}
                        >
                          {isCompleted ? (
                            <Check size={30} color="#ffffff" strokeWidth={3} />
                          ) : isUnlocked ? (
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
                            !isUnlocked && { color: colors.textMuted },
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

      {/* Modal do Guia de Estudos estilo Duolingo */}
      <Modal
        visible={showGuide}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderTopColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
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

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 52,
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
});
