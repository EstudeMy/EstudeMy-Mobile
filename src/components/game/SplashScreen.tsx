import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SplashScreenProps {
  onComplete: () => void;
  mensagem?: string;
}

const letterColorsLight: Record<string, string> = {
  E: '#036cf2',
  S: '#0c87f2',
  T: '#0a7307',
  U: '#f2cb07',
  D: '#f24c27',
  E2: '#e8181c',
  M: '#ff00ff',
  Y: '#d946ef',
};

const letterColorsDark: Record<string, string> = {
  E: '#38bdf8',
  S: '#0ea5e9',
  T: '#22c55e',
  U: '#eab308',
  D: '#f97316',
  E2: '#ef4444',
  M: '#ec4899',
  Y: '#d946ef',
};

const letters = [
  { key: 'E', label: 'E' },
  { key: 'S', label: 'S' },
  { key: 'T', label: 'T' },
  { key: 'U', label: 'U' },
  { key: 'D', label: 'D' },
  { key: 'E2', label: 'E' },
  { key: 'M', label: 'M' },
  { key: 'Y', label: 'Y' },
];

export default function GameSplashScreen({
  onComplete,
  mensagem = 'CARREGANDO JOGO...',
}: SplashScreenProps) {
  const { isDark } = useTheme();
  const [filledLetters, setFilledLetters] = useState<number[]>([]);
  const intervalRef = useRef<any>(null);

  const colors = isDark ? letterColorsDark : letterColorsLight;
  const unfilledColor = isDark ? '#3f3f46' : '#cbd5e1';

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFilledLetters((prev) => {
        if (prev.length < letters.length) {
          return [...prev, prev.length];
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return prev;
      });
    }, 140);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (filledLetters.length === letters.length) {
      const timer = setTimeout(() => {
        onComplete();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [filledLetters.length, onComplete]);

  const progressPercent = Math.min(
    100,
    Math.round((filledLetters.length / letters.length) * 100)
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#090a0f' : '#0f172a' }]}>
      {/* Container de Letras com visual Neobrutalista */}
      <View style={styles.lettersRow}>
        {letters.map((item, index) => {
          const isFilled = filledLetters.includes(index);
          const color = isFilled ? colors[item.key] || '#38bdf8' : unfilledColor;

          return (
            <View key={item.key + index} style={styles.letterWrapper}>
              <Text style={[styles.letterText, { color }]}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Barra de Progresso */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Mensagem e Porcentagem */}
      <Text style={styles.messageText}>{mensagem}</Text>
      <Text style={styles.percentText}>{progressPercent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  letterWrapper: {
    paddingHorizontal: 4,
  },
  letterText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressBarBackground: {
    width: '70%',
    maxWidth: 280,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  messageText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  percentText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },
});
