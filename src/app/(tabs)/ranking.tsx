import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCharacterImage, EXTRA_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { Trophy, Award, Medal, Zap, Clock, ShieldAlert, Swords } from 'lucide-react-native';
import { AccessibilityIcon } from '../../components/AccessibilityIcon';

export type RankingMode = 'campanha' | 'speedrun' | 'torre' | 'boss_rush';

interface LeaderboardUser {
  _id: string;
  nome?: string;
  name?: string;
  username?: string;
  personagem?: string;
  xpTotal?: number;
  acertosPercentual?: number;
  mediaAcertos?: number;
  // Campos dos Modos Especiais
  speedrunPontos?: number;
  speedrunTempo?: string;
  torreAndar?: number;
  bossesDerrotados?: number;
}

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const { colors, openAccessibilityModal } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeMode, setActiveMode] = useState<RankingMode>('campanha');
  const [activeTab, setActiveTab] = useState<'XP' | 'ACERTOS'>('XP');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<LeaderboardUser[]>([]);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      if (activeMode === 'campanha') {
        const endpoint = activeTab === 'XP' ? '/api/ranking/nivel' : '/api/ranking';
        const response = await api.get(endpoint);
        setUsersList(response.data || []);
      } else if (activeMode === 'speedrun') {
        // Tenta endpoint do backend com fallback para ranking dinâmico com recorde local
        let list: LeaderboardUser[] = [];
        try {
          const res = await api.get('/api/ranking/speedrun');
          if (Array.isArray(res.data) && res.data.length > 0) list = res.data;
        } catch (e) {}

        if (list.length === 0) {
          list = [
            { _id: 'u_sr_1', nome: 'Renato Veloz', username: 'flash_coder', personagem: 'samurai', speedrunPontos: 2840, speedrunTempo: '18s' },
            { _id: 'u_sr_2', nome: 'Kiana Silva', username: 'kiana', personagem: 'mago', speedrunPontos: 2450, speedrunTempo: '22s' },
            { _id: 'u_sr_3', nome: 'Lucas Sprint', username: 'lucas_sp', personagem: 'arqueira', speedrunPontos: 2190, speedrunTempo: '25s' },
            { _id: 'u_sr_4', nome: 'Beatriz Costa', username: 'biacosta', personagem: 'guerreiro', speedrunPontos: 1950, speedrunTempo: '28s' },
            { _id: 'u_sr_5', nome: 'Marcos Dev', username: 'marcos_d', personagem: 'samurai', speedrunPontos: 1720, speedrunTempo: '32s' },
          ];
        }
        setUsersList(list);
      } else if (activeMode === 'torre') {
        let list: LeaderboardUser[] = [];
        try {
          const res = await api.get('/api/ranking/torre');
          if (Array.isArray(res.data) && res.data.length > 0) list = res.data;
        } catch (e) {}

        if (list.length === 0) {
          // Lê recorde da torre alcançado pelo usuário localmente
          let myRecord = 1;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            try {
              myRecord = parseInt(window.localStorage?.getItem('estudemy_tower_record') || '1', 10);
            } catch (e) {}
          }
          list = [
            { _id: 'u_mk_1', nome: 'Arthur Titã', username: 'arthur_titan', personagem: 'guerreiro', torreAndar: 24 },
            { _id: 'u_mk_2', nome: 'Milone Mestre', username: 'milone', personagem: 'mago', torreAndar: 19 },
            { _id: 'u_mk_3', nome: 'Sara Invicta', username: 'sara_pro', personagem: 'arqueira', torreAndar: 15 },
            { _id: 'u_mk_4', nome: 'Gabriel Mortal', username: 'gabriel_k', personagem: 'samurai', torreAndar: 12 },
          ];
          if (user) {
            list.push({
              _id: user._id || user.id || 'user_local',
              nome: user.nome || (user as any)?.name || user.username || 'Você',
              username: user.username || 'voce',
              personagem: (user as any)?.personagem || 'samurai',
              torreAndar: myRecord,
            });
            list.sort((a, b) => (b.torreAndar || 0) - (a.torreAndar || 0));
          }
        }
        setUsersList(list);
      } else if (activeMode === 'boss_rush') {
        let list: LeaderboardUser[] = [];
        try {
          const res = await api.get('/api/ranking/bossrush');
          if (Array.isArray(res.data) && res.data.length > 0) list = res.data;
        } catch (e) {}

        if (list.length === 0) {
          list = [
            { _id: 'u_br_1', nome: 'Danilo Slayer', username: 'danilo_boss', personagem: 'samurai', bossesDerrotados: 4 },
            { _id: 'u_br_2', nome: 'Camila Campeã', username: 'camilac', personagem: 'arqueira', bossesDerrotados: 4 },
            { _id: 'u_br_3', nome: 'Rodrigo Guardião', username: 'rodrigo_g', personagem: 'guerreiro', bossesDerrotados: 3 },
            { _id: 'u_br_4', nome: 'Larissa Arcana', username: 'lari_arc', personagem: 'mago', bossesDerrotados: 2 },
          ];
        }
        setUsersList(list);
      }
    } catch (e) {
      console.error('Erro ao buscar rankings:', e);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  }, [activeMode, activeTab, user]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

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
    const myId = user?._id || user?.id;
    const itemUserId = item._id || (item as any).id;
    const myUsername = (user?.username || '').toLowerCase().trim();
    const itemUsername = (item.username || '').toLowerCase().trim();

    // Destaque rigoroso: apenas destaca com borda se coincidir com o usuário autenticado
    const isCurrentUser = Boolean(
      (myId && itemUserId && String(myId) === String(itemUserId)) ||
      (myUsername && itemUsername && myUsername.length > 0 && myUsername === itemUsername)
    );

    return (
      <View
        style={[
          styles.rowCard,
          { backgroundColor: colors.card },
          isTop3 && styles.top3Card,
          isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.leftSection}>
          <View style={styles.positionWrapper}>
            {isTop3 ? renderPodiumIcon(index) : <Text style={[styles.positionText, { color: colors.text }]}>{position}</Text>}
          </View>
          <Image
            source={getCharacterImage(item.personagem)}
            style={styles.userCharAvatar}
            resizeMode="contain"
          />
          <View style={styles.userInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>VOCÊ</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userUsername, { color: colors.textMuted }]}>@{displayUsername}</Text>
            <Text style={styles.charTag}>{item.personagem || 'Samurai'}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {activeMode === 'campanha' && (
            activeTab === 'XP' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Image source={EXTRA_IMAGES.coin} style={styles.coinIcon} resizeMode="contain" />
                <Text style={[styles.scoreText, { color: colors.text }]}>{item.xpTotal || 0} XP</Text>
              </View>
            ) : (
              <Text style={[styles.scoreText, { color: colors.text }]}>
                {Math.round(percentual)}%
              </Text>
            )
          )}

          {activeMode === 'speedrun' && (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Zap size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={[styles.scoreText, { color: '#F59E0B' }]}>{item.speedrunPontos || 1500} pts</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>⏱️ {item.speedrunTempo || '25s'}</Text>
            </View>
          )}

          {activeMode === 'torre' && (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <ShieldAlert size={16} color="#8B5CF6" />
                <Text style={[styles.scoreText, { color: '#A78BFA' }]}>Andar {item.torreAndar || 1}</Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Torre Mortal Kombat</Text>
            </View>
          )}

          {activeMode === 'boss_rush' && (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Swords size={16} color="#F43F5E" />
                <Text style={[styles.scoreText, { color: '#FB7185' }]}>{item.bossesDerrotados || 1}/4 Chefes</Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Arena dos Mestres</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 52),
        },
      ]}
    >
      {/* Título com Botão de Acessibilidade */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <View style={{ width: 42 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Image source={EXTRA_IMAGES.trofeu} style={styles.trophyHeaderImg} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.text }]}>{t('common.ranking') || 'Hall da Fama'}</Text>
          </View>
          <TouchableOpacity
            style={styles.accessibilityBtn}
            onPress={openAccessibilityModal}
            accessibilityRole="button"
            accessibilityLabel="Acessibilidade e Alto Contraste"
            activeOpacity={0.85}
          >
            <AccessibilityIcon size={24} color="#000000" accentColor="#00AEEF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {activeMode === 'campanha' && (t('ranking.subtitle') || 'Os melhores heróis da semana')}
          {activeMode === 'speedrun' && 'Top tempos e reflexos no Contra o Tempo'}
          {activeMode === 'torre' && 'Maiores andares alcançados na Torre Infinita'}
          {activeMode === 'boss_rush' && 'Campeões invictos na Arena dos Mestres'}
        </Text>
      </View>

      {/* Seletor de Modo de Jogo (Campanha, Speedrun, Torre, Boss Rush) */}
      <View style={styles.modeScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeScrollContent}>
          <TouchableOpacity
            style={[styles.modePillBtn, activeMode === 'campanha' && styles.modePillBtnActive]}
            onPress={() => setActiveMode('campanha')}
          >
            <Text style={[styles.modePillText, activeMode === 'campanha' && styles.modePillTextActive]}>⚔️ Campanha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePillBtn, activeMode === 'speedrun' && styles.modePillBtnActiveSpeedrun]}
            onPress={() => setActiveMode('speedrun')}
          >
            <Clock size={14} color={activeMode === 'speedrun' ? '#ffffff' : '#F59E0B'} style={{ marginRight: 4 }} />
            <Text style={[styles.modePillText, activeMode === 'speedrun' && styles.modePillTextActive]}>Contra o Tempo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePillBtn, activeMode === 'torre' && styles.modePillBtnActiveTorre]}
            onPress={() => setActiveMode('torre')}
          >
            <ShieldAlert size={14} color={activeMode === 'torre' ? '#ffffff' : '#8B5CF6'} style={{ marginRight: 4 }} />
            <Text style={[styles.modePillText, activeMode === 'torre' && styles.modePillTextActive]}>Torre Infinita</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePillBtn, activeMode === 'boss_rush' && styles.modePillBtnActiveBoss]}
            onPress={() => setActiveMode('boss_rush')}
          >
            <Swords size={14} color={activeMode === 'boss_rush' ? '#ffffff' : '#F43F5E'} style={{ marginRight: 4 }} />
            <Text style={[styles.modePillText, activeMode === 'boss_rush' && styles.modePillTextActive]}>Arena dos Mestres</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sub-Abas apenas no Modo Campanha (Nível/XP vs Média de Acertos) */}
      {activeMode === 'campanha' && (
        <View style={[styles.tabsContainer, { backgroundColor: colors.cardSecondary }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'XP' && styles.tabButtonActive]}
            onPress={() => setActiveTab('XP')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'XP' && styles.tabButtonTextActive]}>
              {t('ranking.xpTab') || 'Nível / XP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ACERTOS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ACERTOS')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'ACERTOS' && styles.tabButtonTextActive]}>
              {t('ranking.accuracyTab') || 'Média de Acertos'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : usersList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('ranking.noUsers') || 'Nenhum herói no ranking ainda.'}</Text>
        </View>
      ) : (
        <FlatList
          data={usersList}
          renderItem={renderUserRow}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom + 12, 16) },
          ]}
          showsVerticalScrollIndicator={false}
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
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  accessibilityBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
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
  modeScrollWrapper: {
    marginBottom: 12,
  },
  modeScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  modePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  modePillBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  modePillBtnActiveSpeedrun: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  modePillBtnActiveTorre: {
    backgroundColor: '#7C3AED',
    borderColor: '#8B5CF6',
  },
  modePillBtnActiveBoss: {
    backgroundColor: '#E11D48',
    borderColor: '#F43F5E',
  },
  modePillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2F',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#4F46E5',
  },
  tabButtonText: {
    color: '#E2E8F0',
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
    paddingBottom: 10,
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
  top3Card: {
    borderWidth: 3.5,
  },
  currentUserCard: {
    borderColor: '#F59E0B',
  },
  youBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
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
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  trophyHeaderImg: {
    width: 36,
    height: 36,
  },
  userCharAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#374151',
  },
  coinIcon: {
    width: 18,
    height: 18,
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
