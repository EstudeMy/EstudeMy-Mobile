import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  obterContinue,
  obterNovidades,
  obterPopulares,
  buscarTrilhas,
  getMappedIdioma,
  Trilha,
} from '../../services/trilhaService';
import { getCharacterImage, getTrackImage, EXTRA_IMAGES } from '../../constants/assets';
import { Search, Zap, Sparkles, BookOpen, PlusCircle } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { isDark, colors } = useTheme();
  const { language, t } = useLanguage();

  const canCreateTrack =
    user?.tipoUsuario === 'PROFESSOR' ||
    user?.tipoUsuario === 'ADMINISTRADOR' ||
    user?.tipoUsuario === 'OWNER';

  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [continueTrilhas, setContinueTrilhas] = useState<Trilha[]>([]);
  const [populares, setPopulares] = useState<Trilha[]>([]);
  const [novidades, setNovidades] = useState<Trilha[]>([]);
  const [searchResults, setSearchResults] = useState<Trilha[] | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const mappedIdioma = getMappedIdioma(language);
      const [continueData, popularesData, novidadesData] = await Promise.all([
        obterContinue(mappedIdioma),
        obterPopulares(mappedIdioma),
        obterNovidades(mappedIdioma),
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




  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await buscarTrilhas(text);
      const mappedIdioma = getMappedIdioma(language);
      const filteredResults = results.filter((t) => {
        const trilhaIdioma = t.idioma || 'Português';
        return trilhaIdioma === mappedIdioma;
      });
      setSearchResults(filteredResults);
    } catch (e) {
      console.error('Erro ao pesquisar trilhas:', e);
    }
  };

  // Cálculo de nível (ex: cada 100 XP sobe um nível)
  const xp = user?.xpTotal || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  const renderTrackCard = ({ item }: { item: Trilha }) => {
    const trackImage = getTrackImage(item);
    const diff = item.dificuldade || item.nivelDificuldade || 'Fácil';

    return (
      <TouchableOpacity
        style={[styles.trackCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/trilha/${item._id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={trackImage}
          style={styles.trackCoverImage}
          resizeMode="cover"
        />
        <View style={styles.trackCardContent}>
          <Text style={[styles.trackCardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {item.descricao ? (
            <Text style={[styles.trackCardDesc, { color: colors.textSecondary }]} numberOfLines={3}>
              {item.descricao}
            </Text>
          ) : null}
          <Text style={[styles.trackCardMeta, { color: colors.textMuted }]}>
            Matéria: <Text style={{ fontWeight: '800', color: colors.text }}>{item.materia}</Text> | Dificuldade: <Text style={{ fontWeight: '800', color: colors.text }}>{diff}</Text>
          </Text>
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
              <Text style={[styles.avatarLabel, { color: colors.textMuted }]}>{t('common.class') || 'Classe'}: {user?.personagem ? (t(`characterPage.classes.${user.personagem.toLowerCase()}`) || user.personagem) : (t('characterPage.classes.samurai') || 'Samurai')}</Text>
            </View>
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
          placeholder={t('home.searchPlaceholder') || 'Pesquisar trilhas ou matérias...'}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
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
              <Text style={styles.aiButtonTitle}>{t('home.aiTitle') || 'Consult.Ai 🤖'}</Text>
              <Text style={styles.aiButtonSub}>{t('home.aiDesc') || 'Gerador de trilhas e desafios com Inteligência Artificial'}</Text>
            </View>
            <Sparkles size={22} color="#FBBF24" />
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
              <Text style={styles.aiButtonTitle}>{t('home.manualTitle') || 'Criar Trilha Manual ✍️'}</Text>
              <Text style={styles.aiButtonSub}>{t('home.manualDesc') || 'Monte sua trilha com seus próprios temas e matérias'}</Text>
            </View>
            <PlusCircle size={22} color="#86EFAC" />
          </TouchableOpacity>
        </View>
      )}

      {/* Resultados da Pesquisa */}
      {searchResults !== null ? (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
            <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('common.searchResults') || 'Resultados da Pesquisa'}</Text>
          </View>
          {searchResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('search.noResults') || 'Nenhuma trilha encontrada.'}</Text>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderTrackCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 16 }}
            />
          )}
        </View>
      ) : (
        <>
          {/* Trilhas em Andamento */}
          {continueTrilhas.length > 0 && (
            <View style={styles.section}>
              <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
                <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.continueLearning') || 'Continuar Estudando 📖'}</Text>
              </View>
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
            <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
              <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.popularTrails') || 'Melhores para você 🔥'}</Text>
            </View>
            {populares.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noPopularTrails') || 'Nenhuma trilha disponível.'}</Text>
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
            <View style={[styles.sectionHeaderPill, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
              <Text style={[styles.sectionHeaderPillText, { color: colors.text }]}>{t('home.newTrails') || 'Novidades 🌟'}</Text>
            </View>
            {novidades.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noNewTrails') || 'Nenhuma trilha nova por enquanto.'}</Text>
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
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
