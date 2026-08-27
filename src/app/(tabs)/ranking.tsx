import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { Trophy, Award, Medal } from 'lucide-react-native';

interface LeaderboardUser {
  _id: string;
  nome?: string;
  name?: string;
  username?: string;
  personagem?: string;
  xpTotal?: number;
  acertosPercentual?: number;
  mediaAcertos?: number;
}

export default function RankingScreen() {
  const { isDark, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'XP' | 'ACERTOS'>('XP');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<LeaderboardUser[]>([]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'XP' ? '/api/ranking/nivel' : '/api/ranking';
      const response = await api.get(endpoint);
      setUsersList(response.data || []);
    } catch (e) {
      console.error('Erro ao buscar rankings:', e);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRankings();
  }, [activeTab]);

  const renderPodiumIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy size={28} color="#F59E0B" fill="#F59E0B" />; // Ouro
      case 1:
        return <Award size={26} color="#9CA3AF" fill="#9CA3AF" />; // Prata
      case 2:
        return <Medal size={24} color="#B45309" fill="#B45309" />; // Bronze
      default:
        return null;
    }
  };

  const renderUserRow = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const isTop3 = index < 3;
    const position = index + 1;
    const displayName = item.nome || item.name || item.username || 'Estudante';
    const displayUsername = item.username || item.name || 'estudante';
    const percentual = item.mediaAcertos !== undefined ? item.mediaAcertos : (item.acertosPercentual !== undefined ? item.acertosPercentual : 0);

    return (
      <View
        style={[
          styles.rowCard,
          { backgroundColor: colors.card },
          isTop3 && styles.top3Card,
          index === 0 && styles.firstPlaceCard,
        ]}
      >
        <View style={styles.leftSection}>
          <View style={styles.positionWrapper}>
            {isTop3 ? renderPodiumIcon(index) : <Text style={[styles.positionText, { color: colors.text }]}>{position}</Text>}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.userUsername, { color: colors.textMuted }]}>@{displayUsername}</Text>
            <Text style={styles.charTag}>{item.personagem || 'Samurai'}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {activeTab === 'XP' ? (
            <Text style={[styles.scoreText, { color: colors.text }]}>{item.xpTotal || 0} XP</Text>
          ) : (
            <Text style={[styles.scoreText, { color: colors.text }]}>
              {Math.round(percentual)}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Título */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Hall da Fama 🏆</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Os melhores heróis da semana</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.cardSecondary }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'XP' && styles.tabButtonActive]}
          onPress={() => setActiveTab('XP')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'XP' && styles.tabButtonTextActive]}>
            Nível / XP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ACERTOS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ACERTOS')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'ACERTOS' && styles.tabButtonTextActive]}>
            Média de Acertos
          </Text>
        </TouchableOpacity>
      </View>


      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : usersList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum herói no ranking ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={usersList}
          renderItem={renderUserRow}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2F',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#4F46E5', // indigo-600
  },
  tabButtonText: {
    color: '#9CA3AF',
    fontWeight: '800',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  top3Card: {
    borderWidth: 3.5,
  },
  firstPlaceCard: {
    borderColor: '#F59E0B', // Destaque de ouro
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionWrapper: {
    width: 38,
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  userUsername: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  charTag: {
    color: '#34D399', // emerald-400
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});
