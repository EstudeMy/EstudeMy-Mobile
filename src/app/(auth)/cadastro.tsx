import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { BACKGROUND_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { sanitizeInput, validatePasswordStrength } from '../../utils/security';
import logger from '../../utils/logger';

export default function CadastroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // Formato DD/MM/AAAA
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');

  // Máscara e conversão automática de data de nascimento (ex: 01042000 -> 01/04/2000)
  const handleDataNascimentoChange = (text: string) => {
    // Bloqueia qualquer entrada além dos 10 caracteres da data (DD/MM/AAAA)
    if (text.length > 10) return;

    const isDeleting = text.length < dataNascimento.length;
    // Apenas números e restrito a no máximo 8 dígitos (DDMMAAAA)
    const numbers = text.replace(/\D/g, '').slice(0, 8);

    // Se já estiver com a quantidade máxima de caracteres e não estiver apagando, não aceita
    if (!isDeleting && dataNascimento.length >= 10 && numbers.length >= 8) {
      return;
    }

    if (numbers.length === 0) {
      setDataNascimento('');
      return;
    }

    if (isDeleting) {
      // Se apagou a barra diretamente (ex: tinha '01/' e agora tem '01')
      if (dataNascimento.endsWith('/') && text === dataNascimento.slice(0, -1)) {
        const trimmed = numbers.slice(0, -1);
        if (trimmed.length <= 2) {
          setDataNascimento(trimmed);
        } else if (trimmed.length <= 4) {
          setDataNascimento(`${trimmed.slice(0, 2)}/${trimmed.slice(2)}`);
        } else {
          setDataNascimento(`${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${trimmed.slice(4)}`);
        }
        return;
      }

      if (numbers.length <= 2) {
        setDataNascimento(numbers);
      } else if (numbers.length <= 4) {
        setDataNascimento(`${numbers.slice(0, 2)}/${numbers.slice(2)}`);
      } else {
        setDataNascimento(`${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`);
      }
      return;
    }

    // Digitando novos dígitos
    if (numbers.length < 2) {
      setDataNascimento(numbers);
    } else if (numbers.length === 2) {
      setDataNascimento(`${numbers}/`);
    } else if (numbers.length < 4) {
      setDataNascimento(`${numbers.slice(0, 2)}/${numbers.slice(2)}`);
    } else if (numbers.length === 4) {
      setDataNascimento(`${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/`);
    } else {
      setDataNascimento(`${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`);
    }
  };

  const parseDate = (dateStr: string): Date => {
    if (dateStr && dateStr.length === 10) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return new Date(2005, 0, 1);
  };

  const handleDateValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    setDataNascimento(`${day}/${month}/${year}`);
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
  };

  // Campos adicionais para professor
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [titulacao, setTitulacao] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const TITULACAO_OPTIONS = [
    { id: 'Graduação', name: 'Graduação' },
    { id: 'Especialização', name: 'Especialização' },
    { id: 'Mestrado', name: 'Mestrado' },
    { id: 'Doutorado', name: 'Doutorado' },
    { id: 'Pós-Doutorado', name: 'Pós-Doutorado' },
  ];

  const handleCadastro = async () => {
    // RC02: Sanitização de entradas do usuário
    const cleanNome = sanitizeInput(nome).trim();
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    if (!cleanNome || !cleanEmail || !senha || !confirmarSenha || !dataNascimento) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação de confirmação de senha
    if (senha !== confirmarSenha) {
      setErrorMsg('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    // RC04: Validação estrita de política de senhas fortes
    const passwordCheck = validatePasswordStrength(senha);
    if (!passwordCheck.isValid) {
      setErrorMsg(passwordCheck.feedback[0] || 'Senha fraca. Utilize no mínimo 8 caracteres com maiúsculas, minúsculas e números.');
      return;
    }

    // RC07: Whitelist estrita de tipoUsuario para prevenir Privilege Escalation
    const safeTipoUsuario: 'ALUNO' | 'PROFESSOR' = tipoUsuario === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';

    if (safeTipoUsuario === 'PROFESSOR' && (!registroProfissional || !titulacao)) {
      setErrorMsg('Por favor, preencha seu Registro Profissional e Titulação.');
      return;
    }

    // Converter data de nascimento DD/MM/AAAA para ISO Date string
    // Só aceita exatamente a quantidade correta de caracteres da data (10 caracteres: DD/MM/AAAA)
    if (dataNascimento.trim().length !== 10) {
      setErrorMsg('A data de nascimento deve ter exatamente 10 caracteres no formato DD/MM/AAAA.');
      return;
    }

    const dateParts = dataNascimento.split('/');
    if (dateParts.length !== 3 || dateParts[0].length !== 2 || dateParts[1].length !== 2 || dateParts[2].length !== 4) {
      setErrorMsg('Data de nascimento deve estar no formato DD/MM/AAAA completo.');
      return;
    }
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 1920 || year > currentYear) {
      setErrorMsg('Por favor, informe uma data de nascimento válida.');
      return;
    }
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // AAAA-MM-DD

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Registrar o usuário no backend (sem username e personagem, definidos na próxima tela)
      await api.post('/api/auth/register', {
        nome: cleanNome,
        email: cleanEmail,
        senha: senha,
        dataNascimento: formattedDate,
        tipoUsuario: safeTipoUsuario,
        aceiteTermos: true,
        registroProfissional: safeTipoUsuario === 'PROFESSOR' ? sanitizeInput(registroProfissional).trim() : undefined,
        titulacao: safeTipoUsuario === 'PROFESSOR' ? sanitizeInput(titulacao) : undefined,
      });

      // 2. Realizar login automático logo em seguida
      const loginRes = await api.post('/api/auth/login', {
        email: cleanEmail,
        identifier: cleanEmail,
        senha: senha,
      });

      const token = loginRes.data.token;
      const userObj = loginRes.data.usuario || loginRes.data.user;

      // 3. Logar a sessão localmente
      await login(token, userObj);

      // 4. Redireciona para a tela pós-login para escolher username e personagem
      router.replace('/(auth)/completar-perfil' as any);

    } catch (error: any) {
      logger.error('Erro no cadastro');
      const msg = error.response?.data?.message || 'Erro ao realizar cadastro. Tente outro e-mail.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES.loginDark}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Botão Voltar */}
        <TouchableOpacity
          style={[styles.backBtn, { top: Math.max(insets.top + 10, 48) }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingTop: Math.max(insets.top + 60, 60),
                paddingBottom: Math.max(insets.bottom + 16, 16),
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.title}>Criar Conta</Text>

              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Nome */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              {/* E-mail */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Senha */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Senha forte (mínimo 8 caracteres)"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                  autoCapitalize="none"
                />
              </View>

              {/* Confirmar Senha */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirme sua Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repita sua senha"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  autoCapitalize="none"
                />
              </View>

              {/* Data de Nascimento */}
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Data de Nascimento (DD/MM/AAAA)</Text>
                  {dataNascimento.length > 0 && (
                    <Text
                      style={[
                        styles.charCounter,
                        dataNascimento.length === 10 ? styles.charCounterComplete : null,
                      ]}
                    >
                      {dataNascimento.length}/10
                    </Text>
                  )}
                </View>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="Ex: 15/08/2000"
                    placeholderTextColor="#9CA3AF"
                    value={dataNascimento}
                    onChangeText={handleDataNascimentoChange}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Calendar size={22} color="#CA8A04" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* DateTimePicker para iOS (Modal) e Android (Nativo) */}
              {Platform.OS === 'ios' ? (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                      <Text style={styles.modalTitle}>Selecione sua Data</Text>
                      <DateTimePicker
                        value={parseDate(dataNascimento)}
                        mode="date"
                        display="inline"
                        maximumDate={new Date()}
                        minimumDate={new Date(1920, 0, 1)}
                        onValueChange={handleDateValueChange}
                        onDismiss={handleDateDismiss}
                        themeVariant="dark"
                      />
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowDatePicker(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalCloseButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              ) : (
                showDatePicker && (
                  <DateTimePicker
                    value={parseDate(dataNascimento)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    onValueChange={handleDateValueChange}
                    onDismiss={handleDateDismiss}
                  />
                )
              )}

              {/* Papel do Usuário */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de Perfil</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleBtn, tipoUsuario === 'ALUNO' && styles.roleBtnActive]}
                    onPress={() => setTipoUsuario('ALUNO')}
                  >
                    <Text style={styles.roleBtnText}>Aluno</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBtn, tipoUsuario === 'PROFESSOR' && styles.roleBtnActive]}
                    onPress={() => setTipoUsuario('PROFESSOR')}
                  >
                    <Text style={styles.roleBtnText}>Professor</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campos extras para Professor */}
              {tipoUsuario === 'PROFESSOR' && (
                <>
                  {/* Registro Profissional */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Registro Profissional</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: CRM, CREF, etc."
                      placeholderTextColor="#9CA3AF"
                      value={registroProfissional}
                      onChangeText={setRegistroProfissional}
                    />
                  </View>

                  {/* Titulação */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Titulação</Text>
                    <View style={styles.titulacaoContainer}>
                      {TITULACAO_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.titulacaoBtn,
                            titulacao === option.id && styles.titulacaoBtnActive,
                          ]}
                          onPress={() => setTitulacao(option.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.titulacaoBtnText,
                              titulacao === option.id && { color: '#ffffff' },
                            ]}
                          >
                            {option.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Botão de Registro */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCadastro}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Continuar Cadastro 🚀</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Já tem uma conta?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.footerLink}> Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 42, 0.85)',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#2D2D44',
    borderRadius: 16,
    padding: 24,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  charCounter: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  charCounterComplete: {
    color: '#22C55E',
  },
  input: {
    backgroundColor: '#1E1E2F',
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2F',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
  },
  dateTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calendarButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#2D2D44',
    borderRadius: 16,
    padding: 20,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: '#1E1E2F',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#CA8A04', // yellow-600 active color
  },
  roleBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  button: {
    width: '100%',
    backgroundColor: '#16A34A', // green-600
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLink: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '800',
  },
  titulacaoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  titulacaoBtn: {
    backgroundColor: '#1E1E2F',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  titulacaoBtnActive: {
    backgroundColor: '#CA8A04', // matching active color theme (yellow-600)
    borderColor: '#1b1b1b',
  },
  titulacaoBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '800',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    backgroundColor: '#1b1b1b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10,
  },
});
