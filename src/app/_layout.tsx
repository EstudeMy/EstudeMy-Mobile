import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ActivityIndicator, View, useColorScheme } from 'react-native';

function RootLayoutContent() {
  const { loading } = useAuth();
  const colorScheme = useColorScheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#1a1a2a' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Telas Públicas */}
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/cadastro" />
      
      {/* Telas Protegidas (Abas principais e detalhes) */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trilha/[id]" />
      <Stack.Screen name="game/[faseId]" />
      <Stack.Screen name="consultai/index" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LanguageProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <RootLayoutContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
