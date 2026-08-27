import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { Sparkles, Brain, ArrowLeft, PlusCircle } from 'lucide-react-native';

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

export default function ConsultAiScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();


  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [dificuldade, setDificuldade] = useState<'Facil' | 'Medio' | 'Dificil'>('Facil');
  const [secoesNum, setSecoesNum] = useState('2');
  const [fasesNum, setFasesNum] = useState('2');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<SugestaoTrilha | null>(null);

  const handleGerarTrilha = async () => {
    if (!materia || !tema) {
      setErrorMsg('Preencha a matéria e o tema/objetivo de estudo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSugestao(null);

    try {
      const response = await api.post('/api/trilhas/gerar-com-ia', {
        materia: materia.trim(),
        temaOuObjetivo: tema.trim(),
        dificuldade,
        numeroSecoes: parseInt(secoesNum) || 2,
        fasesPorSecao: parseInt(fasesNum) || 2,
        perguntasPorFase: 3,
      });

      if (response.data && response.data.trilha) {
        setSugestao(response.data);
      } else {
        setErrorMsg('Resposta inesperada da IA. Tente novamente.');
      }
    } catch (e: any) {
      console.error('Erro ao gerar trilha com IA:', e);
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
      // 1. Criar trilha principal no backend
      const trilhaRes = await api.post('/api/trilhas', {
        titulo: sugestao.trilha.titulo,
        materia: sugestao.trilha.materia,
        descricao: sugestao.trilha.descricao,
        nivelDificuldade: sugestao.trilha.dificuldade,
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

      // 3. Auto-iniciar a trilha recém-criada
      await api.post(`/api/trilhas/iniciar/${newTrilhaId}`);

      // Redireciona diretamente para a nova trilha!
      router.replace(`/trilha/${newTrilhaId}`);

    } catch (e: any) {
      console.error('Erro ao salvar trilha no banco:', e);
      setErrorMsg('Falha ao persistir a trilha no banco de dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Voltar */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <View style={styles.headerTitleRow}>
          <Brain size={28} color="#818CF8" />
          <Text style={[styles.title, { color: colors.text }]}>Consult.Ai 🤖</Text>
        </View>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          Crie trilhas completas de aprendizado gamificado com o poder da Inteligência Artificial.
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
            <Text style={[styles.label, { color: colors.text }]}>Matéria (Ex: História, Geografia, Química)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
              placeholder="Digite a matéria básica"
              placeholderTextColor={colors.textMuted}
              value={materia}
              onChangeText={setMateria}
            />
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
              placeholder="Ex: Revolução Francesa, focado na Queda da Bastilha e Declaração dos Direitos"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={tema}
              onChangeText={setTema}
            />
          </View>

          {/* Dificuldade */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Dificuldade</Text>
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
                  <Text style={[styles.selectorBtnText, { color: colors.textMuted }, dificuldade === diff && styles.textActive]}>
                    {diff === 'Facil' ? 'Fácil' : diff === 'Medio' ? 'Médio' : 'Difícil'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
                <Text style={[styles.badgeText, { color: colors.primary }]}>{sugestao.trilha.dificuldade}</Text>
              </View>
            </View>
          </View>

          {/* Estrutura de Seções Geradas */}
          <Text style={[styles.structureTitle, { color: colors.text }]}>Estrutura da Trilha Gerada</Text>
          {sugestao.secoes.map((sec, sIdx) => (
            <View key={sIdx} style={[styles.secaoCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.secaoName, { color: colors.text }]}>
                Seção {sec.ordem}: {sec.titulo}
              </Text>
              {sec.fases.map((fase, fIdx) => (
                <View key={fIdx} style={styles.faseItem}>
                  <Text style={[styles.faseName, { color: colors.text }]}>
                    Fase {fase.ordem}: {fase.titulo}
                  </Text>
                  <Text style={[styles.faseQuestions, { color: colors.textMuted }]}>
                    ({fase.perguntas.length} perguntas de quiz geradas)
                  </Text>
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
                <Text style={styles.saveBtnText}>Salvar e Começar a Jogar!</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  backBtn: {
    backgroundColor: '#1b1b1b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  desc: {
    fontSize: 13,
    color: '#9CA3AF',
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
    color: '#ffffff',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  inputDark: {
    backgroundColor: '#1E1E2F',
    color: '#ffffff',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    color: '#1b1b1b',
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
  },
  selectorBtnActive: {
    backgroundColor: '#4F46E5', // indigo-600
  },
  selectorBtnText: {
    color: '#9CA3AF',
    fontWeight: '800',
  },
  textActive: {
    color: '#ffffff',
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
    color: '#ffffff',
    textAlign: 'center',
  },
  resultDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#1E1E2F',
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#A5B4FC',
    fontWeight: '800',
    fontSize: 11,
  },
  structureTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
  },
  secaoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  secaoName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  faseItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingLeft: 10,
    marginVertical: 4,
  },
  faseName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  faseQuestions: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#16A34A', // green-600
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
    fontWeight: '800',
    fontSize: 14,
  },
});
