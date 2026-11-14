import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export interface AccessibilityIconProps {
  size?: number;
  color?: string; // Cor das linhas e contornos (default: #000000 ou #FFFFFF)
  accentColor?: string; // Cor dos círculos (cabeça, mãos, pés) (default: #00AEEF)
  style?: ViewStyle;
}

/**
 * Ícone Universal de Acessibilidade da ONU (Novo Padrão Internacional)
 * Substitui o antigo símbolo da cadeira de rodas pelo símbolo humano em harmonia.
 */
export const AccessibilityIcon: React.FC<AccessibilityIconProps> = ({
  size = 24,
  color = '#000000',
  accentColor = '#00AEEF',
  style,
}) => {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Círculo externo principal */}
        <Circle
          cx="50"
          cy="50"
          r="41"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Braços estendidos em arco conectando às extremidades */}
        <Path
          d="M 18 39 Q 50 49 82 39"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Pernas em V invertido conectando aos pés */}
        <Path
          d="M 50 49 L 34 79"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 50 49 L 66 79"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cabeça (círculo azul com contorno escuro) */}
        <Circle
          cx="50"
          cy="26"
          r="11"
          fill={accentColor}
          stroke={color}
          strokeWidth="5"
        />

        {/* Nós dos membros (Mãos e Pés azuis com contorno escuro) */}
        <Circle
          cx="18"
          cy="39"
          r="6.5"
          fill={accentColor}
          stroke={color}
          strokeWidth="4.5"
        />
        <Circle
          cx="82"
          cy="39"
          r="6.5"
          fill={accentColor}
          stroke={color}
          strokeWidth="4.5"
        />
        <Circle
          cx="34"
          cy="79"
          r="6.5"
          fill={accentColor}
          stroke={color}
          strokeWidth="4.5"
        />
        <Circle
          cx="66"
          cy="79"
          r="6.5"
          fill={accentColor}
          stroke={color}
          strokeWidth="4.5"
        />
      </Svg>
    </View>
  );
};

export default AccessibilityIcon;
