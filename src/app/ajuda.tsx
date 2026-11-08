import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Star,
  ShieldCheck,
  Search,
  Sparkles,
  Trophy,
  BookOpen,
  Lock,
} from 'lucide-react-native';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'gamificacao' | 'ia' | 'conta';
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    category: 'geral',
    question: 'O que é a plataforma EstudeMy?',
    answer:
      'O EstudeMy é um ambiente de aprendizado gamificado e inteligente. Aqui você estuda disciplinas e habilidades através de trilhas pedagógicas compostas por conteúdos interativos, vídeos e quizzes desafiadores.',
  },
  {
    id: '2',
    category: 'gamificacao',
    question: 'Como ganho pontos (XP), moedas e vidas?',
    answer:
      'Você ganha XP sempre que completa uma fase, responde quizzes corretamente e mantém a sua sequência diária de estudos (ofensiva). O XP acumulado te coloca no topo do Ranking Semanal! Fases de revisão não consomem vidas.',
  },
  {
    id: '3',
    category: 'ia',
    question: 'Como funciona a criação de Trilhas com IA?',
    answer:
      'No menu "Criar Trilha" ou "Consulta IA", você pode digitar qualquer assunto que deseja aprender (ex: "Python do Zero", "Física para o ENEM", "Revolução Francesa"). Nossa Inteligência Artificial monta na hora uma trilha personalizada com fases, explicações e exercícios!',
  },
  {
    id: '4',
    category: 'conta',
    question: 'Como recuperar ou alterar minha senha?',
    answer:
      'Na tela inicial de login, você pode clicar em "Esqueci minha senha" para receber o link de redefinição no seu e-mail cadastrado. Se já estiver logado, acesse seu Perfil para alterar seus dados.',
  },
  {
    id: '5',
    category: 'geral',
    question: 'Onde encontro minhas Lições Salvas?',
    answer:
      'Na aba "Mais", selecione a opção "Lições Salvas". Lá você encontra todas as fases e conteúdos teóricos que você favoritou para estudar e revisar offline.',
  },
  {
    id: '6',
    category: 'conta',
    question: 'Meus dados estão seguros no EstudeMy?',
    answer:
      'Sim! O EstudeMy segue rigorosamente a Lei Geral de Proteção de Dados (LGPD). Suas senhas são criptografadas com Bcrypt e salt individual, as conexões usam TLS 1.3 / HTTPS e seus dados nunca são compartilhados com terceiros.',
  },
  {
    id: '7',
    category: 'gamificacao',
    question: 'Como funciona o Ranking das Ligas?',
    answer:
      'O ranking é atualizado em tempo real com base no XP que você conquista. Os alunos mais dedicados sobem de divisão ao final de cada ciclo semanal e ganham medalhas exclusivas no perfil.',
  },
  {
    id: '8',
    category: 'geral',
    question: 'O que fazer se uma fase travar ou der erro?',
    answer:
      'Verifique se sua conexão com a internet está estável. Caso o erro persista, você pode enviar um relatório pelo menu "Enviar Feedback" ou falar diretamente conosco pelo "Fale Conosco".',
  },
];

export default function AjudaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [busca, setBusca] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const faqsFiltrados = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(busca.toLowerCase()) ||
      item.answer.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
        paddingBottom: Math.max(insets.bottom + 24, 24),
      }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Central de Ajuda 💡</Text>
        <View style={{ width: 26 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Tire suas dúvidas frequentes e encontre suporte para seus estudos
      </Text>

      {/* Barra de Busca */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar dúvida ou assunto..."
          placeholderTextColor={colors.textMuted}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Cartões Rápidos de Ação */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#4F46E5', borderColor: '#1b1b1b' }]}
          onPress={() => router.push('/configuracoes' as any)}
          activeOpacity={0.85}
        >
          <MessageSquare size={22} color="#ffffff" />
          <Text style={styles.quickCardTitle}>Fale Conosco</Text>
          <Text style={styles.quickCardSubtitle}>Mande uma mensagem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#F59E0B', borderColor: '#1b1b1b' }]}
          onPress={() => router.push('/configuracoes' as any)}
          activeOpacity={0.85}
        >
          <Star size={22} color="#ffffff" />
          <Text style={styles.quickCardTitle}>Feedback</Text>
          <Text style={styles.quickCardSubtitle}>Avalie a plataforma</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#10B981', borderColor: '#1b1b1b' }]}
          onPress={() => router.push('/seguranca-privacidade' as any)}
          activeOpacity={0.85}
        >
          <ShieldCheck size={22} color="#ffffff" />
          <Text style={styles.quickCardTitle}>Segurança</Text>
          <Text style={styles.quickCardSubtitle}>Proteção & LGPD</Text>
        </TouchableOpacity>
      </View>

      {/* Seção FAQ */}
      <View style={styles.faqSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Perguntas Frequentes (FAQ)</Text>

        {faqsFiltrados.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
            <HelpCircle size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Nenhuma dúvida encontrada para &quot;{busca}&quot;.
            </Text>
          </View>
        ) : (
          faqsFiltrados.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View
                key={faq.id}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.card, borderColor: '#1b1b1b' },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <View style={styles.divider} />
                    <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Contato Direto */}
      <View style={[styles.supportFooter, { backgroundColor: isDark ? '#1E1E2F' : '#EEF2FF', borderColor: '#4F46E5' }]}>
        <Text style={[styles.supportTitle, { color: '#4F46E5' }]}>Ainda precisa de ajuda?</Text>
        <Text style={[styles.supportText, { color: colors.text }]}>
          Nossa equipe de suporte pedagógico e técnico responde em até 24 horas úteis.
        </Text>
        <Text style={[styles.supportEmail, { color: colors.textMuted }]}>
          E-mail: <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>suporte@estudemy.com</Text>
        </Text>
      </View>
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
    marginBottom: 8,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 3,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  quickCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  quickCardSubtitle: {
    color: '#ffffff90',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 3,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    lineHeight: 20,
  },
  faqBody: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB30',
    marginBottom: 10,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyBox: {
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportFooter: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  supportText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  supportEmail: {
    fontSize: 13,
    marginTop: 4,
  },
});
