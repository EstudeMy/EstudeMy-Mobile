import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { obterContinue, obterNovidades, obterPopulares, buscarTrilhas, Trilha } from '../../services/trilhaService';
import { Search, Brain, Zap, Sparkles } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { isDark, colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [continueTrilhas, setContinueTrilhas] = useState<Trilha[]>([]);
  const [populares, setPopulares] = useState<Trilha[]>([]);
  const [novidades, setNovidades] = useState<Trilha[]>([]);
  const [searchResults, setSearchResults] = useState<Trilha[] | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [continueData, popularesData, novidadesData] = await Promise.all([
        obterContinue(),
        obterPopulares(),
        obterNovidades(),
      ]);
      setContinueTrilhas(continueData);
      setPopulares(popularesData);
      setNovidades(novidadesData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData();
    }
  }, [token]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await buscarTrilhas(text);
      setSearchResults(results);
    } catch (e) {
      console.error('Erro ao pesquisar trilhas:', e);
    }
  };

  // Cálculo de nível (ex: cada 100 XP sobe um nível)
  const xp = user?.xpTotal || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  const renderTrackCard = ({ item }: { item: Trilha }) => (
    <TouchableOpacity
      style={[styles.trackCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/trilha/${item._id}`)}
      activeOpacity={0.8}
    >
      <Text style={[styles.trackSubject, { color: colors.textMuted }]}>{item.materia.toUpperCase()}</Text>
      <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={2}>{item.titulo}</Text>
      {item.nivelDificuldade && (
        <View style={[styles.badge, { backgroundColor: colors.cardSecondary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{item.nivelDificuldade}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header do Usuário */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <View style={styles.userRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Olá, {user?.nome || 'Estudante'}!</Text>
            <Text style={[styles.avatarLabel, { color: colors.textMuted }]}>Classe: {user?.personagem || 'Samurai'}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lvl {level}</Text>
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

      {/* Caixa de Pesquisa */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Pesquisar trilhas ou matérias..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>


      {/* Botão Prominente ConsultAi IA */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push('/consultai')}
        activeOpacity={0.9}
      >
        <Brain size={24} color="#ffffff" style={styles.aiIcon} />
        <View style={styles.aiTextContainer}>
          <Text style={styles.aiButtonTitle}>Consult.Ai</Text>
          <Text style={styles.aiButtonSub}>Gerar trilhas de estudo personalizadas com IA</Text>
        </View>
        <Sparkles size={20} color="#FBBF24" />
      </TouchableOpacity>

      {/* Resultados da Pesquisa */}
      {searchResults !== null ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resultados da Pesquisa</Text>
          {searchResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma trilha encontrada.</Text>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderTrackCard}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridWrapper}
            />
          )}
        </View>
      ) : (
        <>
          {/* Trilhas em Andamento */}
          {continueTrilhas.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Continuar Estudando</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={continueTrilhas}
                renderItem={renderTrackCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.carouselContainer}
              />
            </View>
          )}

          {/* Trilhas Populares */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mais Populares 🔥</Text>
            {populares.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma trilha disponível.</Text>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={populares}
                renderItem={renderTrackCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.carouselContainer}
              />
            )}
          </View>

          {/* Novidades */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Novidades 🌟</Text>
            {novidades.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma trilha nova por enquanto.</Text>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={novidades}
                renderItem={renderTrackCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.carouselContainer}
              />
            )}
          </View>
        </>
      )}

      {/* Margem inferior extra */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
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
    paddingRight: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  inputDark: {
    backgroundColor: '#2D2D44',
    color: '#ffffff',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    color: '#1b1b1b',
  },
  aiButton: {
    backgroundColor: '#6366F1', // indigo-500
    borderWidth: 3,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 14,
  },
  carouselContainer: {
    gap: 14,
    paddingRight: 16,
  },
  trackCard: {
    width: 160,
    height: 150,
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  trackSubject: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E2F',
    borderWidth: 1,
    borderColor: '#1b1b1b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  gridWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
