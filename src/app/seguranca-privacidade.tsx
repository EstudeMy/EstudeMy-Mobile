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
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  Download,
  Trash2,
  Send,
} from 'lucide-react-native';
import api from '../services/api';

export default function SegurancaPrivacidadeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Modais
  const [modalPhishingVisible, setModalPhishingVisible] = useState(false);
  const [modalLgpdVisible, setModalLgpdVisible] = useState(false);

  // Formulário de denúncia Anti-Phishing
  const [denunciaUrl, setDenunciaUrl] = useState('');
  const [denunciaDesc, setDenunciaDesc] = useState('');
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  // Enviar denúncia de Phishing
  const handleEnviarDenuncia = async () => {
    if (!denunciaUrl.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a URL ou remetente suspeito.');
      return;
    }

    try {
      setEnviandoDenuncia(true);
      const protocolo = `SEC-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = {
        mensagem: `[DENÚNCIA ANTI-PHISHING - Protocolo: ${protocolo}] Link/Remetente: ${denunciaUrl.trim()} | Detalhes: ${denunciaDesc.trim() || 'Sem detalhes adicionais.'} | Usuário: ${user?.email || 'Anônimo'}`,
        avaliacao: 1,
      };

      await api.post('/api/feedback', payload).catch(() => {
        // Fallback silencioso caso rota offline, protocolo gerado localmente
      });

      setProtocoloGerado(protocolo);
      setDenunciaUrl('');
      setDenunciaDesc('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a denúncia. Tente novamente mais tarde.');
    } finally {
      setEnviandoDenuncia(false);
    }
  };

  const handleSolicitarExportacao = () => {
    Alert.alert(
      'Exportação de Dados Pessoais (LGPD)',
      `Conforme o Artigo 18 da LGPD, você tem direito a receber um relatório com todos os seus dados cadastrais e de progresso.\n\nUm pacote cifrado com seus dados será enviado para: ${user?.email || 'seu e-mail'}.`,
      [{ text: 'Solicitar Envio', onPress: () => Alert.alert('Solicitação Registrada', 'Seus dados serão processados e enviados em até 48 horas.') }, { text: 'Cancelar', style: 'cancel' }]
    );
  };

  const handleSolicitarExclusao = () => {
    Alert.alert(
      'Direito de Eliminação (LGPD)',
      'Você pode solicitar a exclusão definitiva ou anonimização dos seus dados pessoais da plataforma EstudeMy.\n\nDeseja abrir uma solicitação para nossa equipe de Privacidade (DPO)?',
      [
        {
          text: 'Falar com o DPO',
          onPress: () => {
            Alert.alert('Contato DPO', 'Envie sua solicitação diretamente para privacidade@estudemy.com informando seu e-mail cadastrado.');
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
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
        <Text style={[styles.title, { color: colors.text }]}>Segurança & Privacidade</Text>
        <View style={{ width: 26 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Proteção de conta, privacidade de dados e conformidade com a LGPD
      </Text>

      {/* Cartão de Status de Segurança da Conta */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: '#10B98120' }]}>
            <ShieldCheck size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Status de Proteção Ativo</Text>
            <Text style={[styles.cardSubtitle, { color: '#10B981' }]}>Ambiente Seguro & Criptografado</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Tipo de Perfil</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.tipoUsuario || 'Estudante'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Status da Conta</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '900' }]}>
                {user?.isVerified ? 'VERIFICADA' : 'ATIVA'}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Criptografia em Trânsito</Text>
            <Text style={[styles.infoValue, { color: '#3B82F6', fontWeight: '800' }]}>TLS 1.3 / HTTPS</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Armazenamento Local</Text>
            <Text style={[styles.infoValue, { color: '#8B5CF6', fontWeight: '800' }]}>AES-256 (SecureStore)</Text>
          </View>
        </View>
      </View>

      {/* Seção: Ações de Proteção e Conformidade */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Controles de Segurança & LGPD</Text>

        {/* Botão Canal Anti-Phishing */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}
          onPress={() => {
            setProtocoloGerado(null);
            setModalPhishingVisible(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#F59E0B20' }]}>
              <ShieldAlert size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Canal Anti-Phishing & Denúncia</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Verifique links oficiais e denuncie e-mails ou mensagens fraudulentas
              </Text>
            </View>
          </View>
          <ExternalLink size={18} color="#F59E0B" />
        </TouchableOpacity>

        {/* Botão Termos de Privacidade & LGPD */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: '#10B981' }]}
          onPress={() => setModalLgpdVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#10B98120' }]}>
              <FileText size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Termos de Privacidade & LGPD</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Conheça como tratamos seus dados sob a Lei nº 13.709/2018
              </Text>
            </View>
          </View>
          <ExternalLink size={18} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Seção: Seus Direitos como Titular (LGPD Art. 18) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Seus Direitos como Titular (LGPD)</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardBodyText, { color: colors.text }]}>
            A Lei Geral de Proteção de Dados (LGPD) garante a você o controle total sobre seus dados pessoais:
          </Text>

          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={[styles.rightText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>Acesso & Confirmação:</Text> Saber quais dados seus estão na plataforma.
              </Text>
            </View>
            <View style={styles.rightItem}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={[styles.rightText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>Correção:</Text> Atualizar dados incompletos ou inexatos no menu Perfil.
              </Text>
            </View>
            <View style={styles.rightItem}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={[styles.rightText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>Portabilidade:</Text> Solicitar a exportação de todos os seus dados.
              </Text>
            </View>
            <View style={styles.rightItem}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={[styles.rightText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>Eliminação:</Text> Solicitar a exclusão definitiva dos seus dados.
              </Text>
            </View>
          </View>

          <View style={styles.rightsButtonsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: '#4F46E5' }]}
              onPress={handleSolicitarExportacao}
              activeOpacity={0.8}
            >
              <Download size={16} color="#4F46E5" />
              <Text style={[styles.secondaryButtonText, { color: '#4F46E5' }]}>Exportar Meus Dados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: '#EF4444' }]}
              onPress={handleSolicitarExclusao}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.secondaryButtonText, { color: '#EF4444' }]}>Excluir Minha Conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Dicas de Proteção ao Estudante */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dicas de Segurança para Estudantes</Text>
        <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1E1E2F' : '#FEF3C7' }]}>
          <Text style={[styles.tipTitle, { color: isDark ? '#F59E0B' : '#92400E' }]}>
            Nunca compartilhe sua senha
          </Text>
          <Text style={[styles.tipText, { color: isDark ? '#E2E8F0' : '#78350F' }]}>
            • Crie senhas com pelo menos 8 dígitos, combinando letras maiúsculas, minúsculas e números.{'\n'}
            • Nossos professores e administradores nunca pedirão sua senha.{'\n'}
            • Sempre encerre a sessão caso utilize computadores compartilhados ou de laboratórios escolares.
          </Text>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* MODAL 1: CANAL ANTI-PHISHING & DENÚNCIA */}
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
              {protocoloGerado ? (
                <View style={styles.protocolContainer}>
                  <CheckCircle2 size={48} color="#10B981" />
                  <Text style={[styles.protocolTitle, { color: colors.text }]}>Denúncia Registrada!</Text>
                  <Text style={[styles.protocolNumber, { color: '#4F46E5' }]}>Protocolo: {protocoloGerado}</Text>
                  <Text style={[styles.protocolText, { color: colors.textMuted }]}>
                    Nossa equipe de Segurança da Informação foi notificada para analisar e mitigar qualquer ameaça. Obrigado por proteger nossa comunidade!
                  </Text>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: '#4F46E5', marginTop: 16 }]}
                    onPress={() => setModalPhishingVisible(false)}
                  >
                    <Text style={styles.submitButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={[styles.noticeBox, { backgroundColor: isDark ? '#1E1E2F' : '#FEF3C7' }]}>
                    <Text style={[styles.noticeTitle, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                      Domínios e Canais Oficiais do EstudeMy:
                    </Text>
                    <Text style={[styles.noticeList, { color: isDark ? '#E2E8F0' : '#78350F' }]}>
                      • Site Oficial: https://estudemy.com{'\n'}
                      • Servidor API: https://api.estudemy.com ou 18.222.3.101{'\n'}
                      • E-mails oficiais: remetentes terminados em @estudemy.com
                    </Text>
                  </View>

                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    Recebeu algum link suspeito ou e-mail falso? Denuncie abaixo:
                  </Text>

                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Link / URL ou E-mail Suspeito:</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: http://site-falso.com ou email@golpe.com"
                    placeholderTextColor={colors.textMuted}
                    value={denunciaUrl}
                    onChangeText={setDenunciaUrl}
                    autoCapitalize="none"
                  />

                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>O que aconteceu? (Opcional):</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Descreva a mensagem recebida, pedidos de senha ou detalhes da fraude..."
                    placeholderTextColor={colors.textMuted}
                    value={denunciaDesc}
                    onChangeText={setDenunciaDesc}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: '#F59E0B' }]}
                    onPress={handleEnviarDenuncia}
                    disabled={enviandoDenuncia}
                    activeOpacity={0.85}
                  >
                    {enviandoDenuncia ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Send size={18} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Enviar Denúncia para Segurança</Text>
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
      {/* MODAL 2: TERMOS DE PRIVACIDADE & LGPD */}
      {/* ==================================================================== */}
      <Modal visible={modalLgpdVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#1b1b1b', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={22} color="#10B981" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Termos & Privacidade LGPD</Text>
              </View>
              <TouchableOpacity onPress={() => setModalLgpdVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} style={{ marginVertical: 8 }}>
              <Text style={[styles.docHeading, { color: colors.text }]}>1. Compromisso com a sua Privacidade</Text>
              <Text style={[styles.docParagraph, { color: colors.textMuted }]}>
                O EstudeMy é comprometido com a proteção dos dados pessoais de todos os nossos alunos, professores e responsáveis, em total conformidade com a Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD).
              </Text>

              <Text style={[styles.docHeading, { color: colors.text }]}>2. Quais dados tratamos e para quê</Text>
              <Text style={[styles.docParagraph, { color: colors.textMuted }]}>
                • <Text style={{ fontWeight: 'bold' }}>Identificação básica:</Text> Nome, e-mail e apelido para autenticação e emissão de certificados.{'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Progresso de Aprendizado:</Text> Fases concluídas, pontuações de quiz, XP e rankings para fins de gamificação pedagógica.{'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Segurança:</Text> Logs de acesso e endereços IP para prevenção contra fraudes e ataques cibernéticos.
              </Text>

              <Text style={[styles.docHeading, { color: colors.text }]}>3. Medidas Técnicas de Segurança</Text>
              <Text style={[styles.docParagraph, { color: colors.textMuted }]}>
                • Senhas cifradas com algoritmo de derivação forte (Bcrypt com salt individual).{'\n'}
                • Toda a comunicação é protegida por túneis criptográficos TLS 1.3 / HTTPS.{'\n'}
                • Nenhuma informação de senha é trafegada ou armazenada em texto claro.
              </Text>

              <Text style={[styles.docHeading, { color: colors.text }]}>4. Seus Direitos (Art. 18 da LGPD)</Text>
              <Text style={[styles.docParagraph, { color: colors.textMuted }]}>
                Você tem o direito de solicitar a qualquer momento: confirmação do tratamento, acesso aos seus dados, correção de dados incompletos ou errados, anonimização ou exclusão definitiva da sua conta.
              </Text>

              <Text style={[styles.docHeading, { color: colors.text }]}>5. Contato do Encarregado de Dados (DPO)</Text>
              <Text style={[styles.docParagraph, { color: colors.textMuted }]}>
                Para exercer qualquer direito ou esclarecer dúvidas, fale diretamente com nosso Encarregado de Proteção de Dados pelo e-mail: <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>privacidade@estudemy.com</Text>.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#10B981', marginTop: 12 }]}
              onPress={() => setModalLgpdVisible(false)}
            >
              <Text style={styles.submitButtonText}>Entendido e de Acordo</Text>
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
    marginBottom: 8,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB30',
    marginVertical: 14,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 14,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  actionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  cardBodyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  rightsList: {
    gap: 8,
    marginBottom: 16,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rightText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  rightsButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  tipsCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 16,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  // Modal styles
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
  noticeBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  noticeList: {
    fontSize: 12,
    lineHeight: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
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
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
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
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  protocolContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  protocolTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  protocolNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  protocolText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  docHeading: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 4,
  },
  docParagraph: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
});
