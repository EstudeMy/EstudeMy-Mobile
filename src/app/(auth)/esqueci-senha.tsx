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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { BACKGROUND_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { sanitizeInput } from '../../utils/security';
import logger from '../../utils/logger';

export default function EsqueciSenhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleRecuperarSenha = async () => {
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Tentar endpoint padrão de recuperação de senha
      try {
        await api.post('/api/users/solicitar-recuperacao', { email: cleanEmail });
      } catch (e1) {
        // Fallback para rotas alternativas de autenticação se existirem
        try {
          await api.post('/api/auth/recuperar-senha', { email: cleanEmail });
        } catch (e2) {
          await api.post('/api/auth/forgot-password', { email: cleanEmail });
        }
      }

      setSentSuccess(true);
    } catch (error: any) {
      logger.error('Erro ao solicitar recuperação de senha');
      const msg = error.response?.data?.message || 'Não foi possível enviar o e-mail de recuperação. Verifique o endereço e tente novamente.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={isDark ? BACKGROUND_IMAGES.loginDark : BACKGROUND_IMAGES.loginLight}
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
              <View style={styles.iconContainer}>
                {sentSuccess ? (
                  <CheckCircle2 size={36} color="#10B981" />
                ) : (
                  <Mail size={36} color="#CA8A04" />
                )}
              </View>

              <Text style={styles.title}>
                {sentSuccess ? 'E-mail Enviado!' : 'Recuperar Senha'}
              </Text>

              <Text style={styles.subtitle}>
                {sentSuccess
                  ? `Enviamos as instruções de recuperação para ${email}. Verifique sua caixa de entrada e pasta de spam.`
                  : 'Digite o e-mail da sua conta para receber um link de redefinição de senha.'}
              </Text>

              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {!sentSuccess ? (
                <>
                  {/* Input de E-mail */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Seu E-mail Cadastrado</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="exemplo@estudemy.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Botão de Enviar */}
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRecuperarSenha}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonText}>Enviar E-mail 📬</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#10B981' }]}
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>Voltar para o Login</Text>
                </TouchableOpacity>
              )}

              {/* Redirecionamento para login */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Lembrou sua senha?</Text>
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
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
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
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
  label: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
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
  button: {
    width: '100%',
    backgroundColor: '#CA8A04', // yellow-600
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
    color: '#CA8A04',
    fontSize: 14,
    fontWeight: '800',
  },
  backBtn: {
    position: 'absolute',
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
