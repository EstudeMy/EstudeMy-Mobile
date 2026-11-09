import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Trilha, listarMinhasTrilhas } from '../../services/trilhaService';
import {
  copyToClipboard,
  getAllKnownTrailCodes,
  getOrGenerateTrailAccessCode,
} from '../../services/trilhaAcessoService';
import { obterExtratoProfessor } from '../../services/pagamentoService';
import { getTrackImage } from '../../constants/assets';
import QRCodeModal from '../../components/QRCodeModal';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  Search,
  Lock,
  Globe,
  DollarSign,
  Key,
  Copy,
  Check,
  QrCode,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';

export default function MinhasTrilhasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'privadas' | 'abertas'>('todas');

  const [knownCodes, setKnownCodes] = useState<Record<string, string>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal de QR Code
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTrilhaForQr, setSelectedTrilhaForQr] = useState<Trilha | null>(null);

  // Extrato Financeiro de Vendas (85% Professor / 15% EstudeMy)
  const [extrato, setExtrato] = useState<{
    totalVendas: number;
    receitaBruta: number;
    saldoProfessor: number;
    taxaEstudeMy: number;
  } | null>(null);

  const isTeacherOrStaff =
    user?.tipoUsuario === 'PROFESSOR' ||
    user?.tipoUsuario === 'ADMINISTRADOR' ||
    user?.tipoUsuario === 'OWNER';

  const loadData = useCallback(async () => {
    if (!user) return;
    const userId = user._id || user.id || '';
    try {
      const [list, codes, extratoData] = await Promise.all([
        listarMinhasTrilhas(userId),
        getAllKnownTrailCodes(),
        obterExtratoProfessor(userId),
      ]);

      // Garante que cada trilha tenha seu próprio código exclusivo mapeado
      const updatedCodes = { ...codes };
      for (const t of list) {
        if (!updatedCodes[t._id]) {
          const uniqueCode = await getOrGenerateTrailAccessCode(t._id, t.codigoAcesso);
          updatedCodes[t._id] = uniqueCode;
        }
      }

      setTrilhas(list);
      setKnownCodes(updatedCodes);
      setExtrato(extratoData);
    } catch (err) {
      console.error('Erro ao carregar minhas trilhas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (active) {
        await loadData();
      }
    })();
    return () => {
      active = false;
    };
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopyCode = async (trilhaId: string, code: string) => {
    await copyToClipboard(code);
    setCopiedCodeId(trilhaId);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2500);
  };

  const handleOpenQr = (trilha: Trilha) => {
    setSelectedTrilhaForQr(trilha);
    setQrModalVisible(true);
  };

  const filteredTrilhas = useMemo(() => {
    return trilhas.filter((item) => {
      const matchSearch =
        searchQuery.trim().length === 0 ||
        item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materia.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.descricao && item.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

      const isPrivate =
        item.disponibilidade === 'Privado' ||
        Boolean(item.codigoAcesso) ||
        Boolean(knownCodes[item._id]);

      if (!matchSearch) return false;
      if (filtroTipo === 'privadas') return isPrivate;
      if (filtroTipo === 'abertas') return !isPrivate;
      return true;
    });
  }, [trilhas, searchQuery, filtroTipo, knownCodes]);

  const stats = useMemo(() => {
    const total = trilhas.length;
    let privadas = 0;
    let pagas = 0;
    trilhas.forEach((t) => {
      if (t.disponibilidade === 'Privado' || t.codigoAcesso || knownCodes[t._id]) privadas++;
      if (t.pagamento === 'Paga' || (t.preco && Number(t.preco) > 0)) pagas++;
    });
    return { total, privadas, abertas: total - privadas, pagas, gratuitas: total - pagas };
  }, [trilhas, knownCodes]);

  if (!isTeacherOrStaff) {
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
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Área Exclusiva de Professores</Text>
        <Text style={[styles.deniedDesc, { color: colors.textMuted }]}>
          Esta aba é restrita aos professores da plataforma para acompanhamento e gestão das trilhas pedagógicas criadas.
        </Text>
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => router.replace('/(tabs)/home')}
          activeOpacity={0.85}
        >
          <Text style={styles.backHomeBtnText}>Ir para a Home</Text>
        </TouchableOpacity>
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
        {/* Header da Aba do Professor */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerIconBox}>
              <BookOpen size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('myTrails.title') || 'Minhas Trilhas 📚'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {t('myTrails.subtitle') || 'Gerencie suas jornadas pedagógicas, códigos e QR Codes'}
              </Text>
            </View>
          </View>

          {/* Cards de Resumo / Métricas */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t('myTrails.totalCreated') || 'Total Criadas'}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{stats.privadas}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t('myTrails.private') || 'Privadas 🔒'}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.abertas}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t('myTrails.public') || 'Abertas 🌐'}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pagas}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t('myTrails.paid') || 'Pagas 💰'}
              </Text>
            </View>
          </View>

          {/* Botões de Ação para Criar Trilha */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.createManualBtn}
              onPress={() => router.push('/criar-trilha' as any)}
              activeOpacity={0.85}
            >
              <PlusCircle size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.createBtnText}>
                {t('myTrails.createManual') || 'Criar Manual ✍️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createAiBtn}
              onPress={() => router.push('/consultai' as any)}
              activeOpacity={0.85}
            >
              <Sparkles size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.createBtnText}>
                {t('myTrails.consultAi') || 'ConsultAi IA 🤖'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card de Faturamento e Repasses do Professor (85% Professor / 15% EstudeMy) */}
        <View style={[styles.financeCard, { backgroundColor: colors.card }]}>
          <View style={styles.financeHeaderRow}>
            <View style={styles.financeIconWrap}>
              <Wallet size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.financeTitle, { color: colors.text }]}>
                {t('myTrails.salesBalance') || 'Extrato de Vendas & Saldo 💰'}
              </Text>
              <Text style={[styles.financeSubtitle, { color: colors.textMuted }]}>
                {t('myTrails.salesSub') || 'Você recebe 85% do valor total de cada compra das suas trilhas'}
              </Text>
            </View>
            <View style={styles.splitPill}>
              <Text style={styles.splitPillText}>85% / 15%</Text>
            </View>
          </View>

          <View style={styles.financeValuesGrid}>
            <View style={[styles.financeValueBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.financeValueLabel, { color: colors.textMuted }]}>
                {t('myTrails.netBalance') || 'Seu Saldo Líquido (85%)'}
              </Text>
              <Text style={[styles.financeValueAmount, { color: '#10B981' }]}>
                R$ {(extrato?.saldoProfessor || 0).toFixed(2).replace('.', ',')}
              </Text>
            </View>
            <View style={[styles.financeValueBox, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.financeValueLabel, { color: colors.textMuted }]}>
                {t('myTrails.totalSales') || 'Total de Vendas'}
              </Text>
              <Text style={[styles.financeValueAmount, { color: '#3B82F6' }]}>
                {extrato?.totalVendas || 0}
              </Text>
            </View>
          </View>

          <View style={styles.financeSubRow}>
            <Text style={[styles.financeSubText, { color: colors.textMuted }]}>
              Bruto: R$ {(extrato?.receitaBruta || 0).toFixed(2).replace('.', ',')} • Taxa EstudeMy (15%): R$ {(extrato?.taxaEstudeMy || 0).toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchBarWrap}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t('myTrails.searchPlaceholder') || 'Pesquisar em minhas trilhas...'}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Filtros em Pílula */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filtroTipo === 'todas' && styles.filterPillActive]}
            onPress={() => setFiltroTipo('todas')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filtroTipo === 'todas' && styles.filterPillTextActive]}>
              Todas ({stats.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filtroTipo === 'privadas' && styles.filterPillActive]}
            onPress={() => setFiltroTipo('privadas')}
            activeOpacity={0.8}
          >
            <Lock size={12} color={filtroTipo === 'privadas' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, filtroTipo === 'privadas' && styles.filterPillTextActive]}>
              Privadas ({stats.privadas})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filtroTipo === 'abertas' && styles.filterPillActive]}
            onPress={() => setFiltroTipo('abertas')}
            activeOpacity={0.8}
          >
            <Globe size={12} color={filtroTipo === 'abertas' ? '#ffffff' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, filtroTipo === 'abertas' && styles.filterPillTextActive]}>
              Abertas ({stats.abertas})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Trilhas do Professor */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando suas trilhas...
            </Text>
          </View>
        ) : filteredTrilhas.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <BookOpen size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery.trim()
                ? 'Nenhuma trilha encontrada para essa busca.'
                : 'Você ainda não possui trilhas criadas.'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Crie uma trilha manual personalizada ou gere uma com IA pela ConsultAi.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => router.push('/criar-trilha' as any)}
              activeOpacity={0.85}
            >
              <PlusCircle size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyActionBtnText}>Criar Minha Primeira Trilha</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTrilhas.map((item) => {
            const isPrivate =
              item.disponibilidade === 'Privado' ||
              Boolean(item.codigoAcesso) ||
              Boolean(knownCodes[item._id]);
            const isPaid = item.pagamento === 'Paga' || Boolean(item.preco && Number(item.preco) > 0);
            const accessCode =
              item.codigoAcesso || knownCodes[item._id] || 'TRL-GERANDO';
            const trackImage = getTrackImage(item);

            return (
              <View key={item._id} style={[styles.trailCard, { backgroundColor: colors.card }]}>
                {/* Imagem de Capa com Badges */}
                <View style={styles.trailImageWrap}>
                  <Image source={trackImage} style={styles.trailImage} resizeMode="cover" />

                  {/* Badges Flutuantes */}
                  <View style={styles.floatingBadgesRow}>
                    <View style={[styles.badgePill, isPaid ? styles.badgePaid : styles.badgeFree]}>
                      {isPaid ? <DollarSign size={11} color="#ffffff" style={{ marginRight: 2 }} /> : null}
                      <Text style={styles.badgePillText}>
                        {isPaid
                          ? `R$ ${Number(item.preco || 29.9).toFixed(2).replace('.', ',')}`
                          : 'Gratuita'}
                      </Text>
                    </View>

                    <View style={[styles.badgePill, isPrivate ? styles.badgePrivate : styles.badgePublic]}>
                      {isPrivate ? (
                        <>
                          <Lock size={11} color="#ffffff" style={{ marginRight: 3 }} />
                          <Text style={styles.badgePillText}>Privada</Text>
                        </>
                      ) : (
                        <>
                          <Globe size={11} color="#ffffff" style={{ marginRight: 3 }} />
                          <Text style={styles.badgePillText}>Aberta</Text>
                        </>
                      )}
                    </View>

                    <View style={[styles.badgePill, styles.badgeDiff]}>
                      <Text style={styles.badgePillText}>{item.dificuldade || item.nivelDificuldade || 'Fácil'}</Text>
                    </View>
                  </View>
                </View>

                {/* Conteúdo do Card */}
                <View style={styles.trailCardBody}>
                  <Text style={[styles.trailMateria, { color: '#38BDF8' }]}>
                    {item.materia.toUpperCase()} • {item.idioma || 'Português'}
                  </Text>
                  <Text style={[styles.trailTitle, { color: colors.text }]}>{item.titulo}</Text>
                  {item.descricao ? (
                    <Text style={[styles.trailDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                      {item.descricao}
                    </Text>
                  ) : null}

                  {/* Detalhe de Repasse se a Trilha for Paga */}
                  {isPaid && (
                    <View style={styles.trailSplitBadge}>
                      <TrendingUp size={14} color="#10B981" />
                      <Text style={styles.trailSplitBadgeText}>
                        Preço: R$ {Number(item.preco || 0).toFixed(2).replace('.', ',')} • Ganho Líquido (85%):{' '}
                        <Text style={{ fontWeight: '900', color: '#10B981' }}>
                          R$ {(Number(item.preco || 0) * 0.85).toFixed(2).replace('.', ',')}
                        </Text>
                      </Text>
                    </View>
                  )}

                  {/* Se for privada: Caixa do Código Exclusivo ÚNICO */}
                  {isPrivate && (
                    <View style={styles.privateCodeSection}>
                      <View style={styles.privateCodeHeader}>
                        <Key size={14} color="#F59E0B" />
                        <Text style={styles.privateCodeLabel}>
                          {t('myTrails.accessCode') || 'CÓDIGO DE ACESSO EXCLUSIVO DESTA TRILHA:'}
                        </Text>
                      </View>
                      <View style={styles.privateCodeDashedBox}>
                        <Text style={styles.privateCodeText}>{accessCode}</Text>
                      </View>

                      <View style={styles.codeButtonsRow}>
                        <TouchableOpacity
                          style={styles.copyCodeBtn}
                          onPress={() => handleCopyCode(item._id, accessCode)}
                          activeOpacity={0.85}
                        >
                          {copiedCodeId === item._id ? (
                            <>
                              <Check size={14} color="#ffffff" style={{ marginRight: 6 }} />
                              <Text style={styles.copyCodeBtnText}>
                                {t('myTrails.copied') || 'Copiado!'}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Copy size={14} color="#ffffff" style={{ marginRight: 6 }} />
                              <Text style={styles.copyCodeBtnText}>
                                {t('myTrails.copyCode') || 'Copiar Código'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.qrCodeBtn}
                          onPress={() => handleOpenQr(item)}
                          activeOpacity={0.85}
                        >
                          <QrCode size={14} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.qrCodeBtnText}>
                            {t('myTrails.viewQr') || 'Ver QR Code 📱'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Botões de Ação na Trilha */}
                  <View style={styles.cardFooterActions}>
                    <TouchableOpacity
                      style={styles.openTrailBtn}
                      onPress={() => router.push(`/trilha/${item._id}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.openTrailBtnText}>
                        {t('myTrails.accessTrail') || 'Acessar Trilha'}
                      </Text>
                      <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Exibição do QR Code da Trilha */}
      {selectedTrilhaForQr && (
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => {
            setQrModalVisible(false);
            setSelectedTrilhaForQr(null);
          }}
          trilhaId={selectedTrilhaForQr._id}
          trilhaTitulo={selectedTrilhaForQr.titulo}
          codigoAcesso={
            selectedTrilhaForQr.codigoAcesso ||
            knownCodes[selectedTrilhaForQr._id] ||
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
    marginBottom: 20,
  },
  financeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 20,
  },
  financeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  financeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  financeTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  financeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  splitPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  splitPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  financeValuesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  financeValueBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  financeValueLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  financeValueAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  financeSubRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  financeSubText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trailSplitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginTop: 8,
    marginBottom: 4,
  },
  trailSplitBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  createManualBtn: {
    flex: 1,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  createAiBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  searchBarWrap: {
    position: 'relative',
    marginBottom: 12,
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
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    backgroundColor: '#27272A',
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#1b1b1b',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A1A1AA',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  trailCard: {
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  trailImageWrap: {
    height: 150,
    width: '100%',
    position: 'relative',
    borderBottomWidth: 3,
    borderBottomColor: '#1b1b1b',
  },
  trailImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  badgeFree: {
    backgroundColor: '#10B981',
  },
  badgePaid: {
    backgroundColor: '#F59E0B',
  },
  badgePrivate: {
    backgroundColor: '#8B5CF6',
  },
  badgePublic: {
    backgroundColor: '#3B82F6',
  },
  badgeDiff: {
    backgroundColor: '#475569',
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  trailCardBody: {
    padding: 16,
  },
  trailMateria: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  trailTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  trailDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  privateCodeSection: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 14,
  },
  privateCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  privateCodeLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  privateCodeDashedBox: {
    backgroundColor: '#030712',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  privateCodeText: {
    color: '#FCD34D',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  copyCodeBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  copyCodeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  qrCodeBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  qrCodeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  cardFooterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  openTrailBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  openTrailBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
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

