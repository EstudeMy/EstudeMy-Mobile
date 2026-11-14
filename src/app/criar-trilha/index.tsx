import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { criarTrilhaManual, Trilha } from '../../services/trilhaService';
import { generateAccessCode, copyToClipboard } from '../../services/trilhaAcessoService';
import { FASE_BACKGROUNDS } from '../../constants/assets';
import { QRCodeModal } from '../../components/QRCodeModal';
import { AccessibilityIcon } from '../../components/AccessibilityIcon';
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  ShieldAlert,
  Lock,
  Globe,
  DollarSign,
  Gift,
  Key,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  QrCode,
  Calendar,
  CalendarCheck,
} from 'lucide-react-native';
import { sanitizeInput } from '../../utils/security';
import asyncLock from '../../utils/asyncLock';
import logger from '../../utils/logger';

const MATERIAS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Banco de Dados',
  'Programação',
  'Inglês',
  'Física',
  'Química',
  'Biologia',
];

const SCENARIOS = [
  { id: 1, name: 'Vila', path: '/img/fases/vila.jpg', source: FASE_BACKGROUNDS.vila },
  { id: 2, name: 'Montanha', path: '/img/fases/montanha.jpg', source: FASE_BACKGROUNDS.montanha },
  { id: 3, name: 'Deserto', path: '/img/fases/deserto.jpg', source: FASE_BACKGROUNDS.deserto },
  { id: 4, name: 'Castelo', path: '/img/fases/castelo.jpg', source: FASE_BACKGROUNDS.castelo },
];

const IDIOMAS = ['Português', 'Inglês', 'Espanhol'];

