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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { criarTrilhaManual } from '../../services/trilhaService';
import { FASE_BACKGROUNDS } from '../../constants/assets';
import { ArrowLeft, BookOpen, PlusCircle, ShieldAlert } from 'lucide-react-native';
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
  const { colors } = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [materia, setMateria] = useState(MATERIAS[0]);
  const [dificuldade, setDificuldade] = useState<'Facil' | 'Medio' | 'Dificil'>('Facil');
  const [faseSelecionada, setFaseSelecionada] = useState(2); // Montanha default
  const [cenarioPath, setCenarioPath] = useState('/img/fases/montanha.jpg');
  const [disponibilidade] = useState<'Aberto' | 'Privado'>('Aberto');
  const [pagamento] = useState<'Gratuita' | 'Paga'>('Gratuita');
  const [idioma, setIdioma] = useState('Português');


  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    if (!cleanTitulo || !cleanDescricao) {
      setErrorMsg('Título e descrição são obrigatórios.');
      return;
    }

    await asyncLock.runExclusive('criar_trilha_manual', async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const novaTrilha = await criarTrilhaManual({
          titulo: cleanTitulo,
          descricao: cleanDescricao,
          materia: sanitizeInput(materia),
          dificuldade,
          disponibilidade,
          pagamento,
          faseSelecionada,
          imagem: cenarioPath,
          idioma,
        });

        if (novaTrilha && novaTrilha._id) {
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
        {/* Botão Voltar */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <View style={styles.headerTitleRow}>
          <BookOpen size={28} color="#4F46E5" />
          <Text style={[styles.title, { color: colors.text }]}>Criar Trilha ✍️</Text>
        </View>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
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
});
