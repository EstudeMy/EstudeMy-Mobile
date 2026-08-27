import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { buscarTrilhaPorId, iniciarTrilha, Trilha } from '../../services/trilhaService';
import { buscarSecoesPorTrilha, Secao } from '../../services/secaoService';
import { buscarFasesPorTrilha, Fase } from '../../services/faseService';
import api from '../../services/api';
import { Lock, CheckCircle, Play, ArrowLeft } from 'lucide-react-native';

export default function TrilhaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark, colors } = useTheme();


  const [loading, setLoading] = useState(true);
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  
  // Progresso do usuário nesta trilha
  const [iniciada, setIniciada] = useState(false);
  const [fasesConcluidas, setFasesConcluidas] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchTrilhaDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [trilhaData, secoesData, fasesData] = await Promise.all([
        buscarTrilhaPorId(id),
        buscarSecoesPorTrilha(id),
        buscarFasesPorTrilha(id),
      ]);
      setTrilha(trilhaData);
      setSecoes(secoesData.sort((a, b) => a.ordem - b.ordem));
      setFases(fasesData.sort((a, b) => a.ordem - b.ordem));

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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrilhaDetails();
  }, [id]);

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
      {/* Botão Voltar */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Header da Trilha */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <Text style={styles.trackSubject}>{trilha.materia.toUpperCase()}</Text>
        <Text style={[styles.trackTitle, { color: colors.text }]}>{trilha.titulo}</Text>
        {trilha.descricao && <Text style={[styles.trackDesc, { color: colors.textMuted }]}>{trilha.descricao}</Text>}

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
        secoes.map((secao) => {
          // Filtrar fases pertencentes a esta seção
          const fasesDaSecao = fases.filter((f) => f.secaoId === secao._id);

          return (
            <View key={secao._id} style={styles.secaoBlock}>
              {/* Header da Seção */}
              <View style={styles.secaoHeader}>
                <Text style={[styles.secaoTitle, { color: colors.text }]}>{secao.titulo}</Text>
                {secao.descricao && <Text style={[styles.secaoDesc, { color: colors.textMuted }]}>{secao.descricao}</Text>}
              </View>

              {/* Fases */}
              <View style={styles.fasesContainer}>
                {fasesDaSecao.length === 0 ? (
                  <Text style={[styles.emptyFases, { color: colors.textMuted }]}>Nenhuma fase nesta seção.</Text>
                ) : (
                  fasesDaSecao.map((fase, fIdx) => {
                    const isCompleted = fasesConcluidas.includes(fase._id);
                    
                    // Lógica para desbloquear a fase
                    let isUnlocked = false;
                    if (!iniciada) {
                      isUnlocked = false;
                    } else if (fIdx === 0 && fases.indexOf(fase) === 0) {
                      isUnlocked = true;
                    } else {
                      const absoluteIndex = fases.indexOf(fase);
                      const prevFase = fases[absoluteIndex - 1];
                      isUnlocked = prevFase && fasesConcluidas.includes(prevFase._id);
                    }

                    if (isCompleted) {
                      isUnlocked = true;
                    }

                    return (
                      <TouchableOpacity
                        key={fase._id}
                        style={[
                          styles.faseCard,
                          { backgroundColor: colors.card },
                          !isUnlocked && styles.faseLockedCard,
                          isCompleted && styles.faseCompletedCard,
                        ]}
                        disabled={!isUnlocked}
                        onPress={() => router.push(`/game/${fase._id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.faseRow}>
                          <View style={styles.faseLeft}>
                            <View
                              style={[
                                styles.faseBadge,
                                isCompleted
                                  ? styles.faseBadgeCompleted
                                  : isUnlocked
                                  ? styles.faseBadgeUnlocked
                                  : styles.faseBadgeLocked,
                              ]}
                            >
                              <Text style={styles.faseBadgeText}>{fase.ordem}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.faseTitle, { color: colors.text }, !isUnlocked && styles.textLocked]}>
                                {fase.titulo}
                              </Text>
                              {fase.descricao && (
                                <Text style={[styles.faseDesc, { color: colors.textMuted }]} numberOfLines={2}>
                                  {fase.descricao}
                                </Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.faseRight}>
                            {isCompleted ? (
                              <CheckCircle size={24} color="#10B981" />
                            ) : isUnlocked ? (
                              <Play size={22} color="#4F46E5" fill="#4F46E5" />
                            ) : (
                              <Lock size={22} color="#9CA3AF" />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          );
        })
      )}

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
  backBtn: {
    backgroundColor: '#1b1b1b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerCard: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: 26,
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
    marginBottom: 24,
  },
  secaoHeader: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5', // indigo-600
    paddingLeft: 10,
  },
  secaoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  secaoDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  fasesContainer: {
    gap: 12,
    marginTop: 10,
  },
  faseCard: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  faseLockedCard: {
    opacity: 0.5,
  },
  faseCompletedCard: {
    borderColor: '#10B981', // green border for completed phase
  },
  faseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  faseBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  faseBadgeUnlocked: {
    backgroundColor: '#4F46E5',
  },
  faseBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  faseBadgeLocked: {
    backgroundColor: '#374151',
  },
  faseBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  faseTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  textLocked: {
    color: '#9CA3AF',
  },
  faseDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  faseRight: {
    marginLeft: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  emptyFases: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
