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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getCharacterImage, BACKGROUND_IMAGES } from '../../constants/assets';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react-native';

const CHARACTERS_LIST = [
  { id: 'Samurai', name: 'Samurai', description: 'Guerreiro de honra com ataques rápidos de espada.' },
  { id: 'Mago', name: 'Mago', description: 'Conjurador de feitiços com alto poder de mana.' },
  { id: 'Guerreiro', name: 'Guerreiro', description: 'Combatente forte e resistente com alto HP.' },
];


export default function CadastroScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // Formato DD/MM/AAAA
  const [tipoUsuario, setTipoUsuario] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [selectedChar, setSelectedChar] = useState('Samurai');

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
    if (!nome || !username || !email || !senha || !dataNascimento) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (tipoUsuario === 'PROFESSOR' && (!registroProfissional || !titulacao)) {
      setErrorMsg('Por favor, preencha seu Registro Profissional e Titulação.');
      return;
    }

    // Converter data de nascimento DD/MM/AAAA para ISO Date string
    const dateParts = dataNascimento.split('/');
    if (dateParts.length !== 3) {
      setErrorMsg('Data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // AAAA-MM-DD

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Registrar o usuário com o personagem escolhido
      await api.post('/api/auth/register', {
        nome: nome.trim(),
        email: email.trim(),
        senha: senha,
        username: username.trim().toLowerCase(),
        dataNascimento: formattedDate,
        tipoUsuario: tipoUsuario,
        personagem: selectedChar,
        aceiteTermos: true,
        registroProfissional: tipoUsuario === 'PROFESSOR' ? registroProfissional.trim() : undefined,
        titulacao: tipoUsuario === 'PROFESSOR' ? titulacao : undefined,
      });

      // 2. Realizar login automático logo em seguida
      const loginRes = await api.post('/api/auth/login', {
        email: email.trim(),
        identifier: email.trim(),
        senha: senha,
      });

      const token = loginRes.data.token;
      const userObj = loginRes.data.usuario || loginRes.data.user;

      // 3. Garantir a atualização do personagem selecionado
      try {
        await api.put('/api/users/atualizar-personagem', {
          personagem: selectedChar,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (charError) {
        console.warn('Personagem já atribuído no cadastro:', charError);
      }

      // 4. Logar a sessão localmente
      await login(token, userObj);
      router.replace('/(tabs)/home');

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      const msg = error.response?.data?.message || 'Erro ao realizar cadastro. Tente outro e-mail ou usuário.';
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
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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

              {/* Nome de Usuário */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome de Usuário (username)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: joaodev"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  placeholder="Senha forte"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                  autoCapitalize="none"
                />
              </View>

              {/* Data de Nascimento */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Data de Nascimento (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 15/08/2000"
                  placeholderTextColor="#9CA3AF"
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

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
                      <Text style={styles.charName}>{char.name}</Text>
                      <Text style={styles.charDescription}>{char.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

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
                  <Text style={styles.buttonText}>Cadastrar e Jogar!</Text>
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
    borderColor: '#16A34A', // green-600 border for active character
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
