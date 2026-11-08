import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Trilha } from '../services/trilhaService';
import {
  calcularSplit,
  gerarChavePixCopiaECola,
  processarCompraTrilha,
  TransacaoPagamento,
} from '../services/pagamentoService';
import { copyToClipboard } from '../services/trilhaAcessoService';
import { getQrImageUrl } from '../utils/qrCode';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Receipt,
  Percent,
} from 'lucide-react-native';

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  trilha: Trilha;
  onSuccess: (transacao: TransacaoPagamento) => void;
}

export function CheckoutModal({ visible, onClose, trilha, onSuccess }: CheckoutModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [metodo, setMetodo] = useState<'PIX' | 'CARTAO'>('PIX');
  const [parcelas, setParcelas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimer, setPixTimer] = useState(900); // 15 minutos em segundos
  const [successTx, setSuccessTx] = useState<TransacaoPagamento | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos do Cartão de Crédito
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');

  const precoNumerico = Number(trilha?.preco) || 29.9;
  const split = useMemo(() => calcularSplit(precoNumerico), [precoNumerico]);

  const pixPayload = useMemo(() => {
    if (!trilha?._id) return '';
    return gerarChavePixCopiaECola(trilha._id, split.valorTotal, trilha.titulo);
  }, [trilha, split]);

  const pixQrImageUrl = useMemo(() => {
    return getQrImageUrl(pixPayload, 260);
  }, [pixPayload]);

  // Contagem regressiva do PIX
  useEffect(() => {
    if (!visible || metodo !== 'PIX' || successTx) return;
    const interval = setInterval(() => {
      setPixTimer((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, metodo, successTx]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = async () => {
    await copyToClipboard(pixPayload);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const formatCardNumber = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const parts = clean.match(/.{1,4}/g);
    return parts ? parts.join(' ') : clean;
  };

  const formatValidade = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  const handleFinalizarCompra = async () => {
    setErrorMessage(null);

    if (metodo === 'CARTAO') {
      const cleanNum = numeroCartao.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        setErrorMessage('Digite um número de cartão de crédito válido (16 dígitos).');
        return;
      }
      if (!nomeTitular.trim()) {
        setErrorMessage('Digite o nome do titular como impresso no cartão.');
        return;
      }
      if (validade.length < 5) {
        setErrorMessage('Digite a data de validade no formato MM/AA.');
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage('Digite o código CVV de segurança.');
        return;
      }
    }

    setLoading(true);

    // Simulação do tempo de aprovação bancária em tempo real (1.8s)
    setTimeout(async () => {
      try {
        const res = await processarCompraTrilha({
          trilha,
          comprador: {
            id: user?._id || user?.id || 'estudante_anonimo',
            nome: user?.nome || 'Estudante EstudeMy',
            email: user?.email,
          },
          metodo,
          parcelas,
          dadosCartao:
            metodo === 'CARTAO'
              ? {
                  numero: numeroCartao,
                  titular: nomeTitular,
                  validade,
                  cvv,
                }
              : undefined,
        });

        if (res.success && res.transacao) {
          setSuccessTx(res.transacao);
        } else {
          setErrorMessage(res.error || 'Erro ao processar transação.');
        }
      } catch {
        setErrorMessage('Falha ao comunicar com o servidor de pagamento.');
      } finally {
        setLoading(false);
      }
    }, 1600);
  };

  const handleConcluirAcesso = () => {
    if (successTx) {
      onSuccess(successTx);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Receipt size={24} color="#4F46E5" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Checkout Seguro 💳</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* TELA DE SUCESSO / COMPROVANTE */}
            {successTx ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconBubble}>
                  <CheckCircle2 size={48} color="#ffffff" />
                </View>

                <Text style={[styles.successTitle, { color: colors.text }]}>
                  Pagamento Confirmado! 🎉
                </Text>
                <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                  Parabéns! Sua trilha foi adquirida e liberada com sucesso.
                </Text>

                {/* Card de Comprovante */}
                <View style={[styles.receiptCard, { backgroundColor: colors.cardSecondary }]}>
                  <Text style={[styles.receiptHeader, { color: colors.textMuted }]}>
                    COMPROVANTE DE COMPRA
                  </Text>

                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textMuted }]}>Trilha:</Text>
                    <Text style={[styles.receiptValue, { color: colors.text }]} numberOfLines={1}>
                      {successTx.trilhaTitulo}
                    </Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textMuted }]}>Valor Total:</Text>
                    <Text style={[styles.receiptValue, { color: '#16A34A', fontWeight: '900' }]}>
                      R$ {successTx.valorTotal.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textMuted }]}>Método:</Text>
                    <Text style={[styles.receiptValue, { color: colors.text }]}>
                      {successTx.metodo === 'PIX' ? 'PIX Instantâneo' : `Cartão (${successTx.parcelas}x)`}
                    </Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textMuted }]}>Transação:</Text>
                    <Text style={[styles.receiptValue, { color: colors.text }]} numberOfLines={1}>
                      {successTx.id}
                    </Text>
                  </View>

                  {/* Divisão do Valor / Split de Transparência */}
                  <View style={styles.splitBox}>
                    <View style={styles.splitRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={14} color="#16A34A" />
                        <Text style={styles.splitTextTitle}>Professor Autor (85%):</Text>
                      </View>
                      <Text style={styles.splitTextValue}>
                        R$ {successTx.valorProfessor.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>

                    <View style={styles.splitRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Percent size={14} color="#4F46E5" />
                        <Text style={styles.splitTextTitle}>EstudeMy Taxa (15%):</Text>
                      </View>
                      <Text style={styles.splitTextValue}>
                        R$ {successTx.valorEstudeMy.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Botão para Iniciar */}
                <TouchableOpacity
                  style={styles.startLearningBtn}
                  onPress={handleConcluirAcesso}
                  activeOpacity={0.9}
                >
                  <Sparkles size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.startLearningBtnText}>Acessar Trilha Agora</Text>
                  <ArrowRight size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            ) : (
              /* FLUXO NORMAL DE CHECKOUT */
              <>
                {/* Resumo da Trilha */}
                <View style={[styles.trailSummaryCard, { backgroundColor: colors.cardSecondary }]}>
                  <View style={styles.trailSummaryInfo}>
                    <Text style={styles.summarySubject}>{trilha.materia?.toUpperCase()}</Text>
                    <Text style={[styles.summaryTitle, { color: colors.text }]} numberOfLines={2}>
                      {trilha.titulo}
                    </Text>
                    <Text style={[styles.summaryTeacher, { color: colors.textMuted }]}>
                      Criado por: {typeof trilha.criadoPor === 'object' ? (trilha.criadoPor as any).nome || 'Professor' : 'Professor EstudeMy'}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>TOTAL</Text>
                    <Text style={styles.priceValue}>
                      R$ {split.valorTotal.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                </View>

                {/* Transparência de Valores: 85% Professor / 15% EstudeMy */}
                <View style={[styles.transparencyCard, { borderColor: '#1b1b1b' }]}>
                  <View style={styles.transparencyHeader}>
                    <ShieldCheck size={16} color="#16A34A" />
                    <Text style={styles.transparencyTitle}>Divisão Transparente de Valores</Text>
                  </View>

                  <View style={styles.transparencyRow}>
                    <View style={styles.splitPillProfessor}>
                      <Text style={styles.splitPillText}>
                        85% (R$ {split.valorProfessor.toFixed(2).replace('.', ',')}) ao Professor
                      </Text>
                    </View>
                    <View style={styles.splitPillPlatform}>
                      <Text style={styles.splitPillText}>
                        15% (R$ {split.valorEstudeMy.toFixed(2).replace('.', ',')}) EstudeMy
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transparencyHint}>
                    A maior parte da sua compra vai diretamente para remunerar o professor criador desta trilha.
                  </Text>
                </View>

                {errorMessage && (
                  <View style={styles.errorAlert}>
                    <Text style={styles.errorAlertText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Seleção do Método de Pagamento */}
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Forma de Pagamento</Text>
                <View style={styles.methodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      { backgroundColor: colors.cardSecondary },
                      metodo === 'PIX' && styles.methodTabActivePix,
                    ]}
                    onPress={() => setMetodo('PIX')}
                    activeOpacity={0.85}
                  >
                    <QrCode size={18} color={metodo === 'PIX' ? '#ffffff' : colors.textMuted} />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: colors.textMuted },
                        metodo === 'PIX' && styles.methodTabTextActive,
                      ]}
                    >
                      PIX Instantâneo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      { backgroundColor: colors.cardSecondary },
                      metodo === 'CARTAO' && styles.methodTabActiveCard,
                    ]}
                    onPress={() => setMetodo('CARTAO')}
                    activeOpacity={0.85}
                  >
                    <CreditCard size={18} color={metodo === 'CARTAO' ? '#ffffff' : colors.textMuted} />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: colors.textMuted },
                        metodo === 'CARTAO' && styles.methodTabTextActive,
                      ]}
                    >
                      Cartão de Crédito
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CONTEÚDO DO MÉTODO SELECIONADO */}
                {metodo === 'PIX' ? (
                  <View style={[styles.pixContainer, { backgroundColor: colors.cardSecondary }]}>
                    <View style={styles.pixTimerRow}>
                      <Clock size={16} color="#CA8A04" />
                      <Text style={styles.pixTimerText}>
                        Código válido por: <Text style={{ fontWeight: '900' }}>{formatTimer(pixTimer)}</Text>
                      </Text>
                    </View>

                    {/* QR Code Imagem */}
                    <View style={styles.qrCodeWrapper}>
                      <Image source={{ uri: pixQrImageUrl }} style={styles.qrCodeImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.pixInstruction}>
                      Abra o aplicativo do seu banco, escolha &ldquo;PIX Copia e Cola&rdquo; ou aponte a câmera para o QR Code acima:
                    </Text>

                    {/* Botão Copiar Código PIX */}
                    <TouchableOpacity
                      style={[styles.copyPixBtn, pixCopied && styles.copyPixBtnSuccess]}
                      onPress={handleCopyPix}
                      activeOpacity={0.85}
                    >
                      {pixCopied ? (
                        <>
                          <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.copyPixBtnText}>Chave PIX Copiada com Sucesso!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={18} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.copyPixBtnText}>Copiar Chave PIX (Copia e Cola)</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Botão de Confirmação PIX */}
                    <TouchableOpacity
                      style={styles.confirmPixBtn}
                      onPress={handleFinalizarCompra}
                      disabled={loading}
                      activeOpacity={0.9}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
                          <Text style={styles.confirmPixBtnText}>Já Realizei o Pagamento PIX</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cardContainer}>
                    {/* Visualizador Virtual de Cartão de Crédito */}
                    <View style={styles.cardPreview}>
                      <View style={styles.cardPreviewTop}>
                        <CreditCard size={28} color="#ffffff" />
                        <Text style={styles.cardPreviewBrand}>ESTUDEMY PAY</Text>
                      </View>
                      <Text style={styles.cardPreviewNumber}>
                        {numeroCartao || '•••• •••• •••• ••••'}
                      </Text>
                      <View style={styles.cardPreviewBottom}>
                        <View>
                          <Text style={styles.cardPreviewSmall}>TITULAR</Text>
                          <Text style={styles.cardPreviewText} numberOfLines={1}>
                            {nomeTitular.toUpperCase() || 'NOME COMPLETO'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.cardPreviewSmall}>VALIDADE</Text>
                          <Text style={styles.cardPreviewText}>{validade || 'MM/AA'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Inputs de Cartão */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Número do Cartão</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                        placeholder="0000 0000 0000 0000"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        value={numeroCartao}
                        onChangeText={(txt) => setNumeroCartao(formatCardNumber(txt))}
                        maxLength={19}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Nome no Cartão</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                        placeholder="Como impresso no cartão"
                        placeholderTextColor={colors.textMuted}
                        value={nomeTitular}
                        onChangeText={setNomeTitular}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Validade</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                          placeholder="MM/AA"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="number-pad"
                          value={validade}
                          onChangeText={(txt) => setValidade(formatValidade(txt))}
                          maxLength={5}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>CVV</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.cardSecondary, color: colors.text }]}
                          placeholder="123"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="number-pad"
                          value={cvv}
                          onChangeText={(txt) => setCvv(txt.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </View>

                    {/* Parcelas */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Opções de Parcelamento</Text>
                      <View style={styles.parcelasRow}>
                        {[1, 2, 3].map((p) => {
                          const valorParcela = (split.valorTotal / p).toFixed(2).replace('.', ',');
                          const isSel = parcelas === p;
                          return (
                            <TouchableOpacity
                              key={p}
                              style={[
                                styles.parcelaBtn,
                                { backgroundColor: colors.cardSecondary },
                                isSel && styles.parcelaBtnActive,
                              ]}
                              onPress={() => setParcelas(p)}
                            >
                              <Text style={[styles.parcelaBtnText, isSel && styles.parcelaBtnTextActive]}>
                                {p}x de R$ {valorParcela}
                              </Text>
                              <Text style={[styles.parcelaSubtext, isSel && styles.parcelaBtnTextActive]}>
                                sem juros
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Botão Pagar Cartão */}
                    <TouchableOpacity
                      style={styles.payCardBtn}
                      onPress={handleFinalizarCompra}
                      disabled={loading}
                      activeOpacity={0.9}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <CreditCard size={20} color="#ffffff" style={{ marginRight: 8 }} />
                          <Text style={styles.payCardBtnText}>
                            Pagar R$ {split.valorTotal.toFixed(2).replace('.', ',')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#1b1b1b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  scrollBody: {
    padding: 18,
  },
  trailSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  trailSummaryInfo: {
    flex: 1,
    marginRight: 10,
  },
  summarySubject: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  summaryTeacher: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  priceLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  transparencyCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  transparencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  transparencyTitle: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '900',
  },
  transparencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  splitPillProfessor: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  splitPillPlatform: {
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  splitPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  transparencyHint: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  errorAlert: {
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  methodTabActivePix: {
    backgroundColor: '#0D9488',
    borderColor: '#1b1b1b',
  },
  methodTabActiveCard: {
    backgroundColor: '#4F46E5',
    borderColor: '#1b1b1b',
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '900',
  },
  methodTabTextActive: {
    color: '#ffffff',
  },
  pixContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    marginBottom: 20,
  },
  pixTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  pixTimerText: {
    color: '#854D0E',
    fontSize: 12,
    fontWeight: '700',
  },
  qrCodeWrapper: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 14,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  pixInstruction: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  copyPixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    marginBottom: 10,
  },
  copyPixBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  copyPixBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  confirmPixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  confirmPixBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardPreview: {
    backgroundColor: '#1E1B4B',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardPreviewBrand: {
    color: '#A5B4FC',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  cardPreviewNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPreviewSmall: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardPreviewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  parcelasRow: {
    flexDirection: 'row',
    gap: 6,
  },
  parcelaBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  parcelaBtnActive: {
    backgroundColor: '#4F46E5',
  },
  parcelaBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1b1b1b',
  },
  parcelaSubtext: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  parcelaBtnTextActive: {
    color: '#ffffff',
  },
  payCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    width: '100%',
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
  payCardBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  receiptCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    marginBottom: 20,
  },
  receiptHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 6,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '65%',
  },
  splitBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: '#1b1b1b',
    borderStyle: 'dashed',
    gap: 6,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitTextTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  splitTextValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1F2937',
  },
  startLearningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  startLearningBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});

