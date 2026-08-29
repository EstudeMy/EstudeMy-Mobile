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
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTrackImage } from '../constants/assets';
import { buscarTrilhaPorId, Trilha } from '../services/trilhaService';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react-native';

export default function LicoesSalvasScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [savedTrails, setSavedTrails] = useState<Trilha[]>([]);

  const SAVED_TRAILS_KEY = 'saved_trails_list';

  const fetchSavedLessons = async () => {
    setLoading(true);
    try {
      const listJson = await SecureStore.getItemAsync(SAVED_TRAILS_KEY);
      const list = listJson ? (JSON.parse(listJson) as string[]) : [];

      if (list.length === 0) {
        setSavedTrails([]);
        setLoading(false);
        return;
      }

      // Buscar os detalhes de todas as trilhas salvas em paralelo
      const trailsData = await Promise.all(
        list.map(async (trailId) => {
          try {
            return await buscarTrilhaPorId(trailId);
          } catch (e) {
            console.error(`Erro ao carregar trilha salva ${trailId}:`, e);
            return null;
          }
        })
      );

      // Filtrar itens nulos (caso alguma trilha tenha sido deletada no banco)
      setSavedTrails(trailsData.filter((t) => t !== null) as Trilha[]);
    } catch (e) {
      console.error('Erro ao buscar lições salvas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (trailId: string) => {
    try {
      const listJson = await SecureStore.getItemAsync(SAVED_TRAILS_KEY);
      if (listJson) {
        let list = JSON.parse(listJson) as string[];
        list = list.filter((id) => id !== trailId);
        await SecureStore.setItemAsync(SAVED_TRAILS_KEY, JSON.stringify(list));
        setSavedTrails((prev) => prev.filter((t) => t._id !== trailId));
      }
    } catch (e) {
      console.error('Erro ao remover trilha salva:', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSavedLessons();
  }, []);

  const renderTrackCard = ({ item }: { item: Trilha }) => {
    return (
      <View style={[styles.trackCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.cardPressable}
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
            <Text style={[styles.trackDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.descricao || t('trail.noDescription') || 'Sem descrição'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Botão de Excluir / Unsave */}
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsave(item._id)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('savedLessons.title') || 'Lições Salvas'} 🔖</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={savedTrails}
          renderItem={renderTrackCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bookmark size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('savedLessons.empty') || 'Você ainda não salvou nenhuma trilha.'}
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
    paddingTop: 52,
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
    position: 'relative',
  },
  cardPressable: {
    flexDirection: 'row',
    flex: 1,
    paddingRight: 40, // Espaço para não cobrir o botão de lixeira
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
    marginBottom: 6,
  },
  trackDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  unsaveButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
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
