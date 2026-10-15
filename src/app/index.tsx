import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BACKGROUND_IMAGES } from '../constants/assets';
import { SvgXml } from 'react-native-svg';
import { ESTUDE_MY_LOGO_XML } from '../constants/svgs';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Redireciona na LandingPage apenas uma única vez na inicialização
  const hasNavigatedRef = React.useRef(false);
  useEffect(() => {
    const checkNavigation = async () => {
      if (isAuthenticated && user && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        const { isProfileCompleted } = await import('../services/authHelpers');
        const userKey = user.email || user.id || user._id;
        const completed = await isProfileCompleted(userKey);
        
        if ((!user.username || !user.personagem) && !completed) {
          router.replace('/(auth)/completar-perfil' as any);
        } else {
          router.replace('/(tabs)/home');
        }
      }
    };
    checkNavigation();
  }, [isAuthenticated, user, router]);


  return (
    <ImageBackground
      source={isDark ? BACKGROUND_IMAGES.landingDark : BACKGROUND_IMAGES.landingLight}
      style={styles.container}
      resizeMode="cover"
    >

      <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Logo/Título */}
        <View style={styles.header}>
          <View style={{ marginBottom: 10 }}>
            <SvgXml xml={ESTUDE_MY_LOGO_XML} width={310} height={60} />
          </View>
          <Text style={styles.subtext}>Aprenda Jogando!</Text>
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => router.push('/(auth)/cadastro')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Começar agora!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2a',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  welcomeText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 1,
    letterSpacing: 2,
  },
  subtext: {
    fontSize: 20,
    color: '#F3F4F6',
    fontWeight: '700',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    // Efeito de sombra flat retro
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  registerButton: {
    backgroundColor: '#16A34A', // green-600
  },
  loginButton: {
    backgroundColor: '#CA8A04', // yellow-600
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
});
