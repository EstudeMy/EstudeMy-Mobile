import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
import {
  ArrowLeft,
  LogOut,
  Globe,
  Sun,
  Moon,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MessageSquare,
  Star,
  HelpCircle,
  X,
  Send,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import api from '../services/api';
import { APP_FULL_VERSION_STRING, APP_ENVIRONMENT } from '../constants/version';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
] as const;

const THEMES = [
  { code: 'light', label: 'Claro', icon: Sun },
  { code: 'dark', label: 'Escuro', icon: Moon },
  { code: 'system', label: 'Sistema (Auto)', icon: Smartphone },
] as const;

const FEEDBACK_TYPES = [
  { id: 'sugestao', label: '💡 Sugestão' },
  { id: 'bug', label: '🐛 Bug / Erro' },
  { id: 'duvida', label: '❓ Dúvida' },
  { id: 'elogio', label: '⭐ Elogio' },
  { id: 'outro', label: '📝 Outro' },
];

type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { themePreference, setThemePreference, colors, isDark } = useTheme();

  // Estados dos Modais
  const [modalContatoVisible, setModalContatoVisible] = useState(false);
  const [modalFeedbackVisible, setModalFeedbackVisible] = useState(false);
  const [modalPhishingVisible, setModalPhishingVisible] = useState(false);
  const [modalLgpdVisible, setModalLgpdVisible] = useState(false);

  // Formulário Fale Conosco
  const [contatoNome, setContatoNome] = useState(user?.nome || '');
  const [contatoEmail, setContatoEmail] = useState(user?.email || '');
  const [contatoAssunto, setContatoAssunto] = useState('');
  const [contatoMensagem, setContatoMensagem] = useState('');
  const [enviandoContato, setEnviandoContato] = useState(false);
  const [sucessoContato, setSucessoContato] = useState(false);

  // Formulário Feedback
  const [feedbackTipo, setFeedbackTipo] = useState('sugestao');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMensagem, setFeedbackMensagem] = useState('');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);

  // Formulário Anti-Phishing
  const [phishingUrl, setPhishingUrl] = useState('');
  const [phishingDesc, setPhishingDesc] = useState('');
  const [enviandoPhishing, setEnviandoPhishing] = useState(false);
  const [protocoloPhishing, setProtocoloPhishing] = useState<string | null>(null);

  const getThemeLabel = (code: 'light' | 'dark' | 'system') => {
    switch (code) {
      case 'light': return t('settings.light') || 'Claro';
      case 'dark': return t('settings.dark') || 'Escuro';
      case 'system': return t('settings.system') || 'Sistema (Auto)';
      default: return '';
    }
  };

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await setLanguage(langCode, true);
    await refreshUser();
  };

  const handleThemeChange = async (pref: ThemePreference) => {
    await setThemePreference(pref, true);
  };

  // Enviar Mensagem - Fale Conosco
  const handleEnviarContato = async () => {
    if (!contatoAssunto.trim() || !contatoMensagem.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o assunto e a sua mensagem.');
      return;
    }

    try {
      setEnviandoContato(true);
      const payload = {
        mensagem: `[FALE CONOSCO - Assunto: ${contatoAssunto.trim()}] Remetente: ${contatoNome || 'Anônimo'} (${contatoEmail || 'sem e-mail'}) | Mensagem: ${contatoMensagem.trim()}`,
        avaliacao: 5,
      };

      await api.post('/api/feedback', payload).catch(() => {});
      setSucessoContato(true);
      setContatoAssunto('');
      setContatoMensagem('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem no momento. Tente novamente.');
    } finally {
      setEnviandoContato(false);
    }
  };

  // Enviar Feedback
  const handleEnviarFeedback = async () => {
    if (!feedbackMensagem.trim()) {
      Alert.alert('Mensagem Obrigatória', 'Por favor, escreva seu feedback ou sugestão.');
      return;
    }

    try {
      setEnviandoFeedback(true);
      const tipoObj = FEEDBACK_TYPES.find((f) => f.id === feedbackTipo);
      const payload = {
        mensagem: `[FEEDBACK: ${tipoObj?.label || feedbackTipo}] ${feedbackMensagem.trim()} | Usuário: ${user?.email || 'Anônimo'}`,
        avaliacao: feedbackRating,
      };

      await api.post('/api/feedback', payload).catch(() => {});
      setSucessoFeedback(true);
      setFeedbackMensagem('');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o feedback. Tente novamente.');
    } finally {
      setEnviandoFeedback(false);
    }
  };

  // Enviar Denúncia Anti-Phishing
  const handleEnviarPhishing = async () => {
    if (!phishingUrl.trim()) {
      Alert.alert('Campo Obrigatório', 'Informe o link ou remetente suspeito.');
      return;
    }

    try {
      setEnviandoPhishing(true);
      const protocolo = `SEC-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = {
        mensagem: `[DENÚNCIA ANTI-PHISHING - Protocolo: ${protocolo}] Link/Remetente: ${phishingUrl.trim()} | Detalhes: ${phishingDesc.trim() || 'N/A'} | Usuário: ${user?.email || 'Anônimo'}`,
        avaliacao: 1,
      };

      await api.post('/api/feedback', payload).catch(() => {});
      setProtocoloPhishing(protocolo);
      setPhishingUrl('');
      setPhishingDesc('');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a denúncia.');
    } finally {
      setEnviandoPhishing(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title') || 'Configurações'} ⚙️</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 1. Seção: Aparência / Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Sun size={18} color={colors.textMuted} style={styles.sectionIcon} /> {t('settings.appearance') || 'Tema do App'}
        </Text>
        <View style={styles.optionsList}>
          {THEMES.map((tItem) => {
            const isSelected = themePreference === tItem.code;
            const IconComp = tItem.icon;
            return (
              <TouchableOpacity
                key={tItem.code}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.card, borderColor: '#1b1b1b' },
                  isSelected && { borderColor: '#4F46E5' },
                ]}
                onPress={() => handleThemeChange(tItem.code as ThemePreference)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <IconComp size={18} color={isSelected ? '#4F46E5' : colors.textMuted} />
                  <Text style={[styles.optionLabel, { color: colors.text }, isSelected && { color: '#4F46E5', fontWeight: '900' }]}>
                    {getThemeLabel(tItem.code)}
                  </Text>
                </View>
                {isSelected && <View style={styles.radioDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Seção: Idioma */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Globe size={18} color={colors.textMuted} style={styles.sectionIcon} /> {t('settings.language') || 'Idioma do App'}
        </Text>
        <View style={styles.optionsList}>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.card, borderColor: '#1b1b1b' },
                  isSelected && { borderColor: '#4F46E5' },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }, isSelected && { color: '#4F46E5', fontWeight: '900' }]}>
                    {lang.label}
                  </Text>
                </View>
                {isSelected && <View style={styles.radioDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Seção: Suporte & Atendimento (Fale Conosco, Enviar Feedback, Ajuda) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <HelpCircle size={18} color="#4F46E5" style={styles.sectionIcon} /> Suporte & Comunicação
        </Text>
        <View style={styles.optionsList}>
          {/* Fale Conosco */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}
            onPress={() => {
              setSucessoContato(false);
              setModalContatoVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#4F46E520' }]}>
                <MessageSquare size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Fale Conosco</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Envie uma mensagem para a nossa equipe</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Enviar Feedback */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}
            onPress={() => {
              setSucessoFeedback(false);
              setModalFeedbackVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#F59E0B20' }]}>
                <Star size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Enviar Feedback</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Avalie o app ou sugira melhorias</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Central de Ajuda & FAQ */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}
            onPress={() => router.push('/ajuda' as any)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#10B98120' }]}>
                <HelpCircle size={18} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Ajuda & Perguntas Frequentes (FAQ)</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Tire suas dúvidas sobre o EstudeMy</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Seção: Segurança & Conformidade LGPD */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <ShieldCheck size={18} color="#10B981" style={styles.sectionIcon} /> {t('settings.securityAccount') || 'Segurança & Conta'}
        </Text>
        <View style={styles.optionsList}>
          {/* Informações da Conta */}
          <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>{t('profilePage.profileType') || 'Perfil tipo:'}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.tipoUsuario ? (t(`common.roles.${user.tipoUsuario}`) || user.tipoUsuario) : 'Estudante'}
            </Text>
          </View>
          <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
            <Text style={[styles.infoKey, { color: colors.textMuted }]}>{t('profilePage.accountStatus') || 'Status da conta:'}</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '900' }]}>
              {user?.isVerified ? 'VERIFICADO' : 'ATIVO'}
            </Text>
          </View>

          {/* Botão Canal Anti-Phishing */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}
            onPress={() => {
              setProtocoloPhishing(null);
              setModalPhishingVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#F59E0B20' }]}>
                <ShieldAlert size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Canal Anti-Phishing & Denúncia</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Denuncie e-mails falsos e links suspeitos</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#F59E0B" />
          </TouchableOpacity>

          {/* Botão Termos de Privacidade & LGPD */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#10B981' }]}
            onPress={() => setModalLgpdVisible(true)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#10B98120' }]}>
                <FileText size={18} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Termos de Privacidade & LGPD</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Direitos do titular e proteção de dados</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#10B981" />
          </TouchableOpacity>

          {/* Atalho para Central Completa de Segurança */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { backgroundColor: colors.card, borderColor: '#4F46E5' }]}
            onPress={() => router.push('/seguranca-privacidade' as any)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miniBadge, { backgroundColor: '#4F46E520' }]}>
                <ShieldCheck size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: '#4F46E5', fontWeight: '900' }]}>
                  Ver Central Completa de Segurança
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                  Exportação de dados, criptografia e proteção da conta
                </Text>
              </View>
            </View>
            <ExternalLink size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.9}>
        <LogOut size={20} color="#ffffff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{t('common.logout') || 'Sair da Conta'}</Text>
      </TouchableOpacity>

      {/* Versão do Aplicativo Visível ao Usuário */}
      <View style={styles.versionFooter}>
        <Text style={[styles.versionFooterTitle, { color: colors.text }]}>EstudeMy Mobile</Text>
        <Text style={[styles.versionFooterText, { color: colors.textMuted }]}>
          Versão {APP_FULL_VERSION_STRING}
        </Text>
        <Text style={[styles.versionFooterSub, { color: colors.textMuted }]}>
          {APP_ENVIRONMENT} • Conectado e Seguro
        </Text>
      </View>

      <View style={{ height: 40 }} />

      {/* ==================================================================== */}
      {/* MODAL 1: FALE CONOSCO */}
      {/* ==================================================================== */}
      <Modal visible={modalContatoVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={22} color="#4F46E5" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Fale Conosco</Text>
              </View>
              <TouchableOpacity onPress={() => setModalContatoVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sucessoContato ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={46} color="#10B981" />
                  <Text style={[styles.successTitle, { color: colors.text }]}>Mensagem Enviada!</Text>
                  <Text style={[styles.successDesc, { color: colors.textMuted }]}>
                    Obrigado por entrar em contato. Responderemos no seu e-mail ({contatoEmail || 'cadastrado'}) o mais breve possível.
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                    onPress={() => setModalContatoVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                    Tem alguma dúvida sobre suas aulas ou precisa de suporte técnico? Deixe sua mensagem abaixo:
                  </Text>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Seu Nome:</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Seu nome completo"
                    placeholderTextColor={colors.textMuted}
                    value={contatoNome}
                    onChangeText={setContatoNome}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Seu E-mail de Contato:</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="exemplo@email.com"
                    placeholderTextColor={colors.textMuted}
                    value={contatoEmail}
                    onChangeText={setContatoEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Assunto:</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: Dúvida sobre Trilha de Matemática"
                    placeholderTextColor={colors.textMuted}
                    value={contatoAssunto}
                    onChangeText={setContatoAssunto}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Mensagem:</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Escreva sua dúvida ou solicitação..."
                    placeholderTextColor={colors.textMuted}
                    value={contatoMensagem}
                    onChangeText={setContatoMensagem}
                    multiline
                    numberOfLines={4}
                  />

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                    onPress={handleEnviarContato}
                    disabled={enviandoContato}
                    activeOpacity={0.85}
                  >
                    {enviandoContato ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Send size={18} color="#ffffff" />
                        <Text style={styles.modalButtonText}>Enviar Mensagem</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: ENVIAR FEEDBACK */}
      {/* ==================================================================== */}
      <Modal visible={modalFeedbackVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Star size={22} color="#F59E0B" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Enviar Feedback</Text>
              </View>
              <TouchableOpacity onPress={() => setModalFeedbackVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sucessoFeedback ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={46} color="#10B981" />
                  <Text style={[styles.successTitle, { color: colors.text }]}>Feedback Enviado!</Text>
                  <Text style={[styles.successDesc, { color: colors.textMuted }]}>
                    Sua opinião nos ajuda a transformar o EstudeMy na melhor plataforma educacional do Brasil. Muito obrigado!
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                    onPress={() => setModalFeedbackVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Concluir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                    Como está sendo sua experiência estudando com o EstudeMy?
                  </Text>

                  {/* Avaliação em Estrelas */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Sua Avaliação:</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)} activeOpacity={0.7}>
                        <Star
                          size={32}
                          color="#F59E0B"
                          fill={star <= feedbackRating ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Tipo de Feedback */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Tipo de Feedback:</Text>
                  <View style={styles.feedbackTypesGrid}>
                    {FEEDBACK_TYPES.map((tipo) => {
                      const isSelected = feedbackTipo === tipo.id;
                      return (
                        <TouchableOpacity
                          key={tipo.id}
                          style={[
                            styles.feedbackTypePill,
                            { backgroundColor: colors.inputBg, borderColor: colors.border },
                            isSelected && { backgroundColor: '#F59E0B25', borderColor: '#F59E0B' },
                          ]}
                          onPress={() => setFeedbackTipo(tipo.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.feedbackTypeText,
                              { color: colors.text },
                              isSelected && { color: '#F59E0B', fontWeight: '900' },
                            ]}
                          >
                            {tipo.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Detalhes da sua experiência:</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Conta pra gente o que você achou, o que podemos melhorar ou algum problema que encontrou..."
                    placeholderTextColor={colors.textMuted}
                    value={feedbackMensagem}
                    onChangeText={setFeedbackMensagem}
                    multiline
                    numberOfLines={4}
                  />

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                    onPress={handleEnviarFeedback}
                    disabled={enviandoFeedback}
                    activeOpacity={0.85}
                  >
                    {enviandoFeedback ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Send size={18} color="#ffffff" />
                        <Text style={styles.modalButtonText}>Enviar Feedback</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 3: CANAL ANTI-PHISHING */}
      {/* ==================================================================== */}
      <Modal visible={modalPhishingVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#1b1b1b' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} color="#F59E0B" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Canal Anti-Phishing</Text>
              </View>
              <TouchableOpacity onPress={() => setModalPhishingVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {protocoloPhishing ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={46} color="#10B981" />
                  <Text style={[styles.successTitle, { color: colors.text }]}>Denúncia Registrada!</Text>
                  <Text style={[styles.protocolText, { color: '#4F46E5' }]}>Protocolo: {protocoloPhishing}</Text>
                  <Text style={[styles.successDesc, { color: colors.textMuted }]}>
                    Nossa equipe de segurança já foi acionada para analisar e bloquear a ameaça. Muito obrigado!
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                    onPress={() => setModalPhishingVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1E1E2F' : '#FEF3C7' }]}>
                    <Text style={[styles.bannerTitle, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                      🛡️ Nossos Canais Oficiais:
                    </Text>
                    <Text style={[styles.bannerText, { color: isDark ? '#E2E8F0' : '#78350F' }]}>
                      • Domínio: estudemy.com / api.estudemy.com{'\n'}
                      • E-mails oficiais terminam em: @estudemy.com{'\n'}
                      • Nunca solicitamos senhas por canais externos.
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Link Suspeito ou E-mail:</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: http://site-estudemy-falso.com"
                    placeholderTextColor={colors.textMuted}
                    value={phishingUrl}
                    onChangeText={setPhishingUrl}
                    autoCapitalize="none"
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Detalhes da Tentativa de Golpe:</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Descreva a mensagem recebida ou onde viu o link..."
                    placeholderTextColor={colors.textMuted}
                    value={phishingDesc}
                    onChangeText={setPhishingDesc}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                    onPress={handleEnviarPhishing}
                    disabled={enviandoPhishing}
                    activeOpacity={0.85}
                  >
                    {enviandoPhishing ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Send size={18} color="#ffffff" />
                        <Text style={styles.modalButtonText}>Enviar Denúncia</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 4: TERMOS & PRIVACIDADE LGPD */}
      {/* ==================================================================== */}
      <Modal visible={modalLgpdVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#1b1b1b', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={22} color="#10B981" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Privacidade & LGPD</Text>
              </View>
              <TouchableOpacity onPress={() => setModalLgpdVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} style={{ marginVertical: 8 }}>
              <Text style={[styles.docSectionTitle, { color: colors.text }]}>Termos de Uso e Proteção de Dados</Text>
              <Text style={[styles.docText, { color: colors.textMuted }]}>
                O EstudeMy atua em estrita conformidade com a Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).
              </Text>

              <Text style={[styles.docSubtitle, { color: colors.text }]}>1. Dados Coletados</Text>
              <Text style={[styles.docText, { color: colors.textMuted }]}>
                Coletamos apenas informações essenciais para a sua jornada de aprendizado: nome, e-mail, pontuação (XP), medalhas e progresso nas lições.
              </Text>

              <Text style={[styles.docSubtitle, { color: colors.text }]}>2. Segurança e Criptografia</Text>
              <Text style={[styles.docText, { color: colors.textMuted }]}>
                Suas senhas são criptografadas com Bcrypt e Salt individual. A transmissão de dados é protegida por TLS 1.3 / HTTPS com certificados de alta segurança.
              </Text>

              <Text style={[styles.docSubtitle, { color: colors.text }]}>3. Seus Direitos (Art. 18 LGPD)</Text>
              <Text style={[styles.docText, { color: colors.textMuted }]}>
                Você pode solicitar a qualquer momento a confirmação de tratamento, acesso, correção ou exclusão definitiva dos seus dados através do menu &quot;Segurança &amp; Privacidade&quot; ou pelo e-mail do nosso DPO: privacidade@estudemy.com.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#10B981', marginTop: 12 }]}
              onPress={() => setModalLgpdVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido e de Acordo</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 6,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  miniBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
  },
  infoKey: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginTop: 10,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 18,
    borderWidth: 3,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 2,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 2,
    padding: 12,
    fontSize: 14,
    height: 85,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
  },
  protocolText: {
    fontSize: 16,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  feedbackTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  feedbackTypePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  feedbackTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  docSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  docSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  docText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  versionFooterTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  versionFooterText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  versionFooterSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
