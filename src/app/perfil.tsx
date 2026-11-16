import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCharacterImage } from '../constants/assets';
import api from '../services/api';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Calendar,
  Zap,
  Trophy,
  BookOpen,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { alterarMinhaSenha } from '../services/adminService';
import { obterContinue } from '../services/trilhaService';
import { calculateLevel } from '../utils/leveling';
import { obterResumoProgressoUsuario, ProgressoResumo } from '../services/progressoService';

export interface HeroSkin {
  id: string;
  name: string;
  title: string;
  rarity: 'Comum' | 'Rara' | 'Épica' | 'Lendária';
  rarityColor: string;
  description: string;
  badge: string;
}

export interface PlayableHero {
  id: 'Samurai' | 'Mago' | 'Guerreiro';
  name: string;
  heroName: string;
  title: string;
  role: string;
  description: string;
  badge: string;
  badgeColor: string;
  defaultSkin: string;
}

export const PLAYABLE_HEROES: PlayableHero[] = [
  {
    id: 'Samurai',
    name: 'Samurai',
    heroName: 'Kaito',
    title: 'Mestre da Lâmina & Foco Sagrado',
    role: 'Agilidade & Crítico',
    description: 'Espadachim veloz da escola Kenjutsu. Desfere cortes precisos com dano crítico letal e esquivas perfeitas.',
    badge: '⚔️ Samurai Kaito',
    badgeColor: '#0ea5e9',
    defaultSkin: 'samurai_ronin',
  },
  {
    id: 'Mago',
    name: 'Mago',
    heroName: 'Valerius',
    title: 'Arquimago do Cosmo & Sabedoria',
    role: 'Magia Arcana & Meteoro',
    description: 'Erudito arcano ancestral. Conjura tempestades místicas e meteoros cósmicos que obliteram inimigos.',
    badge: '🔮 Mago Valerius',
    badgeColor: '#a855f7',
    defaultSkin: 'mago_arcanista',
  },
  {
    id: 'Guerreiro',
    name: 'Guerreiro',
    heroName: 'Boran',
    title: 'Guardião Primordial & Muralha',
    role: 'Defesa & Força Bruta',
    description: 'Cavaleiro de aço temperado com escudo impenetrável. Seus golpes titânicos quebram defesas e atordoam oponentes.',
    badge: '🛡️ Guerreiro Boran',
    badgeColor: '#f59e0b',
    defaultSkin: 'guerreiro_templario',
  },
];

export const ALL_HERO_SKINS: Record<string, HeroSkin[]> = {
  Samurai: [
    {
      id: 'samurai_ronin',
      name: 'Kaito Ronin',
      title: 'Espadachim da Honra',
      rarity: 'Comum',
      rarityColor: '#0ea5e9',
      description: 'Estilo clássico da escola Kenjutsu. Combina serenidade com precisão cirúrgica.',
      badge: '⚔️ Clássica',
    },
    {
      id: 'samurai_cyber_void',
      name: 'Kaito Cyber-Void',
      title: 'Andarilho Dimensional',
      rarity: 'Lendária',
      rarityColor: '#a855f7',
      description: 'Armadura de nanotubos e lâmina de plasma fotônico que distorcem o vácuo.',
      badge: '⚡ Lendária',
    },
    {
      id: 'samurai_shogun_solar',
      name: 'Kaito Shogun Solar',
      title: 'Lorde do Dragão Solar',
      rarity: 'Épica',
      rarityColor: '#f59e0b',
      description: 'Armadura dourada forjada nas dunas com corte avassalador de fogo solar.',
      badge: '🔥 Épica',
    },
    {
      id: 'samurai_shinobi_sombra',
      name: 'Kaito Shinobi Sombrio',
      title: 'Mestre do Eclipse',
      rarity: 'Rara',
      rarityColor: '#6366f1',
      description: 'Manto da meia-noite e lâminas espirituais para ataques velozes nas sombras.',
      badge: '🌙 Rara',
    },
  ],
  Mago: [
    {
      id: 'mago_arcanista',
      name: 'Valerius Arcano',
      title: 'Mestre dos Elementos',
      rarity: 'Comum',
      rarityColor: '#0ea5e9',
      description: 'Trajes arcanos tradicionais tecidos com filamentos da aurora boreal.',
      badge: '🔮 Arcano',
    },
    {
      id: 'mago_necromante_espectral',
      name: 'Valerius das Sombras',
      title: 'Lorde do Eclipse Espectral',
      rarity: 'Lendária',
      rarityColor: '#a855f7',
      description: 'Manto etéreo que canaliza as almas esquecidas em um vórtice estelar.',
      badge: '💀 Espectral',
    },
  ],
  Guerreiro: [
    {
      id: 'guerreiro_templario',
      name: 'Boran da Ordem',
      title: 'Guardião Sagrado',
      rarity: 'Comum',
      rarityColor: '#0ea5e9',
      description: 'Armadura pesada de prata polida forjada nas forjas do castelo.',
      badge: '🛡️ Templário',
    },
    {
      id: 'guerreiro_berserker_lava',
      name: 'Boran Vulcânico',
      title: 'Titã das Forjas Sísmicas',
      rarity: 'Épica',
      rarityColor: '#f59e0b',
      description: 'Armadura infundida com magma vivo e machado com chamas perpétuas.',
      badge: '🌋 Magma',
    },
  ],
};

