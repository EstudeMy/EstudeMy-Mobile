import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTrackImage } from '../constants/assets';
import api from '../services/api';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react-native';

export default function MeusCursosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'progress' | 'completed'>('progress');

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/trilhas/continue');
      const startedTrails = response.data || [];
      
      const inProgressList: any[] = [];
      const completedList: any[] = [];

      await Promise.all(
        startedTrails.map(async (trilha: any) => {
          try {
            const [fasesRes, progressoRes] = await Promise.all([
              api.get(`/api/fases/trilha/${trilha._id}`),
              api.get(`/api/progresso/trilha/${trilha._id}`),
            ]);

            const fases = fasesRes.data || [];
            const progMap = progressoRes.data?.progresso || {};
            const completedCount = Object.keys(progMap).filter((fId) => progMap[fId] === true).length;
            const totalCount = fases.length;

            const trailWithProgress = {
              ...trilha,
              completedCount,
              totalCount,
              percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
            };

            if (totalCount > 0 && completedCount === totalCount) {
              completedList.push(trailWithProgress);
            } else {
              inProgressList.push(trailWithProgress);
            }
          } catch (e) {
            console.error(`Erro ao carregar progresso da trilha ${trilha._id}:`, e);
            inProgressList.push({ ...trilha, completedCount: 0, totalCount: 0, percent: 0 });
          }
        })
      );

      setInProgress(inProgressList);
      setCompleted(completedList);
    } catch (e) {
      console.error('Erro ao carregar meus cursos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyCourses();
  }, []);

  const renderTrackCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={[styles.trackCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/trilha/${item._id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={getTrackImage(item)}
          style={styles.trackImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.trackSubject}>{item.materia?.toUpperCase()}</Text>
          <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          
          {/* Barra de Progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressPercent, { color: colors.text }]}>{item.percent}%</Text>
              <Text style={[styles.progressSteps, { color: colors.textMuted }]}>
                {item.completedCount}/{item.totalCount} {t('trail.completedSteps') || 'fases'}
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.cardSecondary }]}>
              <View style={[styles.progressBarFill, { width: `${item.percent}%` }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 48),
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('myCourses.title') || 'Meus Cursos'} 📚</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: isDark ? '#1b1b1b' : '#E5E7EB' }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'progress' && { borderBottomColor: '#4F46E5', borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('progress')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: colors.text },
              activeTab === 'progress' && { color: '#4F46E5', fontWeight: '900' },
            ]}
          >
            {t('myCourses.inProgress') || 'Em Andamento'} ({inProgress.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'completed' && { borderBottomColor: '#10B981', borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: colors.text },
              activeTab === 'completed' && { color: '#10B981', fontWeight: '900' },
            ]}
          >
            {t('myCourses.completed') || 'Concluídos'} ({completed.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'progress' ? inProgress : completed}
          renderItem={renderTrackCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom + 16, 16) },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {activeTab === 'progress' ? (
                <BookOpen size={48} color={colors.textMuted} />
              ) : (
                <CheckCircle size={48} color={colors.textMuted} />
              )}
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === 'progress'
                  ? t('myCourses.empty') || 'Você não tem cursos em andamento.'
                  : t('myCourses.emptyCompleted') || 'Você ainda não concluiu nenhum curso.'}
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/home')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>
                  {t('myCourses.explore') || 'Explorar Trilhas'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    marginBottom: 16,
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
  listContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  trackCard: {
    flexDirection: 'row',
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
  trackImage: {
    width: 110,
    height: '100%',
    borderRightWidth: 3,
    borderRightColor: '#1b1b1b',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  trackSubject: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  progressContainer: {
    gap: 6,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressSteps: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: 250,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#4F46E5',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
