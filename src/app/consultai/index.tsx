import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Sparkles,
  Brain,
  ArrowLeft,
  PlusCircle,
  Plus,
  Trash2,
  ShieldAlert,
  Lock,
  Globe,
  DollarSign,
  Gift,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react-native';
import { obterMaterias } from '../../services/materiaService';
import {
  generateAccessCode,
  saveTrailAccessCode,
  copyToClipboard,
} from '../../services/trilhaAcessoService';
import { QRCodeModal } from '../../components/QRCodeModal';
import { AccessibilityIcon } from '../../components/AccessibilityIcon';
import { logger } from '../../utils/logger';
import { gerarFaseComIA } from '../../services/aiPhaseGeneratorService';

interface SugestaoTrilha {
  trilha: {
    titulo: string;
    descricao: string;
    materia: string;
    dificuldade: string;
  };
  secoes: {
    titulo: string;
    descricao: string;
    ordem: number;
    fases: {
      titulo: string;
      descricao: string;
      ordem: number;
      conteudo: string;
      perguntas: {
        enunciado: string;
        alternativas: string[];
        respostaCorreta: string;
      }[];
    }[];
  }[];
}

const IDIOMAS = ['Português', 'Inglês', 'Espanhol'];

export default function ConsultAiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, openAccessibilityModal } = useTheme();

  // Dados básicos
  const [materiasList, setMateriasList] = useState<string[]>([]);
  const [materia, setMateria] = useState('');
  const [materiaCustom, setMateriaCustom] = useState('');
  const [tema, setTema] = useState('');
  const [dificuldade, setDificuldade] = useState<'Facil' | 'Medio' | 'Dificil'>('Facil');
  const [secoesNum, setSecoesNum] = useState('2');
  const [fasesNum, setFasesNum] = useState('2');
  const [idioma, setIdioma] = useState('Português');

  // Novo padrão de disponibilidade & pagamento
  const [disponibilidade, setDisponibilidade] = useState<'Aberto' | 'Privado'>('Aberto');
  const [pagamento, setPagamento] = useState<'Gratuita' | 'Paga'>('Gratuita');
  const [preco, setPreco] = useState('29.90');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Estados de loading e pós-criação
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<SugestaoTrilha | null>(null);

  // Modais
  const [createdModalVisible, setCreatedModalVisible] = useState(false);
  const [createdTrilha, setCreatedTrilha] = useState<{ _id: string; titulo: string; codigoAcesso: string } | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Estados de Criação de Fases com IA
  const [modalFaseIaVisible, setModalFaseIaVisible] = useState(false);
  const [targetSecaoIdx, setTargetSecaoIdx] = useState<number | null>(null);
  const [faseIaTema, setFaseIaTema] = useState('');
  const [faseIaQtdPerguntas, setFaseIaQtdPerguntas] = useState('3');
  const [generatingFase, setGeneratingFase] = useState(false);

  // Carrega lista de matérias dinâmicas
  useEffect(() => {
    let isMounted = true;
    obterMaterias().then((list) => {
      if (isMounted && list.length > 0) {
        setMateriasList(list);
        setMateria(list[0]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
            paddingHorizontal: 24,
          },
        ]}
        edges={['top', 'bottom']}
      >
        <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Acesso Restrito</Text>
        <Text style={[styles.deniedDesc, { color: colors.textMuted }]}>
          Apenas professores e administradores têm permissão para gerar trilhas com a Consult.Ai.
        </Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.8}>
          <Text style={styles.backHomeBtnText}>Voltar para a Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSelectDisponibilidade = (disp: 'Aberto' | 'Privado') => {
    setDisponibilidade(disp);
    if (disp === 'Privado' && !codigoAcesso) {
      setCodigoAcesso(generateAccessCode());
    }
  };

  const handleRegenerateCode = () => {
    const newCode = generateAccessCode();
    setCodigoAcesso(newCode);
    setCodeCopied(false);
  };

  const handleCopyCode = async (codeToCopy: string) => {
    await copyToClipboard(codeToCopy);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const materiaFinal = materia === 'Outra' ? materiaCustom.trim() : materia.trim();

  const handleGerarTrilha = async () => {
    if (!materiaFinal || !tema.trim()) {
      setErrorMsg('Preencha a matéria e o tema/objetivo de estudo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSugestao(null);

    try {
      const response = await api.post('/api/trilhas/gerar-com-ia', {
        materia: materiaFinal,
        temaOuObjetivo: tema.trim(),
        dificuldade,
        numeroSecoes: parseInt(secoesNum, 10) || 2,
        fasesPorSecao: parseInt(fasesNum, 10) || 2,
        perguntasPorFase: 3,
        idioma,
      });

      if (response.data && response.data.trilha) {
        setSugestao(response.data);
      } else {
        setErrorMsg('Resposta inesperada da IA. Tente novamente.');
      }
    } catch (e: any) {
      logger.error('Erro ao gerar trilha com IA:', e);
      setErrorMsg(e.response?.data?.message || 'Erro ao comunicar com a IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarTrilha = async () => {
    if (!sugestao) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const precoNumerico = pagamento === 'Paga' ? parseFloat(preco.replace(',', '.')) || 0 : 0;
      const finalCodigo = disponibilidade === 'Privado' ? (codigoAcesso || generateAccessCode()) : undefined;

      // 1. Criar trilha principal no backend
      const trilhaRes = await api.post('/api/trilhas', {
        titulo: sugestao.trilha.titulo,
        materia: sugestao.trilha.materia || materiaFinal,
        descricao: sugestao.trilha.descricao,
        nivelDificuldade: sugestao.trilha.dificuldade || dificuldade,
        disponibilidade,
        pagamento,
        preco: precoNumerico,
        codigoAcesso: finalCodigo,
        idioma,
      });

      const newTrilhaId = trilhaRes.data._id;
      if (!newTrilhaId) {
        throw new Error('ID da trilha recém-criada não retornado.');
      }

      // 2. Criar seções e fases correspondentes no backend
      for (const sec of sugestao.secoes) {
        const secaoRes = await api.post('/api/secoes', {
          trilhaId: newTrilhaId,
          titulo: sec.titulo,
          descricao: sec.descricao || '',
          ordem: sec.ordem,
        });

        const newSecaoId = secaoRes.data._id || secaoRes.data.secao?._id;

        for (const fase of sec.fases) {
          await api.post('/api/fases', {
            trilhaId: newTrilhaId,
            secaoId: newSecaoId,
            titulo: fase.titulo,
            descricao: fase.descricao || '',
            conteudo: fase.conteudo || '',
            ordem: fase.ordem,
            perguntas: fase.perguntas,
          });
        }
      }

      // 3. Salvar código exclusivo caso seja trilha privada
      if (disponibilidade === 'Privado' && finalCodigo) {
        await saveTrailAccessCode(newTrilhaId, finalCodigo);
        setCreatedTrilha({
          _id: newTrilhaId,
          titulo: sugestao.trilha.titulo,
          codigoAcesso: finalCodigo,
        });
        setCreatedModalVisible(true);
      } else {
        // Redireciona diretamente para a nova trilha!
        router.replace(`/trilha/${newTrilhaId}`);
      }
    } catch (e: any) {
      logger.error('Erro ao salvar trilha no banco:', e);
      setErrorMsg('Falha ao persistir a trilha no banco de dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddFaseModal = (secaoIdx: number) => {
    setTargetSecaoIdx(secaoIdx);
    setFaseIaTema('');
    setFaseIaQtdPerguntas('3');
    setModalFaseIaVisible(true);
  };

  const handleGerarFaseParaSecao = async () => {
    if (targetSecaoIdx === null || !sugestao) return;
    if (!faseIaTema.trim()) {
      setErrorMsg('Informe o tema ou assunto da nova fase.');
      return;
    }
    setGeneratingFase(true);
    setErrorMsg(null);
    try {
      const targetSec = sugestao.secoes[targetSecaoIdx];
      const novaOrdem = targetSec.fases.length + 1;
      const novaFase = await gerarFaseComIA({
        materia: sugestao.trilha.materia || materiaFinal,
        temaOuFoco: faseIaTema.trim(),
        dificuldade: (sugestao.trilha.dificuldade as any) || dificuldade,
        ordem: novaOrdem,
        quantidadePerguntas: parseInt(faseIaQtdPerguntas, 10) || 3,
        idioma,
      });

      const novasSecoes = [...sugestao.secoes];
      novasSecoes[targetSecaoIdx] = {
        ...targetSec,
        fases: [...targetSec.fases, novaFase],
      };
      setSugestao({ ...sugestao, secoes: novasSecoes });
      setModalFaseIaVisible(false);
    } catch (err: any) {
      logger.error('Erro ao gerar fase avulsa com IA:', err);
      setErrorMsg('Falha ao gerar a fase com IA. Tente novamente.');
    } finally {
      setGeneratingFase(false);
    }
  };

  const handleRefazerFaseComIA = async (secaoIdx: number, faseIdx: number) => {
    if (!sugestao) return;
    const targetFase = sugestao.secoes[secaoIdx].fases[faseIdx];
    setGeneratingFase(true);
    setErrorMsg(null);
    try {
      const faseRegenerada = await gerarFaseComIA({
        materia: sugestao.trilha.materia || materiaFinal,
        temaOuFoco: targetFase.titulo,
        dificuldade: (sugestao.trilha.dificuldade as any) || dificuldade,
        ordem: targetFase.ordem,
        quantidadePerguntas: targetFase.perguntas?.length || 3,
        idioma,
      });
      const novasSecoes = [...sugestao.secoes];
      const novasFases = [...novasSecoes[secaoIdx].fases];
      novasFases[faseIdx] = faseRegenerada;
      novasSecoes[secaoIdx] = { ...novasSecoes[secaoIdx], fases: novasFases };
      setSugestao({ ...sugestao, secoes: novasSecoes });
    } catch (e) {
      logger.error('Erro ao refazer fase:', e);
      setErrorMsg('Não foi possível refazer a fase neste momento.');
    } finally {
      setGeneratingFase(false);
    }
  };

  const handleRemoverFase = (secaoIdx: number, faseIdx: number) => {
    if (!sugestao) return;
    const novasSecoes = [...sugestao.secoes];
    const targetSec = novasSecoes[secaoIdx];
    const filtradas = targetSec.fases.filter((_, idx) => idx !== faseIdx).map((f, i) => ({ ...f, ordem: i + 1 }));
    novasSecoes[secaoIdx] = { ...targetSec, fases: filtradas };
    setSugestao({ ...sugestao, secoes: novasSecoes });
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
            <Brain size={28} color="#818CF8" />
            <Text style={[styles.title, { color: colors.text }]}>Consult.Ai</Text>
          </View>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            Gere trilhas de estudo completas com quiz integrado usando IA e configure o novo padrão de acesso.
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Form de Geração */}
        {!sugestao ? (
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Parâmetros da Trilha</Text>

            {/* Matéria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Matéria de Estudo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {materiasList.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.materiaChip,
                        { backgroundColor: colors.cardSecondary },
                        materia === m && styles.materiaChipActive,
                      ]}
                      onPress={() => setMateria(m)}
                    >
                      <Text
                        style={[
                          styles.materiaChipText,
                          { color: colors.textMuted },
                          materia === m && styles.materiaChipTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.materiaChip,
                      { backgroundColor: colors.cardSecondary },
                      materia === 'Outra' && styles.materiaChipActive,
                    ]}
                    onPress={() => setMateria('Outra')}
                  >
                    <Text
                      style={[
                        styles.materiaChipText,
                        { color: colors.textMuted },
                        materia === 'Outra' && styles.materiaChipTextActive,
                      ]}
                    >
                      + Outra
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {materia === 'Outra' && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text, marginTop: 4 }]}
                  placeholder="Digite o nome da matéria"
                  placeholderTextColor={colors.textMuted}
                  value={materiaCustom}
                  onChangeText={setMateriaCustom}
                />
              )}
            </View>

            {/* Tema / Objetivo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tema de Estudo ou Objetivo Específico</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.cardSecondary, color: colors.text },
                ]}
                placeholder="Ex: Revolução Francesa com foco na Queda da Bastilha e Iluminismo"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={tema}
                onChangeText={setTema}
              />
            </View>

            {/* Dificuldade */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nível de Dificuldade</Text>
              <View style={styles.selectorRow}>
                {['Facil', 'Medio', 'Dificil'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.selectorBtn,
                      { backgroundColor: colors.cardSecondary },
                      dificuldade === diff && styles.selectorBtnActive,
                    ]}
                    onPress={() => setDificuldade(diff as any)}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        { color: colors.textMuted },
                        dificuldade === diff && styles.textActive,
                      ]}
                    >
                      {diff === 'Facil' ? 'Fácil' : diff === 'Medio' ? 'Médio' : 'Difícil'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Idioma */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Idioma da Trilha</Text>
              <View style={styles.selectorRow}>
                {IDIOMAS.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.selectorBtn,
                      { backgroundColor: colors.cardSecondary },
                      idioma === lang && styles.selectorBtnActive,
                    ]}
                    onPress={() => setIdioma(lang)}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        { color: colors.textMuted },
                        idioma === lang && styles.textActive,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Disponibilidade: Aberto vs Privado */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Disponibilidade da Trilha</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    disponibilidade === 'Aberto' && styles.selectorBtnActiveGreen,
                  ]}
                  onPress={() => handleSelectDisponibilidade('Aberto')}
                >
                  <Globe
                    size={16}
                    color={disponibilidade === 'Aberto' ? '#ffffff' : colors.textMuted}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: colors.textMuted },
                      disponibilidade === 'Aberto' && styles.textActive,
                    ]}
                  >
                    Aberta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    disponibilidade === 'Privado' && styles.selectorBtnActivePurple,
                  ]}
                  onPress={() => handleSelectDisponibilidade('Privado')}
                >
                  <Lock
                    size={16}
                    color={disponibilidade === 'Privado' ? '#ffffff' : colors.textMuted}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: colors.textMuted },
                      disponibilidade === 'Privado' && styles.textActive,
                    ]}
                  >
                    Privada (Código)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Código Exclusivo Gerado para Trilha Privada */}
            {disponibilidade === 'Privado' && (
              <View style={[styles.codeBox, { backgroundColor: colors.cardSecondary }]}>
                <View style={styles.codeHeader}>
                  <Lock size={16} color="#818CF8" />
                  <Text style={[styles.codeLabel, { color: colors.text }]}>Código Único de Acesso</Text>
                </View>
                <Text style={styles.codeHint}>
                  Os alunos precisarão digitar este código exclusivo ou escanear o QR Code para acessar.
                </Text>
                <View style={styles.codeActionRow}>
                  <Text style={[styles.codeDisplay, { color: colors.text }]}>{codigoAcesso || '---'}</Text>
                  <TouchableOpacity
                    style={[styles.miniBtn, codeCopied && styles.miniBtnSuccess]}
                    onPress={() => handleCopyCode(codigoAcesso)}
                  >
                    {codeCopied ? (
                      <Check size={16} color="#ffffff" />
                    ) : (
                      <Copy size={16} color="#ffffff" />
                    )}
                    <Text style={styles.miniBtnText}>{codeCopied ? 'Copiado!' : 'Copiar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.miniBtnOutline} onPress={handleRegenerateCode}>
                    <RefreshCw size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Pagamento: Gratuita vs Paga */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Acesso Financeiro</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    pagamento === 'Gratuita' && styles.selectorBtnActiveGreen,
                  ]}
                  onPress={() => setPagamento('Gratuita')}
                >
                  <Gift
                    size={16}
                    color={pagamento === 'Gratuita' ? '#ffffff' : colors.textMuted}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: colors.textMuted },
                      pagamento === 'Gratuita' && styles.textActive,
                    ]}
                  >
                    Gratuita
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: colors.cardSecondary },
                    pagamento === 'Paga' && styles.selectorBtnActiveAmber,
                  ]}
                  onPress={() => setPagamento('Paga')}
                >
                  <DollarSign
                    size={16}
                    color={pagamento === 'Paga' ? '#ffffff' : colors.textMuted}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: colors.textMuted },
                      pagamento === 'Paga' && styles.textActive,
                    ]}
                  >
                    Paga (R$)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preço (se paga) */}
            {pagamento === 'Paga' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Preço da Trilha (R$)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="Ex: 29.90"
                  placeholderTextColor={colors.textMuted}
                  value={preco}
                  onChangeText={setPreco}
                />
              </View>
            )}

            {/* Estrutura */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Nº Seções</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                  keyboardType="number-pad"
                  value={secoesNum}
                  onChangeText={setSecoesNum}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Fases / Seção</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                  keyboardType="number-pad"
                  value={fasesNum}
                  onChangeText={setFasesNum}
                />
              </View>
            </View>

            {/* Botão Gerar */}
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGerarTrilha}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Sparkles size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.generateBtnText}>Gerar Trilha com IA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Resultado da Geração */
          <View style={styles.resultContainer}>
            <View style={[styles.resultHeaderCard, { backgroundColor: colors.card }]}>
              <Sparkles size={32} color="#F59E0B" />
              <Text style={[styles.resultTitle, { color: colors.text }]}>{sugestao.trilha.titulo}</Text>
              <Text style={[styles.resultDesc, { color: colors.textMuted }]}>{sugestao.trilha.descricao}</Text>

              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colors.cardSecondary }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{sugestao.trilha.materia}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.cardSecondary }]}>
                  <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{sugestao.trilha.dificuldade}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.cardSecondary }]}>
                  <Text style={[styles.badgeText, { color: '#10B981' }]}>{idioma}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: disponibilidade === 'Privado' ? '#8B5CF6' : '#10B981' },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: '#ffffff' }]}>{disponibilidade}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: pagamento === 'Paga' ? '#F59E0B' : '#16A34A' },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: '#ffffff' }]}>
                    {pagamento === 'Paga' ? `R$ ${preco}` : 'Gratuita'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Estrutura de Seções Geradas */}
            <Text style={[styles.structureTitle, { color: colors.text }]}>Estrutura da Trilha Gerada</Text>
            {sugestao.secoes.map((sec, sIdx) => (
              <View key={sIdx} style={[styles.secaoCard, { backgroundColor: colors.card, marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.secaoName, { color: colors.text, marginBottom: 0, flex: 1 }]}>
                    Seção {sec.ordem}: {sec.titulo}
                  </Text>
                  <TouchableOpacity
                    style={[styles.addFaseBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleOpenAddFaseModal(sIdx)}
                  >
                    <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.addFaseBtnText}>+ Fase com IA</Text>
                  </TouchableOpacity>
                </View>
                {sec.fases.map((fase, fIdx) => (
                  <View key={fIdx} style={styles.faseItemRow}>
                    <View style={styles.faseItem}>
                      <Text style={[styles.faseName, { color: colors.text }]}>
                        Fase {fase.ordem}: {fase.titulo}
                      </Text>
                      <Text style={[styles.faseQuestions, { color: colors.textMuted }]}>
                        ({fase.perguntas.length} perguntas de quiz geradas)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.faseMiniAction, { backgroundColor: colors.cardSecondary }]}
                        onPress={() => handleRefazerFaseComIA(sIdx, fIdx)}
                        accessibilityLabel="Refazer com IA"
                      >
                        <RefreshCw size={14} color="#818CF8" />
                      </TouchableOpacity>
                      {sec.fases.length > 1 && (
                        <TouchableOpacity
                          style={[styles.faseMiniAction, { backgroundColor: colors.cardSecondary }]}
                          onPress={() => handleRemoverFase(sIdx, fIdx)}
                          accessibilityLabel="Remover Fase"
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Botões de Ação para Salvar */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSalvarTrilha}
              disabled={saving}
              activeOpacity={0.9}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <PlusCircle size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Salvar Trilha</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSugestao(null)}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Descartar e Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal de Sucesso com Código e QR Code para Trilha Privada */}
      <Modal
        visible={createdModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreatedModalVisible(false);
          if (createdTrilha) router.replace(`/trilha/${createdTrilha._id}`);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.createdCard, { backgroundColor: colors.card }]}>
            <View style={styles.createdIconBadge}>
              <Sparkles size={36} color="#ffffff" />
            </View>

            <Text style={[styles.createdTitle, { color: colors.text }]}>Trilha Criada com Sucesso!</Text>
            <Text style={[styles.createdSubtitle, { color: colors.textMuted }]}>
              {createdTrilha?.titulo}
            </Text>

            {createdTrilha?.codigoAcesso && (
              <View style={[styles.createdCodeContainer, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.createdCodeLabel, { color: colors.textMuted }]}>
                  CÓDIGO EXCLUSIVO DA TRILHA
                </Text>
                <Text style={[styles.createdCodeValue, { color: colors.text }]}>
                  {createdTrilha.codigoAcesso}
                </Text>
                <TouchableOpacity
                  style={[styles.createdCopyBtn, codeCopied && styles.createdCopyBtnSuccess]}
                  onPress={() => handleCopyCode(createdTrilha.codigoAcesso)}
                >
                  {codeCopied ? (
                    <>
                      <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.createdCopyBtnText}>Copiado com Sucesso!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.createdCopyBtnText}>Copiar Código para Alunos</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.createdActionButtons}>
              <TouchableOpacity
                style={styles.qrCodeBtn}
                onPress={() => setQrModalVisible(true)}
              >
                <QrCode size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.qrCodeBtnText}>Visualizar QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.goToTrailBtn}
                onPress={() => {
                  setCreatedModalVisible(false);
                  if (createdTrilha) router.replace(`/trilha/${createdTrilha._id}`);
                }}
              >
                <Eye size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.goToTrailBtnText}>Acessar Trilha Agora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Gerar Fase com IA */}
      <Modal
        visible={modalFaseIaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!generatingFase) setModalFaseIaVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.createdCard, { backgroundColor: colors.card, maxWidth: 440 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={24} color="#818CF8" />
                <Text style={[styles.formTitle, { color: colors.text, marginBottom: 0 }]}>
                  Gerar Fase com IA
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalFaseIaVisible(false)}
                disabled={generatingFase}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
              A Inteligência Artificial criará a explicação teórica e perguntas de quiz personalizadas para este tema.
            </Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.label, { color: colors.text }]}>Tema ou Assunto da Fase</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                placeholder="Ex: Teorema de Pitágoras, Funções Afins..."
                placeholderTextColor={colors.textMuted}
                value={faseIaTema}
                onChangeText={setFaseIaTema}
                editable={!generatingFase}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: colors.text }]}>Quantidade de Perguntas</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['2', '3', '4', '5'].map((qtd) => (
                  <TouchableOpacity
                    key={qtd}
                    style={[
                      styles.materiaChip,
                      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSecondary },
                      faseIaQtdPerguntas === qtd && styles.materiaChipActive,
                    ]}
                    onPress={() => setFaseIaQtdPerguntas(qtd)}
                    disabled={generatingFase}
                  >
                    <Text
                      style={[
                        styles.materiaChipText,
                        { color: colors.textMuted },
                        faseIaQtdPerguntas === qtd && styles.materiaChipTextActive,
                      ]}
                    >
                      {qtd}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setModalFaseIaVisible(false)}
                disabled={generatingFase}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1.5, marginTop: 0, backgroundColor: colors.primary }]}
                onPress={handleGerarFaseParaSecao}
                disabled={generatingFase}
              >
                {generatingFase ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Gerar Fase</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de QR Code */}
      {createdTrilha && (
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          trilhaId={createdTrilha._id}
          trilhaTitulo={createdTrilha.titulo}
          codigoAcesso={createdTrilha.codigoAcesso}
        />
      )}
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
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  desc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
  },
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  materiaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  materiaChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#1b1b1b',
  },
  materiaChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  materiaChipTextActive: {
    color: '#ffffff',
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBtnActive: {
    backgroundColor: '#4F46E5',
  },
  selectorBtnActiveGreen: {
    backgroundColor: '#16A34A',
  },
  selectorBtnActivePurple: {
    backgroundColor: '#8B5CF6',
  },
  selectorBtnActiveAmber: {
    backgroundColor: '#F59E0B',
  },
  selectorBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  textActive: {
    color: '#ffffff',
  },
  codeBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  codeHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 10,
    fontWeight: '600',
  },
  codeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeDisplay: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  miniBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  miniBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  miniBtnOutline: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  generateBtn: {
    backgroundColor: '#4F46E5',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  generateBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  resultContainer: {
    gap: 16,
  },
  resultHeaderCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#F59E0B',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 11,
  },
  structureTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  secaoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  secaoName: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  addFaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  addFaseBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  faseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  faseItem: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingLeft: 10,
  },
  faseMiniAction: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
  },
  faseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  faseQuestions: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createdCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    alignItems: 'center',
  },
  createdIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  createdTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  createdSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  createdCodeContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    marginBottom: 18,
  },
  createdCodeLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  createdCodeValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 12,
  },
  createdCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    width: '100%',
  },
  createdCopyBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  createdCopyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  createdActionButtons: {
    width: '100%',
    gap: 10,
  },
  qrCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  qrCodeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  goToTrailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  goToTrailBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
