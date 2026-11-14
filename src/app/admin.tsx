import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trilha, excluirTrilha } from '../services/trilhaService';
import {
  listarUsuariosAdmin,
  listarTodasTrilhasAdmin,
  excluirUsuarioAdmin,
  AdminUserItem,
} from '../services/adminService';
import {
  obterMaterias,
  adicionarMateria,
  excluirMateria,
} from '../services/materiaService';
import {
  copyToClipboard,
  getAllKnownTrailCodes,
  getOrGenerateTrailAccessCode,
  isTrilhaPrivada,
  removeTrailAccessCode,
} from '../services/trilhaAcessoService';
import {
  obterExtratoGeralAdmin,
  TransacaoPagamento,
} from '../services/pagamentoService';
import QRCodeModal from '../components/QRCodeModal';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Tag,
  Search,
  PlusCircle,
  Copy,
  Check,
  QrCode,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  DollarSign,
  TrendingUp,
  Receipt,
} from 'lucide-react-native';
import { AccessibilityIcon } from '../components/AccessibilityIcon';

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const { colors, openAccessibilityModal } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'trilhas' | 'usuarios' | 'materias' | 'financeiro'>('trilhas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUserItem[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [knownCodes, setKnownCodes] = useState<Record<string, string>>({});
  const [extratoAdmin, setExtratoAdmin] = useState<{
    totalTransacoes: number;
    faturamentoTotal: number;
    repasseTotalProfessores: number;
    receitaLiquidaEstudeMy: number;
    transacoes: TransacaoPagamento[];
  } | null>(null);

  // Busca e Filtros
  const [searchTrilhas, setSearchTrilhas] = useState('');
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Nova Matéria
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [adicionandoMateria, setAdicionandoMateria] = useState(false);
  const [materiaFeedback, setMateriaFeedback] = useState<string | null>(null);

  // QR Code Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTrilhaQr, setSelectedTrilhaQr] = useState<Trilha | null>(null);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const rawRole = (user?.tipoUsuario || (user as any)?.role || (user as any)?.tipo || (user as any)?.tipo_usuario || '').toString().toUpperCase();
  const isAdminEmail = user?.email?.toLowerCase().includes('adm') || user?.email === 'estudemy.adm@gmail.com';
  const isAdminOrOwner = rawRole === 'ADMINISTRADOR' || rawRole === 'ADMIN' || rawRole === 'OWNER' || isAdminEmail || Boolean((user as any)?.isAdmin);

  const loadAllAdminData = useCallback(async () => {
    try {
      const [trilhasData, usuariosData, materiasData, codes, extrato] = await Promise.all([
        listarTodasTrilhasAdmin(),
        listarUsuariosAdmin(),
        obterMaterias(),
        getAllKnownTrailCodes(),
        obterExtratoGeralAdmin(),
      ]);

      const updatedCodes = { ...codes };
      for (const t of trilhasData) {
        if (t.disponibilidade === 'Privado') {
          if (!updatedCodes[t._id]) {
            const uniqueCode = await getOrGenerateTrailAccessCode(t._id, t.codigoAcesso, 'Privado');
            if (uniqueCode) updatedCodes[t._id] = uniqueCode;
          }
        } else {
          delete updatedCodes[t._id];
          await removeTrailAccessCode(t._id);
        }
      }

      setTrilhas(trilhasData);
      setUsuarios(usuariosData);
      setMaterias(materiasData);
      setKnownCodes(updatedCodes);
      setExtratoAdmin(extrato);
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (isAdminOrOwner) {
      void (async () => {
        if (active) {
          await loadAllAdminData();
        }
      })();
    } else {
      void Promise.resolve().then(() => {
        if (active) {
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [isAdminOrOwner, loadAllAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllAdminData();
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleAdicionarMateria = async () => {
    const nome = novaMateriaNome.trim();
    if (!nome) return;
    setAdicionandoMateria(true);
    setMateriaFeedback(null);
    try {
      const updated = await adicionarMateria(nome);
      setMaterias(updated);
      setNovaMateriaNome('');
      setMateriaFeedback(`Matéria "${nome}" adicionada com sucesso!`);
      setTimeout(() => setMateriaFeedback(null), 3500);
    } catch (err: any) {
      setMateriaFeedback(err.message || 'Erro ao adicionar matéria.');
    } finally {
      setAdicionandoMateria(false);
    }
  };

  const handleExcluirMateria = (nome: string) => {
    const confirm = () => {
      excluirMateria(nome).then((updated) => {
        setMaterias(updated);
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja remover a matéria "${nome}"?`)) {
        confirm();
      }
    } else {
      Alert.alert('Excluir Matéria', `Deseja remover a matéria "${nome}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  const handleExcluirTrilha = (trilhaId: string, titulo: string) => {
    const confirm = async () => {
      try {
        await excluirTrilha(trilhaId);
        setTrilhas((prev) => prev.filter((t) => t._id !== trilhaId));
        if (Platform.OS === 'web') {
          window.alert(`Trilha "${titulo}" excluída com sucesso!`);
        } else {
          Alert.alert('Sucesso', `Trilha "${titulo}" excluída com sucesso!`);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Erro ao excluir trilha.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Erro', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja excluir permanentemente a trilha "${titulo}"?\n\nEsta ação não poderá ser desfeita.`)) {
        void confirm();
      }
    } else {
      Alert.alert(
        'Excluir Trilha',
        `Tem certeza que deseja excluir permanentemente a trilha "${titulo}"?\n\nEsta ação não poderá ser desfeita.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: confirm },
        ]
      );
    }
  };

  const handleExcluirUsuario = (userId: string, nome: string, email: string) => {
    const currentUserId = user?._id || user?.id;
    if (userId === currentUserId) {
      const msg = 'Você não pode excluir sua própria conta de administrador por aqui.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Ação Não Permitida', msg);
      return;
    }

    const confirm = async () => {
      try {
        await excluirUsuarioAdmin(userId);
        setUsuarios((prev) => prev.filter((u) => (u._id || u.id) !== userId));
        if (Platform.OS === 'web') {
          window.alert(`Usuário "${nome}" excluído com sucesso!`);
        } else {
          Alert.alert('Sucesso', `Usuário "${nome}" excluído com sucesso!`);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Erro ao excluir usuário.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Erro', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`ATENÇÃO: Deseja realmente excluir o usuário "${nome}" (${email}) permanentemente do sistema?`)) {
        void confirm();
      }
    } else {
      Alert.alert(
        'Excluir Usuário',
        `ATENÇÃO: Deseja realmente excluir o usuário "${nome}" (${email}) permanentemente do sistema?\n\nTodos os dados e acessos serão removidos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir Definitivamente', style: 'destructive', onPress: confirm },
        ]
      );
    }
  };

  const filteredTrilhas = useMemo(() => {
    return trilhas.filter((t) => {
      if (!searchTrilhas.trim()) return true;
      const q = searchTrilhas.toLowerCase();
      const matchTitle = t.titulo.toLowerCase().includes(q);
      const matchMateria = t.materia.toLowerCase().includes(q);
      const authorName = typeof t.criadoPor === 'object' ? (t.criadoPor as any).nome || '' : '';
      const matchAuthor = authorName.toLowerCase().includes(q);
      return matchTitle || matchMateria || matchAuthor;
    });
  }, [trilhas, searchTrilhas]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      if (!searchUsuarios.trim()) return true;
      const q = searchUsuarios.toLowerCase();
      const matchName = u.nome?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchRole = u.tipoUsuario?.toLowerCase().includes(q);
      const matchId = (u._id || u.id || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchRole || matchId;
    });
  }, [usuarios, searchUsuarios]);

  const getTrilhasDoUsuario = (userId: string) => {
    return trilhas.filter((t) => {
      if (!t.criadoPor) return false;
      if (typeof t.criadoPor === 'string') return t.criadoPor === userId;
      return (t.criadoPor as any)._id === userId || (t.criadoPor as any).id === userId;
    });
  };

  if (authLoading || (loading && isAdminOrOwner)) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: insets.top,
          },
        ]}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, fontWeight: '700', color: colors.textMuted }}>
          {t('adminPanel.loading') || 'Carregando painel administrativo...'}
        </Text>
      </View>
    );
  }

  if (!isAdminOrOwner) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top,
          },
        ]}
      >
        <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Acesso Restrito ao Administrador</Text>
        <Text style={[styles.deniedDesc, { color: colors.textMuted }]}>
          Este painel contém controles e relatórios globais restritos aos administradores da plataforma EstudeMy.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.backHomeBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.backHomeBtnText, { color: colors.text }]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.backHomeBtnText}>Ir para a Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 12, 44),
          paddingBottom: Math.max(insets.bottom + 24, 40),
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header do Painel Admin */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          {/* Botão Superior Voltar */}
          <TouchableOpacity
            style={styles.backRowBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={colors.text} />
            <Text style={[styles.backRowBtnText, { color: colors.text }]}>
              {t('common.back') || 'Voltar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <View style={styles.adminBadgeIcon}>
              <ShieldCheck size={26} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Painel Administrativo</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                Visão global da plataforma: Usuários, Trilhas e Matérias
              </Text>
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

          {/* Cards de Métricas Globais */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.cardSecondary }]}>
              <Users size={16} color="#3B82F6" />
              <Text style={styles.metricNumber}>{usuarios.length}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Usuários</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.cardSecondary }]}>
              <BookOpen size={16} color="#10B981" />
              <Text style={styles.metricNumber}>{trilhas.length}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Trilhas</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.cardSecondary }]}>
              <Tag size={16} color="#F59E0B" />
              <Text style={styles.metricNumber}>{materias.length}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Matérias</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.cardSecondary }]}>
              <DollarSign size={16} color="#8B5CF6" />
              <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>
                {extratoAdmin?.totalTransacoes || 0}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Vendas</Text>
            </View>
          </View>
        </View>

        {/* Abas Segmentadas do Painel Admin */}
        <View style={styles.segmentedTabsContainer}>
          <TouchableOpacity
            style={[styles.segmentedTab, activeTab === 'trilhas' && styles.segmentedTabActive]}
            onPress={() => setActiveTab('trilhas')}
            activeOpacity={0.8}
          >
            <BookOpen size={13} color={activeTab === 'trilhas' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.segmentedTabText, activeTab === 'trilhas' && styles.segmentedTabTextActive]}>
              Trilhas ({trilhas.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTab, activeTab === 'usuarios' && styles.segmentedTabActive]}
            onPress={() => setActiveTab('usuarios')}
            activeOpacity={0.8}
          >
            <Users size={13} color={activeTab === 'usuarios' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.segmentedTabText, activeTab === 'usuarios' && styles.segmentedTabTextActive]}>
              Usuários ({usuarios.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTab, activeTab === 'materias' && styles.segmentedTabActive]}
            onPress={() => setActiveTab('materias')}
            activeOpacity={0.8}
          >
            <Tag size={13} color={activeTab === 'materias' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.segmentedTabText, activeTab === 'materias' && styles.segmentedTabTextActive]}>
              Matérias ({materias.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTab, activeTab === 'financeiro' && styles.segmentedTabActive]}
            onPress={() => setActiveTab('financeiro')}
            activeOpacity={0.8}
          >
            <DollarSign size={13} color={activeTab === 'financeiro' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.segmentedTabText, activeTab === 'financeiro' && styles.segmentedTabTextActive]}>
              Financeiro
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* ABA 1: TODAS AS TRILHAS DA PLATAFORMA */}
        {/* ================================================================= */}
        {activeTab === 'trilhas' && (
          <View>
            <View style={styles.searchBarWrap}>
              <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Filtrar por trilha, matéria ou autor..."
                placeholderTextColor={colors.textMuted}
                value={searchTrilhas}
                onChangeText={setSearchTrilhas}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
            ) : filteredTrilhas.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
                  Nenhuma trilha encontrada.
                </Text>
              </View>
            ) : (
              filteredTrilhas.map((item) => {
                const isPrivate = isTrilhaPrivada(item);
                const isPaid = item.pagamento === 'Paga' || Boolean(item.preco && Number(item.preco) > 0);
                const accessCode = isPrivate ? (item.codigoAcesso || knownCodes[item._id] || '') : '';
                const autor =
                  typeof item.criadoPor === 'object'
                    ? (item.criadoPor as any).nome || (item.criadoPor as any).email || 'Professor'
                    : 'Professor';

                return (
                  <View key={item._id} style={[styles.itemCard, { backgroundColor: colors.card }]}>
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemMateria, { color: '#38BDF8' }]}>
                          {item.materia.toUpperCase()} • Autor: {autor}
                        </Text>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.titulo}</Text>
                      </View>

                      {/* Badges */}
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <View style={[styles.miniBadge, isPrivate ? styles.badgePrivate : styles.badgePublic]}>
                          {isPrivate ? <Lock size={10} color="#ffffff" style={{ marginRight: 2 }} /> : <Globe size={10} color="#ffffff" style={{ marginRight: 2 }} />}
                          <Text style={styles.miniBadgeText}>{isPrivate ? 'Privada' : 'Aberta'}</Text>
                        </View>
                        <View style={[styles.miniBadge, isPaid ? styles.badgePaid : styles.badgeFree]}>
                          <Text style={styles.miniBadgeText}>
                            {isPaid ? (item.preco ? `R$ ${Number(item.preco).toFixed(2).replace('.', ',')}` : 'Paga') : 'Gratuita'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {item.descricao ? (
                      <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.descricao}
                      </Text>
                    ) : null}

                    {/* Código de Acesso Único da Trilha */}
                    {isPrivate && (
                      <View style={styles.codeRowBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.codeRowLabel}>CÓDIGO ÚNICO:</Text>
                          <Text style={styles.codeRowValue}>{accessCode}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.actionBtnSmall}
                          onPress={() => handleCopy(item._id, accessCode)}
                          activeOpacity={0.8}
                        >
                          {copiedCodeId === item._id ? (
                            <Check size={14} color="#10B981" />
                          ) : (
                            <Copy size={14} color="#F59E0B" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.itemActionsRow}>
                      <TouchableOpacity
                        style={styles.qrBtnSmall}
                        onPress={() => {
                          setSelectedTrilhaQr(item);
                          setQrModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <QrCode size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.qrBtnSmallText}>QR Code</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewTrailBtn}
                        onPress={() => router.push(`/trilha/${item._id}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewTrailBtnText}>Ver Trilha</Text>
                        <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteTrailBtn}
                        onPress={() => handleExcluirTrilha(item._id, item.titulo)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.deleteTrailBtnText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* ABA 2: TODOS OS USUÁRIOS CADASTRADOS & SUAS TRILHAS */}
        {/* ================================================================= */}
        {activeTab === 'usuarios' && (
          <View>
            <View style={styles.searchBarWrap}>
              <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Filtrar por nome, e-mail, cargo ou ID..."
                placeholderTextColor={colors.textMuted}
                value={searchUsuarios}
                onChangeText={setSearchUsuarios}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
            ) : filteredUsuarios.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
                  Nenhum usuário encontrado.
                </Text>
              </View>
            ) : (
              filteredUsuarios.map((userItem) => {
                const uId = userItem._id || userItem.id || '';
                const isExpanded = expandedUserId === uId;
                const userTrilhas = getTrilhasDoUsuario(uId);

                const roleColor =
                  userItem.tipoUsuario === 'OWNER'
                    ? '#F59E0B'
                    : userItem.tipoUsuario === 'ADMINISTRADOR'
                    ? '#8B5CF6'
                    : userItem.tipoUsuario === 'PROFESSOR'
                    ? '#10B981'
                    : '#3B82F6';

                return (
                  <View key={uId} style={[styles.userCard, { backgroundColor: colors.card }]}>
                    <View style={styles.userCardHeader}>
                      <View style={[styles.userAvatarCircle, { backgroundColor: roleColor }]}>
                        <UserIcon size={20} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.userName, { color: colors.text }]}>
                            {userItem.nome || 'Sem Nome'}
                          </Text>
                          <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
                            <Text style={styles.roleBadgeText}>{userItem.tipoUsuario || 'ALUNO'}</Text>
                          </View>
                        </View>
                        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userItem.email}</Text>
                        <View style={styles.userIdRow}>
                          <Text style={[styles.userIdLabel, { color: colors.textMuted }]}>ID: {uId}</Text>
                          <TouchableOpacity
                            onPress={() => handleCopy(uId, uId)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            {copiedCodeId === uId ? (
                              <Check size={12} color="#10B981" />
                            ) : (
                              <Copy size={12} color={colors.textMuted} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Botão de Expandir Trilhas deste usuário */}
                      <TouchableOpacity
                        style={[styles.expandBtn, { backgroundColor: colors.cardSecondary }]}
                        onPress={() => setExpandedUserId(isExpanded ? null : uId)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.expandBtnText, { color: colors.text }]}>
                          {userTrilhas.length} {userTrilhas.length === 1 ? 'trilha' : 'trilhas'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={16} color={colors.text} />
                        ) : (
                          <ChevronDown size={16} color={colors.text} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Lista Expandida de Trilhas do Usuário */}
                    {isExpanded && (
                      <View style={styles.userExpandedTrilhasBox}>
                        <Text style={[styles.expandedBoxTitle, { color: colors.text }]}>
                          Trilhas criadas por este usuário:
                        </Text>
                        {userTrilhas.length === 0 ? (
                          <Text style={[styles.noTrilhasText, { color: colors.textMuted }]}>
                            Este usuário ainda não criou nenhuma trilha.
                          </Text>
                        ) : (
                          userTrilhas.map((ut) => (
                            <View
                              key={ut._id}
                              style={[styles.userTrilhaRow, { backgroundColor: colors.cardSecondary }]}
                            >
                              <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => router.push(`/trilha/${ut._id}`)}
                                activeOpacity={0.85}
                              >
                                <Text style={[styles.utTitle, { color: colors.text }]}>{ut.titulo}</Text>
                                <Text style={[styles.utMeta, { color: colors.textMuted }]}>
                                  {ut.materia} • {ut.disponibilidade || 'Aberta'} • {ut.pagamento || 'Gratuita'}
                                </Text>
                              </TouchableOpacity>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity
                                  style={styles.deleteMiniBtn}
                                  onPress={() => handleExcluirTrilha(ut._id, ut.titulo)}
                                  activeOpacity={0.8}
                                >
                                  <Trash2 size={13} color="#EF4444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => router.push(`/trilha/${ut._id}`)}
                                  activeOpacity={0.8}
                                >
                                  <ArrowRight size={16} color="#4F46E5" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    )}

                    {/* Ações Administrativas: Excluir Usuário */}
                    <View style={styles.userCardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.userActionDeleteBtn,
                          (uId === (user?._id || user?.id) || userItem.tipoUsuario === 'OWNER') && { opacity: 0.4 },
                        ]}
                        onPress={() => handleExcluirUsuario(uId, userItem.nome, userItem.email)}
                        disabled={uId === (user?._id || user?.id) || userItem.tipoUsuario === 'OWNER'}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={13} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.userActionDeleteText}>Excluir Usuário</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* ABA 3: GERENCIAMENTO DE MATÉRIAS */}
        {/* ================================================================= */}
        {activeTab === 'materias' && (
          <View>
            {/* Formulário: Adicionar Nova Matéria */}
            <View style={[styles.addMateriaCard, { backgroundColor: colors.card }]}>
              <View style={styles.addMateriaHeader}>
                <PlusCircle size={20} color="#10B981" />
                <Text style={[styles.addMateriaTitle, { color: colors.text }]}>Adicionar Nova Matéria</Text>
              </View>
              <Text style={[styles.addMateriaDesc, { color: colors.textMuted }]}>
                Insira o nome da disciplina para disponibilizá-la imediatamente na criação de trilhas.
              </Text>

              {materiaFeedback && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{materiaFeedback}</Text>
                </View>
              )}

              <View style={styles.addMateriaInputRow}>
                <TextInput
                  style={[styles.addMateriaInput, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                  placeholder="Ex: Robótica Educacional"
                  placeholderTextColor={colors.textMuted}
                  value={novaMateriaNome}
                  onChangeText={setNovaMateriaNome}
                />
                <TouchableOpacity
                  style={styles.addMateriaSubmitBtn}
                  onPress={handleAdicionarMateria}
                  disabled={adicionandoMateria || !novaMateriaNome.trim()}
                  activeOpacity={0.85}
                >
                  {adicionandoMateria ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.addMateriaSubmitText}>Adicionar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de Matérias Existentes */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Matérias Cadastradas ({materias.length})
            </Text>

            <View style={styles.materiasGrid}>
              {materias.map((materiaNome) => {
                const count = trilhas.filter(
                  (t) => t.materia?.toLowerCase() === materiaNome.toLowerCase()
                ).length;

                return (
                  <View key={materiaNome} style={[styles.materiaCard, { backgroundColor: colors.card }]}>
                    <View style={styles.materiaIconBox}>
                      <Tag size={16} color="#4F46E5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.materiaName, { color: colors.text }]}>{materiaNome}</Text>
                      <Text style={[styles.materiaCount, { color: colors.textMuted }]}>
                        {count} {count === 1 ? 'trilha' : 'trilhas'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.materiaDeleteBtn}
                      onPress={() => handleExcluirMateria(materiaNome)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* ABA 4: GESTÃO FINANCEIRA E REPASSES (85% PROFESSOR / 15% ESTUDEMY) */}
        {/* ================================================================= */}
        {activeTab === 'financeiro' && (
          <View>
            {/* Card Explicativo de Repasse e Split */}
            <View style={[styles.financeExplainerCard, { backgroundColor: colors.card }]}>
              <View style={styles.financeExplainerHeader}>
                <TrendingUp size={22} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.financeExplainerTitle, { color: colors.text }]}>
                    Split de Pagamentos da Plataforma
                  </Text>
                  <Text style={[styles.financeExplainerDesc, { color: colors.textMuted }]}>
                    Regra oficial da EstudeMy: 85% do valor total de cada trilha vendida é repassado ao professor autor, e 15% é a taxa administrativa e de manutenção da plataforma.
                  </Text>
                </View>
              </View>

              <View style={styles.financeSplitPillsRow}>
                <View style={[styles.financeSplitPill, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.financeSplitPillText}>85% Repasse aos Professores</Text>
                </View>
                <View style={[styles.financeSplitPill, { backgroundColor: '#6366F1' }]}>
                  <Text style={styles.financeSplitPillText}>15% Taxa EstudeMy</Text>
                </View>
              </View>
            </View>

            {/* Grid com Métricas Financeiras Globais */}
            <View style={styles.financeGrid}>
              <View style={[styles.financeGridCard, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.financeGridLabel, { color: colors.textMuted }]}>Faturamento Bruto</Text>
                <Text style={[styles.financeGridValue, { color: '#3B82F6' }]}>
                  R$ {(extratoAdmin?.faturamentoTotal || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={[styles.financeGridCard, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.financeGridLabel, { color: colors.textMuted }]}>Repasse Professores (85%)</Text>
                <Text style={[styles.financeGridValue, { color: '#10B981' }]}>
                  R$ {(extratoAdmin?.repasseTotalProfessores || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={[styles.financeGridCard, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.financeGridLabel, { color: colors.textMuted }]}>Receita Líquida EstudeMy (15%)</Text>
                <Text style={[styles.financeGridValue, { color: '#8B5CF6' }]}>
                  R$ {(extratoAdmin?.receitaLiquidaEstudeMy || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={[styles.financeGridCard, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.financeGridLabel, { color: colors.textMuted }]}>Total de Compras</Text>
                <Text style={[styles.financeGridValue, { color: colors.text }]}>
                  {extratoAdmin?.totalTransacoes || 0}
                </Text>
              </View>
            </View>

            {/* Lista de Transações */}
            <Text style={[styles.transactionsSectionTitle, { color: colors.text }]}>
              Histórico de Vendas ({extratoAdmin?.transacoes.length || 0})
            </Text>

            {!extratoAdmin?.transacoes || extratoAdmin.transacoes.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Receipt size={40} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
                  Nenhuma transação de compra registrada até o momento.
                </Text>
              </View>
            ) : (
              extratoAdmin.transacoes.map((tx) => (
                <View key={tx.id} style={[styles.transactionCard, { backgroundColor: colors.card }]}>
                  <View style={styles.transactionHeaderRow}>
                    <View style={styles.txIdBadge}>
                      <Text style={styles.txIdText}>{tx.id}</Text>
                    </View>
                    <View style={[styles.txMethodBadge, { backgroundColor: tx.metodo === 'PIX' ? '#10B981' : '#3B82F6' }]}>
                      <Text style={styles.txMethodText}>{tx.metodo}</Text>
                    </View>
                    <Text style={styles.txDateText}>
                      {new Date(tx.data).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>

                  <Text style={[styles.txTrailTitle, { color: colors.text }]}>
                    {tx.trilhaTitulo}
                  </Text>

                  <View style={styles.txDetailsGrid}>
                    <Text style={[styles.txDetailText, { color: colors.textMuted }]}>
                      Aluno(a): <Text style={{ color: colors.text, fontWeight: '700' }}>{tx.compradorNome}</Text>
                    </Text>
                    {tx.professorNome ? (
                      <Text style={[styles.txDetailText, { color: colors.textMuted }]}>
                        Professor(a): <Text style={{ color: colors.text, fontWeight: '700' }}>{tx.professorNome}</Text>
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.txSplitRow}>
                    <View style={styles.txSplitBox}>
                      <Text style={styles.txSplitLabel}>Total Pago</Text>
                      <Text style={[styles.txSplitValue, { color: colors.text }]}>
                        R$ {Number(tx.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <View style={styles.txSplitBox}>
                      <Text style={styles.txSplitLabel}>Professor (85%)</Text>
                      <Text style={[styles.txSplitValue, { color: '#10B981' }]}>
                        R$ {Number(tx.valorProfessor || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <View style={styles.txSplitBox}>
                      <Text style={styles.txSplitLabel}>EstudeMy (15%)</Text>
                      <Text style={[styles.txSplitValue, { color: '#8B5CF6' }]}>
                        R$ {Number(tx.valorEstudeMy || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal QR Code */}
      {selectedTrilhaQr && (
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => {
            setQrModalVisible(false);
            setSelectedTrilhaQr(null);
          }}
          trilhaId={selectedTrilhaQr._id}
          trilhaTitulo={selectedTrilhaQr.titulo}
          codigoAcesso={
            selectedTrilhaQr.codigoAcesso ||
            knownCodes[selectedTrilhaQr._id] ||
            'TRL-ACESSO'
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    marginBottom: 16,
  },
  backRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  backRowBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  adminBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
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
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  segmentedTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#1E293B',
  },
  segmentedTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#1b1b1b',
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  segmentedTabTextActive: {
    color: '#ffffff',
  },
  searchBarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 2,
  },
  searchInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    paddingLeft: 42,
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '700',
  },
  itemCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemMateria: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  miniBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  badgePaid: { backgroundColor: '#F59E0B' },
  badgeFree: { backgroundColor: '#10B981' },
  badgePrivate: { backgroundColor: '#8B5CF6' },
  badgePublic: { backgroundColor: '#3B82F6' },
  itemDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 10,
  },
  codeRowBox: {
    backgroundColor: '#09090B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codeRowLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  codeRowValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionBtnSmall: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  itemActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  qrBtnSmall: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  qrBtnSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  viewTrailBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  viewTrailBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteTrailBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  deleteTrailBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteMiniBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  userCardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  userActionDeleteBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  userActionDeleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  userCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 12,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '900',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1b1b1b',
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  userIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  userExpandedTrilhasBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#334155',
  },
  expandedBoxTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  noTrilhasText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  userTrilhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    marginBottom: 6,
  },
  utTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  utMeta: {
    fontSize: 11,
  },
  addMateriaCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  addMateriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addMateriaTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  addMateriaDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  feedbackBox: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 1.5,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  feedbackText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  addMateriaInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addMateriaInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  addMateriaSubmitBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMateriaSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  materiasGrid: {
    gap: 10,
  },
  materiaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    gap: 10,
  },
  materiaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materiaName: {
    fontSize: 14,
    fontWeight: '900',
  },
  materiaCount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  materiaDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    fontWeight: '700',
  },
  financeExplainerCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    marginBottom: 16,
  },
  financeExplainerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  financeExplainerTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  financeExplainerDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  financeSplitPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  financeSplitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  financeSplitPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  financeGridCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  financeGridLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  financeGridValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  transactionsSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  transactionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    marginBottom: 12,
  },
  transactionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  txIdBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  txIdText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  txMethodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  txMethodText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  txDateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  txTrailTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  txDetailsGrid: {
    marginBottom: 10,
    gap: 2,
  },
  txDetailText: {
    fontSize: 12,
  },
  txSplitRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  txSplitBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  txSplitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  txSplitValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  deniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  backHomeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});