export const HERO_SKINS: HeroSkin[] = ALL_HERO_SKINS.Samurai;

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, updateUserState } = useAuth();
  const { t, language } = useLanguage();
  const { colors } = useTheme();

  const HERO_STORAGE_KEY = 'estudemy_selected_hero';
  const SKIN_STORAGE_KEY = 'estudemy_hero_skin';

  const rawUserHero = (user as any)?.personagem || 'Samurai';
  const initialHero: 'Samurai' | 'Mago' | 'Guerreiro' = rawUserHero.toLowerCase().includes('mago') || rawUserHero.toLowerCase().includes('valerius')
    ? 'Mago'
    : rawUserHero.toLowerCase().includes('guerreiro') || rawUserHero.toLowerCase().includes('boran')
    ? 'Guerreiro'
    : 'Samurai';

  const [selectedHero, setSelectedHero] = useState<'Samurai' | 'Mago' | 'Guerreiro'>(initialHero);
  const [loadingHero, setLoadingHero] = useState<string | null>(null);

  const heroConfig = PLAYABLE_HEROES.find((h) => h.id === selectedHero) || PLAYABLE_HEROES[0];
  const heroSkins = ALL_HERO_SKINS[selectedHero] || ALL_HERO_SKINS.Samurai;

  const initialSkin = (user as any)?.skin || (user as any)?.skinSelecionada || heroConfig.defaultSkin;
  const [selectedSkin, setSelectedSkin] = useState<string>(initialSkin);
  const [loadingSkin, setLoadingSkin] = useState<string | null>(null);

  // Carrega o herói e a skin salvos
  useEffect(() => {
    const loadHeroAndSkin = async () => {
      try {
        let savedHero: string | null = null;
        let savedSkin: string | null = null;
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            savedHero = window.localStorage.getItem(HERO_STORAGE_KEY);
            savedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY);
          }
        } else {
          savedHero = await SecureStore.getItemAsync(HERO_STORAGE_KEY);
          savedSkin = await SecureStore.getItemAsync(SKIN_STORAGE_KEY);
        }

        const heroSource = (user as any)?.personagem || savedHero;
        if (heroSource) {
          const normHero: 'Samurai' | 'Mago' | 'Guerreiro' = heroSource.toLowerCase().includes('mago')
            ? 'Mago'
            : heroSource.toLowerCase().includes('guerreiro') || heroSource.toLowerCase().includes('boran')
            ? 'Guerreiro'
            : 'Samurai';
          setSelectedHero(normHero);
        }

        const userSkin = (user as any)?.skin || (user as any)?.skinSelecionada || savedSkin;
        if (userSkin) {
          setSelectedSkin(userSkin);
        }
      } catch {}
    };
    loadHeroAndSkin();
  }, [user]);

  const handleSelectHero = async (heroId: 'Samurai' | 'Mago' | 'Guerreiro') => {
    if (selectedHero === heroId) return;
    setLoadingHero(heroId);
    try {
      setSelectedHero(heroId);
      const targetHero = PLAYABLE_HEROES.find((h) => h.id === heroId) || PLAYABLE_HEROES[0];
      const defaultSkin = targetHero.defaultSkin;
      setSelectedSkin(defaultSkin);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(HERO_STORAGE_KEY, heroId);
          window.localStorage.setItem(SKIN_STORAGE_KEY, defaultSkin);
        }
      } else {
        await SecureStore.setItemAsync(HERO_STORAGE_KEY, heroId);
        await SecureStore.setItemAsync(SKIN_STORAGE_KEY, defaultSkin);
      }

      if (updateUserState) {
        updateUserState({
          personagem: heroId,
          skin: defaultSkin,
        } as any);
      }

      await api.put('/api/users/atualizar-personagem', {
        personagem: heroId,
      }).catch(() => {});

      if (refreshUser) {
        await refreshUser().catch(() => {});
      }
    } catch (e) {
      logger.error('Erro ao atualizar herói:', e);
    } finally {
      setLoadingHero(null);
    }
  };

  const handleSelectSkin = async (skinId: string) => {
    if (selectedSkin === skinId) return;
    setLoadingSkin(skinId);
    try {
      setSelectedSkin(skinId);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(SKIN_STORAGE_KEY, skinId);
        }
      } else {
        await SecureStore.setItemAsync(SKIN_STORAGE_KEY, skinId);
      }

      if (updateUserState) {
        updateUserState({
          personagem: selectedHero,
          skin: skinId,
        } as any);
      }

      await api.put('/api/users/atualizar-personagem', {
        personagem: selectedHero,
      }).catch(() => {});

      if (refreshUser) {
        await refreshUser().catch(() => {});
      }
    } catch (e) {
      logger.error('Erro ao atualizar skin:', e);
    } finally {
      setLoadingSkin(null);
    }
  };

  // Estatísticas de progresso
  const [trilhasAndamentoCount, setTrilhasAndamentoCount] = useState(0);
  const [fasesConcluidasCount, setFasesConcluidasCount] = useState(0);
  const [bossesDerrotadosCount, setBossesDerrotadosCount] = useState(0);
  const [speedrunsCount, setSpeedrunsCount] = useState(0);
  const [acumuladoXp, setAcumuladoXp] = useState(0);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Alterar Senha state
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [senhaFeedback, setSenhaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAlterarSenha = async () => {
    if (!senhaAtual.trim()) {
      setSenhaFeedback({ type: 'error', message: 'Digite sua senha atual.' });
      return;
    }
    if (novaSenha.length < 8) {
      setSenhaFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaFeedback({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setLoadingSenha(true);
    setSenhaFeedback(null);

    try {
      const res = await alterarMinhaSenha(senhaAtual, novaSenha);
      if (res.success) {
        setSenhaFeedback({ type: 'success', message: res.message || 'Senha atualizada com sucesso!' });
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        setSenhaFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSenhaFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Erro ao alterar senha.',
      });
    } finally {
      setLoadingSenha(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const carregarEstatisticas = async () => {
      try {
        const resumo = await obterResumoProgressoUsuario();
        if (isMounted) {
          setTrilhasAndamentoCount(resumo.totalTrilhasAtivas);
          setFasesConcluidasCount(resumo.totalFasesConcluidas);
          setBossesDerrotadosCount(resumo.bossesDerrotados);
          setSpeedrunsCount(resumo.speedrunsConcluidos);
          setAcumuladoXp(resumo.xpAcumulado);
        }
      } catch (err) {
        logger.warn('Erro ao carregar estatísticas do usuário:', err);
      }
    };

    carregarEstatisticas();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Cálculo de nível com progressão equilibrada RPG combinando backend e offline
  const rawUserXp = Number(user?.xpTotal) || Number((user as any)?.xp) || 0;
  let localSavedXp = 0;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    localSavedXp = parseInt(window.localStorage.getItem('estudemy_user_xp_acumulado') || '0', 10) || 0;
  }
  const xp = Math.max(rawUserXp, acumuladoXp, localSavedXp, fasesConcluidasCount * 100);
  const { level, xpInCurrentLevel, xpNeededForNextLevel, progressPercentage, title: levelTitle } = calculateLevel(xp);

  // Ofensiva do usuário (dias consecutivos)
  const rawStreak = (user as any)?.ofensiva || (user as any)?.streak || (user as any)?.diasConsecutivos;
  const streak = typeof rawStreak === 'number' && rawStreak > 0 ? rawStreak : 1;
  const dayStr = t('common.day');
  const daysStr = t('common.days');
  const streakSuffix = streak === 1
    ? (dayStr && dayStr !== 'common.day' ? dayStr : 'dia')
    : (daysStr && daysStr !== 'common.days' ? daysStr : 'dias');

  // Sistema de 10 Conquistas Reais do Jogador
  const conquistasList = useMemo(() => [
    {
      id: 'first_step',
      titulo: 'Primeiro Passo',
      descricao: 'Conclua sua primeira fase em qualquer trilha',
      icone: '🎯',
      atual: Math.min(fasesConcluidasCount, 1),
      max: 1,
      desbloqueada: fasesConcluidasCount >= 1,
    },
    {
      id: 'explorer',
      titulo: 'Explorador da Sabedoria',
      descricao: 'Inicie ou estude em pelo menos 1 trilha ativa',
      icone: '🗺️',
      atual: Math.min(trilhasAndamentoCount, 1),
      max: 1,
      desbloqueada: trilhasAndamentoCount >= 1,
    },
    {
      id: 'warrior_lv2',
      titulo: 'Guerreiro do Saber',
      descricao: 'Alcance o Nível 2 de jogador na jornada RPG',
      icone: '⚔️',
      atual: Math.min(level, 2),
      max: 2,
      desbloqueada: level >= 2,
    },
    {
      id: 'master_lv5',
      titulo: 'Mestre dos Desafios',
      descricao: 'Alcance o Nível 5 de jogador',
      icone: '🔮',
      atual: Math.min(level, 5),
      max: 5,
      desbloqueada: level >= 5,
    },
    {
      id: 'veteran_phases',
      titulo: 'Veterano de Fases',
      descricao: 'Conclua com sucesso 4 ou mais fases',
      icone: '🛡️',
      atual: Math.min(fasesConcluidasCount, 4),
      max: 4,
      desbloqueada: fasesConcluidasCount >= 4,
    },
    {
      id: 'boss_hunter',
      titulo: 'Caçador de Chefões',
      descricao: 'Derrote pelo menos 1 Chefão Supremo no Boss Rush',
      icone: '👹',
      atual: Math.min(bossesDerrotadosCount, 1),
      max: 1,
      desbloqueada: bossesDerrotadosCount >= 1,
    },
    {
      id: 'supreme_champion',
      titulo: 'Campeão da Arena',
      descricao: 'Derrote todos os 4 Chefões Supremos da Arena',
      icone: '👑',
      atual: Math.min(bossesDerrotadosCount, 4),
      max: 4,
      desbloqueada: bossesDerrotadosCount >= 4,
    },
    {
      id: 'speedrunner',
      titulo: 'Velocista Implacável',
      descricao: 'Conclua uma fase no modo Speedrun contra o relógio',
      icone: '⚡',
      atual: Math.min(speedrunsCount, 1),
      max: 1,
      desbloqueada: speedrunsCount >= 1,
    },
    {
      id: 'habit_flame',
      titulo: 'Chama do Hábito',
      descricao: 'Mantenha uma ofensiva de estudos de pelo menos 3 dias',
      icone: '🔥',
      atual: Math.min(streak, 3),
      max: 3,
      desbloqueada: streak >= 3,
    },
    {
      id: 'living_legend',
      titulo: 'Lenda Viva EstudeMy',
      descricao: 'Alcance o Nível 10 ou acumule 1.000+ XP',
      icone: '🌟',
      atual: Math.min(xp, 1000),
      max: 1000,
      desbloqueada: level >= 10 || xp >= 1000,
    },
  ], [fasesConcluidasCount, trilhasAndamentoCount, level, bossesDerrotadosCount, speedrunsCount, streak, xp]);

  const conquistasDesbloqueadas = useMemo(() => {
    return conquistasList.filter((c) => c.desbloqueada).length;
  }, [conquistasList]);

  const fraseCadastro = useMemo(() => {
    const rawDate =
      (user as any)?.createdAt ||
      (user as any)?.dataCriacao ||
      (user as any)?.dataCadastro;

    let dateObj: Date;
    if (rawDate) {
      dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
    } else {
      dateObj = new Date();
    }

    const mesesPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const mesesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const mesesEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const lang = language || 'pt-BR';
    const monthIndex = dateObj.getMonth();
    const ano = dateObj.getFullYear();

    if (lang === 'en-US') {
      return `Member since ${mesesEn[monthIndex]} ${ano}`;
    } else if (lang === 'es-ES') {
      return `Miembro desde ${mesesEs[monthIndex]} de ${ano}`;
    }
    return `Membro desde ${mesesPt[monthIndex]} de ${ano}`;
  }, [user, language]);

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 48),
        },
      ]}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 16, 16),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Título */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('profilePage.title') || 'Meu Perfil'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Card do Usuário */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={getCharacterImage(selectedHero)}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.nome || 'Estudante'}</Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'email@provedor.com'}</Text>
        
        {/* Tipo de Usuário Badge */}
        {user?.tipoUsuario && (
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.roleBadgeText}>{user.tipoUsuario}</Text>
          </View>
        )}

        {/* Herói e Skin Ativa */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <View style={[styles.heroPill, { backgroundColor: heroConfig.badgeColor }]}>
            <Text style={[styles.heroPillText, { color: '#ffffff', fontWeight: '800' }]}>{heroConfig.badge}</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: '#1E293B' }]}>
            <Text style={styles.heroPillText}>
              {(heroSkins.find((s) => s.id === selectedSkin) || heroSkins[0]).badge} {(heroSkins.find((s) => s.id === selectedSkin) || heroSkins[0]).name}
            </Text>
          </View>
        </View>

        {/* Frase: Membro desde Mês e Ano */}
        <View style={styles.memberSinceRow}>
          <Calendar size={13} color="#8B5CF6" style={{ marginRight: 5 }} />
          <Text style={[styles.memberSinceText, { color: colors.textMuted }]}>
            {fraseCadastro}
          </Text>
        </View>

        {/* Nível e XP */}
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>{t('ranking.levelLabel') || 'Nível'} {level} • {levelTitle}</Text>
          <Text style={[styles.xpLabel, { backgroundColor: colors.cardSecondary, color: colors.text }]}>
            {xpInCurrentLevel} / {xpNeededForNextLevel} XP ({progressPercentage}%)
          </Text>
        </View>
      </View>

      {/* Seção: Estatísticas do Usuário */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsHeaderRow}>
          <View style={styles.statsIconBubble}>
            <Trophy size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statsCardTitle, { color: colors.text }]}>
              {t('profile.learningStats') || 'Estatísticas de Aprendizado'}
            </Text>
            <Text style={[styles.statsCardSubtitle, { color: colors.textMuted }]}>
              {t('profile.learningStatsDesc') || 'Seu progresso e conquistas na jornada EstudeMy'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Nível Atual */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Trophy size={18} color="#8B5CF6" />
            <Text style={[styles.statItemValue, { color: colors.text }]}>{t('ranking.levelLabel') || 'Nível'} {level}</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.currentLevel') || 'Nível Atual'}</Text>
          </View>

          {/* Card 2: XP Total */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Zap size={18} color="#F59E0B" />
            <Text style={[styles.statItemValue, { color: '#F59E0B' }]}>{xp} XP</Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.experience') || 'Experiência'}</Text>
          </View>

          {/* Card 3: Trilhas Ativas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <BookOpen size={18} color="#3B82F6" />
            <Text style={[styles.statItemValue, { color: '#3B82F6' }]}>
              {trilhasAndamentoCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.activeTrails') || 'Trilhas Ativas'}</Text>
          </View>

          {/* Card 4: Fases Completadas */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: '#10B981' }]}>
              {fasesConcluidasCount}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.completedPhases') || 'Fases Concluídas'}</Text>
          </View>

          {/* Card 5: Ofensiva */}
          <View style={[styles.statItemCard, { backgroundColor: colors.cardSecondary }]}>
            <Flame size={18} color="#EF4444" />
            <Text style={[styles.statItemValue, { color: '#EF4444' }]}>
              {streak} {streakSuffix}
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.streak') || 'Ofensiva'}</Text>
          </View>

          {/* Card 6: Conquistas (Interativo com Modal de Detalhes) */}
          <TouchableOpacity
            style={[styles.statItemCard, { backgroundColor: colors.cardSecondary, borderColor: '#10B981', borderWidth: 2 }]}
            onPress={() => setShowAchievementsModal(true)}
            activeOpacity={0.8}
          >
            <Award size={18} color="#10B981" />
            <Text style={[styles.statItemValue, { color: '#10B981' }]}>
              {conquistasDesbloqueadas}/10
            </Text>
            <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{t('profile.achievements') || 'Conquistas'}</Text>
            <Text style={{ fontSize: 8, color: '#10B981', fontWeight: '900', marginTop: 2 }}>TOQUE P/ VER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seção: Escolha de Herói Jogável */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Escolha seu Herói
          </Text>
          <View style={[styles.skinRarityPill, { backgroundColor: heroConfig.badgeColor }]}>
            <Text style={styles.skinRarityPillText}>
              {heroConfig.badge}
            </Text>
          </View>
        </View>

        <Text style={[styles.skinSectionSubtitle, { color: colors.textMuted }]}>
          Selecione seu campeão principal para as batalhas e trilhas do jogo. Sua foto de perfil e personagem no combate são atualizados automaticamente:
        </Text>

        <View style={styles.heroesGrid}>
          {PLAYABLE_HEROES.map((hero) => {
            const isSelected = selectedHero === hero.id;
            const isLoading = loadingHero === hero.id;

            return (
              <TouchableOpacity
                key={hero.id}
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? hero.badgeColor : colors.border,
                  },
                  isSelected && styles.heroCardSelected,
                ]}
                onPress={() => handleSelectHero(hero.id)}
                disabled={isLoading || isSelected}
                activeOpacity={0.85}
              >
                <View style={styles.heroCardHeader}>
                  <View style={[styles.skinBadgeBox, { backgroundColor: hero.badgeColor }]}>
                    <Text style={styles.skinBadgeText}>{hero.role}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.equippedBadge}>
                      <CheckCircle2 size={13} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.equippedText}>SELECIONADO</Text>
                    </View>
                  )}
                </View>

                <View style={styles.skinCardBody}>
                  <Image
                    source={getCharacterImage(hero.id)}
                    style={[styles.heroAvatarImg, { borderColor: hero.badgeColor }]}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skinNameText, { color: colors.text }]}>{hero.name} ({hero.heroName})</Text>
                    <Text style={[styles.skinTitleText, { color: hero.badgeColor }]}>{hero.title}</Text>
                    <Text style={[styles.skinDescText, { color: colors.textMuted }]} numberOfLines={2}>
                      {hero.description}
                    </Text>
                  </View>
                </View>

                {isLoading && (
                  <ActivityIndicator size="small" color={hero.badgeColor} style={{ marginTop: 8 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção: Customização de Skins do Herói Selecionado */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Skins de {heroConfig.name} ({heroConfig.heroName})
          </Text>
          <View style={[styles.skinRarityPill, { backgroundColor: (heroSkins.find((s) => s.id === selectedSkin) || heroSkins[0]).rarityColor }]}>
            <Text style={styles.skinRarityPillText}>
              {(heroSkins.find((s) => s.id === selectedSkin) || heroSkins[0]).badge}
            </Text>
          </View>
        </View>

        <Text style={[styles.skinSectionSubtitle, { color: colors.textMuted }]}>
          Escolha uma armadura ou visual exclusivo para {heroConfig.heroName} no campo de batalha:
        </Text>

        <View style={styles.skinsGrid}>
          {heroSkins.map((skin) => {
            const isSelected = selectedSkin === skin.id;
            const isLoading = loadingSkin === skin.id;

            return (
              <TouchableOpacity
                key={skin.id}
                style={[
                  styles.skinCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? '#10B981' : colors.border,
                  },
                  isSelected && styles.skinCardSelected,
                ]}
                onPress={() => handleSelectSkin(skin.id)}
                disabled={isLoading || isSelected}
                activeOpacity={0.85}
              >
                <View style={styles.skinCardHeader}>
                  <View style={[styles.skinBadgeBox, { backgroundColor: skin.rarityColor }]}>
                    <Text style={styles.skinBadgeText}>{skin.badge}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.equippedBadge}>
                      <CheckCircle2 size={13} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.equippedText}>EQUIPADA</Text>
                    </View>
                  )}
                </View>

                <View style={styles.skinCardBody}>
                  <Image
                    source={getCharacterImage(selectedHero)}
                    style={[
                      styles.skinAvatarImg,
                      skin.id.includes('void') && { tintColor: '#C084FC' },
                      skin.id.includes('solar') && { tintColor: '#F59E0B' },
                      skin.id.includes('sombra') && { tintColor: '#818CF8' },
                      skin.id.includes('lava') && { tintColor: '#EF4444' },
                      skin.id.includes('espectral') && { tintColor: '#A855F7' },
                    ]}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skinNameText, { color: colors.text }]}>{skin.name}</Text>
                    <Text style={[styles.skinTitleText, { color: skin.rarityColor }]}>{skin.title}</Text>
                    <Text style={[styles.skinDescText, { color: colors.textMuted }]} numberOfLines={2}>
                      {skin.description}
                    </Text>
                  </View>
                </View>

                {isLoading && (
                  <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção: Alterar Senha */}
      <View style={[styles.passwordSection, { backgroundColor: colors.card }]}>
        <View style={styles.passwordHeader}>
          <KeyRound size={22} color="#F59E0B" />
          <Text style={[styles.passwordSectionTitle, { color: colors.text }]}>
            {t('profile.changePassword') || 'Alterar Senha'}
          </Text>
        </View>
        <Text style={[styles.passwordSectionDesc, { color: colors.textMuted }]}>
          {t('profile.changePasswordDesc') || 'Para sua segurança, informe sua senha atual e digite a nova com pelo menos 8 caracteres.'}
        </Text>

        {senhaFeedback && (
          <View
            style={[
              styles.feedbackBox,
              senhaFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                senhaFeedback.type === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
              ]}
            >
              {senhaFeedback.message}
            </Text>
          </View>
        )}

        {/* Senha Atual */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.currentPassword') || 'Senha Atual'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.currentPassword') || 'Digite sua senha atual'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showSenhaAtual}
              value={senhaAtual}
              onChangeText={setSenhaAtual}
            />
            <TouchableOpacity onPress={() => setShowSenhaAtual(!showSenhaAtual)} style={styles.eyeBtn}>
              {showSenhaAtual ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.newPassword') || 'Nova Senha (Mínimo 8 dígitos)'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.newPassword') || 'Digite a nova senha'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNovaSenha}
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            <TouchableOpacity onPress={() => setShowNovaSenha(!showNovaSenha)} style={styles.eyeBtn}>
              {showNovaSenha ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('profile.confirmNewPassword') || 'Confirmar Nova Senha'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardSecondary }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('profile.confirmNewPassword') || 'Repita a nova senha'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)} style={styles.eyeBtn}>
              {showConfirmarSenha ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão de Salvar Senha */}
        <TouchableOpacity
          style={styles.savePasswordBtn}
          onPress={handleAlterarSenha}
          disabled={loadingSenha}
          activeOpacity={0.85}
        >
          {loadingSenha ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <KeyRound size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.savePasswordBtnText}>
                {t('profile.updatePassword') || 'Atualizar Minha Senha'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />

      {/* Modal de Conquistas de Aprendizado */}
      <Modal
        visible={showAchievementsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAchievementsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Award size={22} color="#10B981" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Conquistas ({conquistasDesbloqueadas}/10)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAchievementsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Complete objetivos na sua jornada para desbloquear conquistas e subir no Ranking EstudeMy:
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {conquistasList.map((conquista) => (
                <View
                  key={conquista.id}
                  style={[
                    styles.achievementRowCard,
                    { backgroundColor: colors.cardSecondary, borderColor: conquista.desbloqueada ? '#10B981' : colors.border },
                    conquista.desbloqueada && styles.achievementUnlockedCard,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{conquista.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.achievementTitle, { color: colors.text }]}>{conquista.titulo}</Text>
                      {conquista.desbloqueada ? (
                        <View style={styles.unlockedPill}>
                          <CheckCircle2 size={11} color="#ffffff" style={{ marginRight: 3 }} />
                          <Text style={styles.unlockedPillText}>DESBLOQUEADA</Text>
                        </View>
                      ) : (
                        <Text style={[styles.achievementProgressText, { color: colors.textMuted }]}>
                          {conquista.atual}/{conquista.max}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>{conquista.descricao}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  profileCard: {
    alignItems: 'center',
    padding: 24,
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
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#374151',
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
  },
  charSelectImg: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginTop: 8,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  memberSinceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  statsIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  statsCardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItemCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItemValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  statItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  levelLabel: {
    backgroundColor: '#CA8A04',
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  xpLabel: {
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  characterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  heroPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  skinRarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skinRarityPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  skinSectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 17,
  },
  heroesGrid: {
    gap: 12,
    marginBottom: 8,
  },
  heroCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3,
  },
  heroCardSelected: {
    borderWidth: 3.5,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroAvatarImg: {
    width: 66,
    height: 66,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  skinsGrid: {
    gap: 10,
  },
  skinCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  skinCardSelected: {
    borderWidth: 2.5,
    borderColor: '#10B981',
  },
  skinCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skinBadgeBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skinBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equippedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skinCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skinAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  skinNameText: {
    fontSize: 15,
    fontWeight: '900',
  },
  skinTitleText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
    marginBottom: 3,
  },
  skinDescText: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  charBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#1b1b1b',
  },
  charBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  charBtnTextActive: {
    color: '#ffffff',
  },
  passwordSection: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  passwordSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  passwordSectionDesc: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 16,
  },
  feedbackBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackTextSuccess: {
    color: '#15803D',
  },
  feedbackTextError: {
    color: '#B91C1C',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  savePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginTop: 8,
  },
  savePasswordBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    borderWidth: 3.5,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 17,
  },
  achievementRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
    gap: 12,
  },
  achievementUnlockedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  achievementEmoji: {
    fontSize: 26,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  achievementDesc: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 15,
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unlockedPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  achievementProgressText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
