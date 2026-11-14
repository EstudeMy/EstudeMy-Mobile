import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AccessibilityIcon } from './AccessibilityIcon';

/**
 * Botão Flutuante de Acessibilidade Global (Padrão e-MAG / WCAG AAA)
 * Permite ao estudante ou professor acionar recursos de alto contraste,
 * escala de fonte e daltonismo em qualquer tela do aplicativo.
 */
export const FloatingAccessibilityButton: React.FC = () => {
  const { openAccessibilityModal, isAccessibilityModalVisible } = useTheme();

  // Não exibe se o próprio modal já estiver aberto
  if (isAccessibilityModalVisible) return null;

  return (
    <TouchableOpacity
      style={styles.floatingBtn}
      onPress={openAccessibilityModal}
      accessibilityRole="button"
      accessibilityLabel="Menu de Acessibilidade, Alto Contraste e Daltonismo"
      accessibilityHint="Toque para abrir opções de tamanho de texto, contraste e visão"
      activeOpacity={0.85}
    >
      <AccessibilityIcon size={28} color="#000000" accentColor="#00AEEF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 88,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
  },
});

export default FloatingAccessibilityButton;