export default function CriarTrilhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, openAccessibilityModal } = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [materia, setMateria] = useState(MATERIAS[0]);
  const [dificuldade, setDificuldade] = useState<'Facil' | 'Medio' | 'Dificil'>('Facil');
  const [faseSelecionada, setFaseSelecionada] = useState(2); // Montanha default
  const [cenarioPath, setCenarioPath] = useState('/img/fases/montanha.jpg');
  const [disponibilidade, setDisponibilidade] = useState<'Aberto' | 'Privado'>('Aberto');
  const [pagamento, setPagamento] = useState<'Gratuita' | 'Paga'>('Gratuita');
  const [preco, setPreco] = useState('29.90');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [createdModalVisible, setCreatedModalVisible] = useState(false);
  const [createdTrilha, setCreatedTrilha] = useState<Trilha | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [idioma, setIdioma] = useState('Português');

  // Período da Trilha: Data de Início e Data Fim (opcional)
  const todayStr = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(todayStr);
  const [dataFim, setDataFim] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerateCode = () => {
    const newCode = generateAccessCode();
    setCodigoAcesso(newCode);
    setCodeCopied(false);
  };

  const handleCopyCode = async (codeToCopy: string) => {
    await copyToClipboard(codeToCopy);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  // Verificação de permissão de acesso
  const isAuthorized =
    user?.tipoUsuario === 'PROFESSOR' ||
    user?.tipoUsuario === 'ADMINISTRADOR' ||
    user?.tipoUsuario === 'OWNER';

  if (!isAuthorized) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          },
        ]}
        edges={['top', 'bottom']}
      >
        <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Acesso Restrito</Text>
        <Text style={[styles.deniedDesc, { color: colors.textMuted }]}>
          Apenas professores e administradores têm permissão para criar e gerenciar trilhas de estudo.
        </Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.8}>
          <Text style={styles.backHomeBtnText}>Voltar para a Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCriarTrilha = async () => {
    const cleanTitulo = sanitizeInput(titulo).trim();
    const cleanDescricao = sanitizeInput(descricao).trim();
    const cleanDataInicio = sanitizeInput(dataInicio).trim();
    const cleanDataFim = sanitizeInput(dataFim).trim();

    if (!cleanTitulo || !cleanDescricao) {
      setErrorMsg('Título e descrição são obrigatórios.');
      return;
    }

    if (!cleanDataInicio) {
      setErrorMsg('A data de início da trilha é obrigatória.');
      return;
    }

    if (cleanDataFim && cleanDataFim < cleanDataInicio) {
      setErrorMsg('A data de término não pode ser anterior à data de início.');
      return;
    }

    await asyncLock.runExclusive('criar_trilha_manual', async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const precoNumerico = pagamento === 'Paga' ? parseFloat(preco.replace(',', '.')) || 0 : 0;
        const finalCodigo = disponibilidade === 'Privado' ? (codigoAcesso || generateAccessCode()) : undefined;

        const novaTrilha = await criarTrilhaManual({
          titulo: cleanTitulo,
          descricao: cleanDescricao,
          materia: sanitizeInput(materia),
          dificuldade,
          disponibilidade,
          pagamento,
          preco: precoNumerico,
          codigoAcesso: finalCodigo,
          faseSelecionada,
          imagem: cenarioPath,
          idioma,
          dataInicio: cleanDataInicio,
          dataFim: cleanDataFim || undefined,
        });

        if (disponibilidade === 'Privado' && finalCodigo) {
          setCreatedTrilha({ ...novaTrilha, codigoAcesso: finalCodigo });
          setCreatedModalVisible(true);
        } else if (novaTrilha && novaTrilha._id) {
          router.replace(`/trilha/${novaTrilha._id}`);
        } else {
          router.replace('/(tabs)/home');
        }
      } catch (err: any) {
        logger.error('Erro ao criar trilha manual');
        const msg = err.response?.data?.message || 'Erro ao salvar a trilha. Tente novamente.';
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Topo com Voltar e Acessibilidade */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
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

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <View style={styles.headerTitleRow}>
          <BookOpen size={28} color="#4F46E5" />
          <Text style={[styles.title, { color: colors.text }]}>Criar Trilha</Text>
        </View>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Monte uma jornada personalizada de aprendizado com seus próprios temas e matérias.
        </Text>
      </View>

      {errorMsg && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Formulário */}
      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Título da Trilha *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
            placeholder="Ex: Introdução à Trigonometria"
            placeholderTextColor={colors.textMuted}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Descrição da Trilha *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.cardSecondary, color: colors.text },
            ]}
            placeholder="Descreva os principais tópicos e objetivos que os alunos irão aprender..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>

        {/* Matéria */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Matéria / Disciplina</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MATERIAS.map((mat) => {
              const isSelected = materia === mat;
              return (
                <TouchableOpacity
                  key={mat}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: isSelected ? '#4F46E5' : colors.cardSecondary },
                  ]}
                  onPress={() => setMateria(mat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipBtnText, { color: isSelected ? '#ffffff' : colors.text }]}>
                    {mat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dificuldade */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nível de Dificuldade</Text>
          <View style={styles.selectorRow}>
            {(['Facil', 'Medio', 'Dificil'] as const).map((diff) => {
              const isSelected = dificuldade === diff;
              return (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    isSelected && styles.selectorBtnActive,
                  ]}
                  onPress={() => setDificuldade(diff)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectorBtnText, { color: colors.textMuted }, isSelected && styles.textActive]}>
                    {diff === 'Facil' ? 'Fácil' : diff === 'Medio' ? 'Médio' : 'Difícil'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Período da Trilha: Data de Início e Data Fim (Opcional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Período de Realização (Datas) *</Text>
          <Text style={[styles.fieldSublabel, { color: colors.textMuted }]}>
            Defina o período em que a trilha estará ativa para os alunos. A data de término é opcional.
          </Text>

          <View style={styles.dateInputsRow}>
            {/* Data de Início */}
            <View style={styles.dateInputCol}>
              <Text style={[styles.dateSublabel, { color: colors.text }]}>Data de Início *</Text>
              <View style={[styles.dateInputWrapper, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                <Calendar size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.dateTextInput, { color: colors.text }]}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={dataInicio}
                  onChangeText={setDataInicio}
                  maxLength={10}
                />
              </View>
              <Text style={[styles.dateHelperText, { color: colors.textMuted }]}>
                Início das atividades
              </Text>
            </View>

            {/* Data Fim (Opcional) */}
            <View style={styles.dateInputCol}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.dateSublabel, { color: colors.text }]}>Data Fim (Opcional)</Text>
                {dataFim ? (
                  <TouchableOpacity onPress={() => setDataFim('')} activeOpacity={0.7}>
                    <Text style={styles.clearDateBtnText}>Limpar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={[styles.dateInputWrapper, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                <CalendarCheck size={18} color={dataFim ? '#10B981' : colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.dateTextInput, { color: colors.text }]}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={dataFim}
                  onChangeText={setDataFim}
                  maxLength={10}
                />
              </View>
              <Text style={[styles.dateHelperText, { color: colors.textMuted }]}>
                {dataFim ? 'Prazo final de encerramento' : 'Opcional (sem data limite)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Cenário / Imagem de Capa */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Cenário / Imagem de Capa</Text>
          <View style={styles.scenariosGrid}>
            {SCENARIOS.map((sc) => {
              const isSelected = faseSelecionada === sc.id;
              return (
                <TouchableOpacity
                  key={sc.id}
                  style={[
                    styles.scenarioCard,
                    { borderColor: isSelected ? '#4F46E5' : '#1b1b1b' },
                    isSelected && styles.scenarioCardActive,
                  ]}
                  onPress={() => {
                    setFaseSelecionada(sc.id);
                    setCenarioPath(sc.path);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={sc.source} style={styles.scenarioImg} resizeMode="cover" />
                  <View style={[styles.scenarioLabelBadge, { backgroundColor: isSelected ? '#4F46E5' : 'rgba(0,0,0,0.7)' }]}>
                    <Text style={styles.scenarioLabelText}>{sc.name}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Modelo de Acesso: Gratuita ou Paga */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Modelo de Acesso (Gratuita ou Paga) *</Text>
          <Text style={[styles.fieldSublabel, { color: colors.textMuted }]}>
            Defina se a trilha será de acesso livre ou conteúdo pago/premium.
          </Text>
          <View style={styles.optionCardsRow}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.cardSecondary },
                pagamento === 'Gratuita' && styles.optionCardActiveGreen,
              ]}
              onPress={() => setPagamento('Gratuita')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionCardIcon, { backgroundColor: pagamento === 'Gratuita' ? '#10B981' : '#374151' }]}>
                <Gift size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionCardTitle, { color: colors.text }]}>Gratuita</Text>
                <Text style={[styles.optionCardDesc, { color: colors.textMuted }]}>
                  Livre para todos os estudantes estudarem sem custos.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.cardSecondary },
                pagamento === 'Paga' && styles.optionCardActiveGold,
              ]}
              onPress={() => setPagamento('Paga')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionCardIcon, { backgroundColor: pagamento === 'Paga' ? '#F59E0B' : '#374151' }]}>
                <DollarSign size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionCardTitle, { color: colors.text }]}>Paga</Text>
                <Text style={[styles.optionCardDesc, { color: colors.textMuted }]}>
                  Conteúdo premium com valor ou plano de acesso.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {pagamento === 'Paga' && (
            <View style={styles.priceContainer}>
              <Text style={[styles.label, { color: colors.text, fontSize: 13 }]}>Preço Sugerido (R$)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                placeholder="Ex: 29.90"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={preco}
                onChangeText={setPreco}
              />
            </View>
          )}
        </View>

        {/* Visibilidade: Aberta (Pública) ou Privada (Requer Código) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Visibilidade e Privacidade *</Text>
          <Text style={[styles.fieldSublabel, { color: colors.textMuted }]}>
            Trilhas privadas exigem um código exclusivo para que o aluno consiga acessar.
          </Text>
          <View style={styles.optionCardsRow}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.cardSecondary },
                disponibilidade === 'Aberto' && styles.optionCardActiveBlue,
              ]}
              onPress={() => setDisponibilidade('Aberto')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionCardIcon, { backgroundColor: disponibilidade === 'Aberto' ? '#3B82F6' : '#374151' }]}>
                <Globe size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionCardTitle, { color: colors.text }]}>Aberta (Pública)</Text>
                <Text style={[styles.optionCardDesc, { color: colors.textMuted }]}>
                  Disponível para qualquer aluno na Home e na busca.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.cardSecondary },
                disponibilidade === 'Privado' && styles.optionCardActivePurple,
              ]}
              onPress={() => {
                setDisponibilidade('Privado');
                if (!codigoAcesso) {
                  setCodigoAcesso(generateAccessCode());
                }
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.optionCardIcon, { backgroundColor: disponibilidade === 'Privado' ? '#8B5CF6' : '#374151' }]}>
                <Lock size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionCardTitle, { color: colors.text }]}>Privada (Requer Código)</Text>
                <Text style={[styles.optionCardDesc, { color: colors.textMuted }]}>
                  Bloqueada. Alunos precisam digitar o código gerado.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Caixa de Código de Acesso Exclusivo para o Professor */}
          {disponibilidade === 'Privado' && (
            <View style={styles.codeGeneratedCard}>
              <View style={styles.codeHeaderRow}>
                <Key size={20} color="#F59E0B" />
                <Text style={styles.codeCardTitle}>Código de Acesso Exclusivo</Text>
              </View>
              <Text style={styles.codeCardDesc}>
                Este é o código exclusivo gerado para sua turma. Somente alunos que inserirem este código poderão desbloquear e cursar esta trilha.
              </Text>

              <View style={styles.codeDisplayBox}>
                <Text style={styles.codeDisplayText}>{codigoAcesso || 'GERANDO...'}</Text>
              </View>

              <View style={styles.codeActionsRow}>
                <TouchableOpacity
                  style={[styles.codeActionBtn, styles.copyBtn]}
                  onPress={() => handleCopyCode(codigoAcesso)}
                  activeOpacity={0.85}
                >
                  {codeCopied ? (
                    <>
                      <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.codeActionBtnText}>Código Copiado!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.codeActionBtnText}>Copiar Código</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.codeActionBtn, styles.qrBtn]}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <QrCode size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.codeActionBtnText}>Ver QR Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.codeActionBtn, styles.regenerateBtn]}
                  onPress={handleRegenerateCode}
                  activeOpacity={0.85}
                >
                  <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.codeActionBtnText}>Gerar Outro</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Idioma */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Idioma da Trilha</Text>
          <View style={styles.selectorRow}>
            {IDIOMAS.map((lang) => {
              const isSelected = idioma === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    isSelected && styles.selectorBtnActive,
                  ]}
                  onPress={() => setIdioma(lang)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectorBtnText, { color: colors.textMuted }, isSelected && styles.textActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botão de Criação */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCriarTrilha}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <PlusCircle size={22} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Criar e Salvar Trilha</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Modal de Sucesso pós-criação para Trilha Privada */}
    <Modal
      visible={createdModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setCreatedModalVisible(false);
        if (createdTrilha?._id) router.replace(`/trilha/${createdTrilha._id}`);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.successModalCard, { backgroundColor: colors.card }]}>
          <View style={styles.successIconBubble}>
            <Sparkles size={36} color="#ffffff" />
          </View>
          <Text style={[styles.successModalTitle, { color: colors.text }]}>Trilha Privada Criada!</Text>
          <Text style={[styles.successModalDesc, { color: colors.textMuted }]}>
            Sua trilha foi configurada com sucesso. Copie o código abaixo e compartilhe com seus alunos para que eles possam desbloqueá-la:
          </Text>

          <View style={styles.modalCodeBox}>
            <Text style={styles.modalCodeText}>{createdTrilha?.codigoAcesso || codigoAcesso}</Text>
          </View>

          <TouchableOpacity
            style={styles.modalCopyBtn}
            onPress={() => handleCopyCode(createdTrilha?.codigoAcesso || codigoAcesso)}
            activeOpacity={0.85}
          >
            {codeCopied ? (
              <>
                <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.modalCopyBtnText}>Código Copiado!</Text>
              </>
            ) : (
              <>
                <Copy size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.modalCopyBtnText}>Copiar Código de Acesso</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalQrBtn}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.85}
          >
            <QrCode size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.modalQrBtnText}>Ver QR Code da Trilha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalProceedBtn}
            onPress={() => {
              setCreatedModalVisible(false);
              if (createdTrilha?._id) {
                router.replace(`/trilha/${createdTrilha._id}`);
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.modalProceedBtnText}>Acessar Trilha Agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Modal para Visualização do QR Code da Trilha */}
    <QRCodeModal
      visible={qrModalVisible}
      onClose={() => setQrModalVisible(false)}
      trilha={createdTrilha || ({ _id: 'preview', titulo: titulo || 'Nova Trilha', materia } as any)}
      codigoAcesso={createdTrilha?.codigoAcesso || codigoAcesso}
    />
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backBtn: {
    backgroundColor: '#1b1b1b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  accessibilityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13,
  },
  formCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBtnActive: {
    backgroundColor: '#CA8A04',
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  textActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateInputCol: {
    flex: 1,
    minWidth: 140,
  },
  dateSublabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2.5,
    paddingHorizontal: 12,
    height: 46,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    height: '100%',
  },
  dateHelperText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  clearDateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  scenarioCard: {
    width: '48%',
    height: 100,
    borderRadius: 10,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  scenarioCardActive: {
    borderWidth: 3.5,
  },
  scenarioImg: {
    width: '100%',
    height: '100%',
  },
  scenarioLabelBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scenarioLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  submitBtn: {
    backgroundColor: '#16A34A', // green-600
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  deniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backHomeBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  backHomeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  fieldSublabel: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  optionCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  optionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionCardActiveGreen: {
    borderColor: '#10B981',
    borderWidth: 2.5,
    backgroundColor: '#064E3B25',
  },
  optionCardActiveGold: {
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    backgroundColor: '#78350F25',
  },
  optionCardActiveBlue: {
    borderColor: '#3B82F6',
    borderWidth: 2.5,
    backgroundColor: '#1E3A8A25',
  },
  optionCardActivePurple: {
    borderColor: '#8B5CF6',
    borderWidth: 2.5,
    backgroundColor: '#5B21B625',
  },
  optionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  optionCardDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  priceContainer: {
    marginTop: 8,
  },
  codeGeneratedCard: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    padding: 14,
    marginTop: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  codeCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F59E0B',
  },
  codeCardDesc: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
    marginBottom: 12,
  },
  codeDisplayBox: {
    backgroundColor: '#09090B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  codeDisplayText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  copyBtn: {
    backgroundColor: '#4F46E5',
  },
  qrBtn: {
    backgroundColor: '#8B5CF6',
  },
  regenerateBtn: {
    backgroundColor: '#27272A',
  },
  codeActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  successIconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalCodeBox: {
    backgroundColor: '#09090B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  modalCodeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalCopyBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 10,
  },
  modalCopyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalQrBtn: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 10,
  },
  modalQrBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalProceedBtn: {
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  modalProceedBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
