import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BACKGROUND_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react-native';
import {
  sanitizeInput,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from '../../utils/security';
import logger from '../../utils/logger';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Monitora cooldown de proteção contra força bruta (RC04)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleLogin = async () => {
    // RC02 & RC01: Sanitização de entrada
    const cleanIdentifier = sanitizeInput(identifier).trim();

    if (!cleanIdentifier || !senha) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    // RC04: Checagem de Rate Limit / Brute Force
    const rateCheck = checkLoginRateLimit(cleanIdentifier.toLowerCase());
    if (rateCheck.isBlocked) {
      setCooldownSeconds(rateCheck.remainingSeconds);
      setErrorMsg(`Muitas tentativas incorretas. Aguarde ${rateCheck.remainingSeconds}s por segurança.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.post('/api/auth/login', {
        email: cleanIdentifier,
        identifier: cleanIdentifier,
        senha: senha,
      });

      if (response.data && response.data.token) {
        // Login bem sucedido: reseta contador de tentativas falhas (RC04)
        resetLoginAttempts(cleanIdentifier.toLowerCase());
        const userObj = response.data.usuario || response.data.user;
        await login(response.data.token, userObj);
        
        const { isProfileCompleted } = await import('../../services/authHelpers');
        const userKey = userObj?.email || userObj?.id || userObj?._id || cleanIdentifier;
        const completed = await isProfileCompleted(userKey);

        // Se o usuário ainda não completou username ou personagem e não completou antes, vai para completar-perfil
        if ((!userObj?.username || !userObj?.personagem) && !completed) {
          router.replace('/(auth)/completar-perfil' as any);
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        setErrorMsg('Erro inesperado ao realizar login.');
      }
    } catch (error: any) {
      // Registra tentativa falha e ativa cooldown se atingir o limite (RC04)
      const failState = recordFailedLogin(cleanIdentifier.toLowerCase());
      if (failState.isBlocked) {
        setCooldownSeconds(failState.remainingSeconds);
        setErrorMsg(`Múltiplas falhas detectadas. Bloqueio temporário de ${failState.remainingSeconds}s ativado.`);
      } else {
        const msg = error.response?.data?.message || 'Email ou senha incorretos.';
        setErrorMsg(msg);
      }
      logger.error('Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || cooldownSeconds > 0;

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
              <Text style={styles.title}>Entrar</Text>

              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Input de Identificador */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail ou Usuário</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu e-mail "
                  placeholderTextColor="#9CA3AF"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Input de Senha */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="#9CA3AF"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Link Esqueci Minha Senha */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/esqueci-senha' as any)}
                style={{ alignSelf: 'flex-end', marginBottom: 14, marginTop: -8 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FBBF24', fontSize: 13, fontWeight: '700' }}>
                  Esqueceu a senha?
                </Text>
              </TouchableOpacity>

              {/* Botão de Submit com Proteção contra Brute Force */}
              <TouchableOpacity
                style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isButtonDisabled}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : cooldownSeconds > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Lock size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Aguarde {cooldownSeconds}s</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Entrar na Conta</Text>
                )}
              </TouchableOpacity>

              {/* Redirecionamento para cadastro */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Não tem uma conta?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')}>
                  <Text style={styles.footerLink}> Cadastre-se</Text>
                </TouchableOpacity>
              </View>

              {/* Lembrete Anti-Phishing (RC05) */}
              <Text style={styles.phishingDisclaimer}>
                🔒 Nunca compartilhe sua senha. O EstudeMy não pede senhas por e-mail ou redes sociais.
              </Text>
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
    backgroundColor: 'rgba(26, 26, 42, 0.82)',
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 16,
    alignSelf: 'center',
  },
  securityBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 10,
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
  phishingDisclaimer: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 14,
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
