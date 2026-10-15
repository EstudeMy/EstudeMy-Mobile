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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getCharacterImage, BACKGROUND_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { sanitizeInput } from '../../utils/security';
import logger from '../../utils/logger';
import { Sparkles, User, ShieldCheck } from 'lucide-react-native';

const CHARACTERS_LIST = [
  { id: 'Samurai', name: 'Samurai', description: 'Guerreiro de honra com ataques rápidos de espada.' },
  { id: 'Mago', name: 'Mago', description: 'Conjurador de feitiços com alto poder de mana.' },
  { id: 'Guerreiro', name: 'Guerreiro', description: 'Combatente forte e resistente com alto HP.' },
];

export default function CompletarPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, updateUserState } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [selectedChar, setSelectedChar] = useState(user?.personagem || 'Samurai');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSalvarPerfil = async () => {
    const cleanUsername = sanitizeInput(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('O nome de usuário deve ter pelo menos 3 caracteres (apenas letras, números e _).');
      return;
    }

    if (!selectedChar) {
      setErrorMsg('Por favor, selecione seu personagem inicial.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Atualiza imediatamente no estado da sessão local
    updateUserState({
      username: cleanUsername,
      personagem: selectedChar,
    });

    try {
      const fotoPerfil = `/img/${selectedChar.toLowerCase()}.png`;

      try {
        const perfilRes = await api.post('/api/auth/criarPerfil', {
          personagem: selectedChar,
          username: cleanUsername,
          fotoPerfil: fotoPerfil,
        });
        if (perfilRes.data?.usuario) {
          updateUserState(perfilRes.data.usuario);
        }
      } catch (errPerfil: any) {
        // Fallback para atualizar-personagem caso criarPerfil retorne status de já existente
        try {
          await api.put('/api/users/atualizar-personagem', { personagem: selectedChar });
        } catch {}
      }

      // Atualiza e persiste o username e personagem localmente
      const { saveLocalUser, setProfileCompleted } = await import('../../services/authHelpers');
      const updatedUser = {
        ...(user || {}),
        username: cleanUsername,
        personagem: selectedChar,
      };
      await saveLocalUser(updatedUser);
      updateUserState({
        username: cleanUsername,
        personagem: selectedChar,
      });
      const userKey = user?.email || user?.id || user?._id;
      await setProfileCompleted(true, userKey);
    } catch (error: any) {
      logger.error('Erro ao salvar perfil:', error);
    } finally {
      setLoading(false);
      try {
        router.replace('/(tabs)/home');
      } catch {
        router.push('/(tabs)/home' as any);
      }
    }
  };

  const handleSkip = async () => {
    updateUserState({
      personagem: user?.personagem || 'Samurai',
      username: user?.username || 'Aluno',
    });
    try {
      const { setProfileCompleted } = await import('../../services/authHelpers');
      const userKey = user?.email || user?.id || user?._id;
      await setProfileCompleted(true, userKey);
    } catch {}
    try {
      router.replace('/(tabs)/home');
    } catch {
      router.push('/(tabs)/home' as any);
    }
  };

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES.loginDark}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingTop: Math.max(insets.top + 24, 40),
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.headerIconRow}>
                <Sparkles size={32} color="#FBBF24" />
              </View>

              <Text style={styles.title}>Crie seu Herói</Text>
              <Text style={styles.subtitle}>
                Antes de começar suas aventuras, escolha seu nome de guerreiro e seu personagem inicial.
              </Text>

              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Input de Nome de Usuário */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome de Usuário (@username)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: joaodev, guerreiro_1"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                <Text style={styles.helperText}>
                  Este será seu identificador no ranking e nas batalhas.
                </Text>
              </View>

              {/* Seleção de Personagem */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Escolha seu Personagem Inicial</Text>
                {CHARACTERS_LIST.map((char) => (
                  <TouchableOpacity
                    key={char.id}
                    style={[
                      styles.charCard,
                      selectedChar === char.id && styles.charCardActive,
                    ]}
                    onPress={() => setSelectedChar(char.id)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={getCharacterImage(char.id)}
                      style={styles.charAvatarImg}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.charName, selectedChar === char.id && { color: '#38BDF8' }]}>
                        {char.name}
                      </Text>
                      <Text style={styles.charDescription}>{char.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botão de Concluir */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSalvarPerfil}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Começar a Jogar! 🚀</Text>
                )}
              </TouchableOpacity>

              {/* Botão Pular / Avançar */}
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Pular por enquanto</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 30,
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
  headerIconRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
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
  helperText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  charCard: {
    backgroundColor: '#1E1E2F',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  charAvatarImg: {
    width: 44,
    height: 44,
  },
  charCardActive: {
    borderColor: '#38BDF8', // sky-400
    backgroundColor: '#1F2937',
  },
  charName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  charDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
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
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
