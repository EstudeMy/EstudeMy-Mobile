import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Accessibility, X, Eye } from 'lucide-react-native';
import { useTheme, DaltonismMode, FontScale } from '../contexts/ThemeContext';

interface AccessibilityModalProps {
  visible: boolean;
  onClose: () => void;
}

const DALTONISM_OPTIONS: { id: DaltonismMode; label: string; desc: string }[] = [
  { id: 'none', label: 'Padrão (Cores Normais)', desc: 'Visão tricromática padrão' },
  { id: 'protanopia', label: 'Protanopia', desc: 'Otimizado para ausência/baixa de vermelho' },
  { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Otimizado para ausência/baixa de verde' },
  { id: 'tritanopia', label: 'Tritanopia', desc: 'Otimizado para ausência/baixa de azul' },
  { id: 'achromatopsia', label: 'Acromatopsia (Monocromático)', desc: 'Alto contraste em escala de cinza e preto/branco' },
];

const FONT_OPTIONS: { id: FontScale; label: string; previewSize: number }[] = [
  { id: 'normal', label: 'Normal (100%)', previewSize: 14 },
  { id: 'large', label: 'Grande (120%)', previewSize: 17 },
  { id: 'extra-large', label: 'Extra Grande (140%)', previewSize: 20 },
];

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ visible, onClose }) => {
  const {
    colors,
    isDark,
    daltonism,
    setDaltonism,
    fontScale,
    setFontScale,
    highContrast,
    setHighContrast,
  } = useTheme();

  const handleReset = async () => {
    await setDaltonism('none');
    await setFontScale('normal');
    await setHighContrast(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header com ícone universal de acessibilidade */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Accessibility size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Acessibilidade</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Personalize contraste, fontes e visão
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal de acessibilidade"
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Seção 1: Alto Contraste */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Modo Alto Contraste</Text>
                  <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                    Aumenta o contraste para leitura perfeita de perto e de longe (WCAG AAA).
                  </Text>
                </View>
                <Switch
                  value={highContrast}
                  onValueChange={(val) => void setHighContrast(val)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Seção 2: Tamanho da Fonte */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tamanho do Texto</Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                Ajuste o tamanho das letras para facilitar a leitura.
              </Text>
              <View style={styles.optionsRow}>
                {FONT_OPTIONS.map((opt) => {
                  const isSelected = fontScale === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.fontPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.cardSecondary,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => void setFontScale(opt.id)}
                    >
                      <Text
                        style={[
                          styles.fontPillText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontSize: opt.previewSize,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Exemplo de Pré-visualização */}
              <View style={[styles.previewBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Prévia de Leitura:</Text>
                <Text
                  style={[
                    styles.previewText,
                    {
                      color: colors.text,
                      fontSize: fontScale === 'normal' ? 14 : fontScale === 'large' ? 17 : 20,
                    },
                  ]}
                >
                  O EstudeMy torna o aprendizado acessível e claro para todos.
                </Text>
              </View>
            </View>

            {/* Seção 3: Modo Daltonismo */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Modo para Daltonismo</Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                Ajusta as paletas e distinções de cores para diferentes tipos de visão.
              </Text>

              <View style={styles.daltonismList}>
                {DALTONISM_OPTIONS.map((item) => {
                  const isSelected = daltonism === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.daltonismCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1E293B'
                              : '#EEF2FF'
                            : colors.cardSecondary,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => void setDaltonism(item.id)}
                    >
                      <View style={styles.daltonismRadio}>
                        <View
                          style={[
                            styles.radioOuter,
                            { borderColor: isSelected ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        <View style={styles.daltonismTextCol}>
                          <Text
                            style={[
                              styles.daltonismLabel,
                              {
                                color: colors.text,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={[styles.daltonismDesc, { color: colors.textSecondary }]}>
                            {item.desc}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amostras de cores ativas */}
              <View style={[styles.colorPreviewContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Paleta Ativa:</Text>
                <View style={styles.swatchRow}>
                  <View style={[styles.swatch, { backgroundColor: colors.primary }]}>
                    <Text style={styles.swatchText}>Principal</Text>
                  </View>
                  <View style={[styles.swatch, { backgroundColor: colors.success }]}>
                    <Text style={styles.swatchText}>Sucesso</Text>
                  </View>
                  <View style={[styles.swatch, { backgroundColor: colors.warning }]}>
                    <Text style={styles.swatchText}>Alerta</Text>
                  </View>
                  <View style={[styles.swatch, { backgroundColor: colors.danger }]}>
                    <Text style={styles.swatchText}>Erro</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer com botões */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Restaurar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.confirmButtonText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  fontPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontPillText: {
    textAlign: 'center',
  },
  previewBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewText: {
    lineHeight: 24,
    fontWeight: '500',
  },
  daltonismList: {
    gap: 8,
    marginTop: 12,
  },
  daltonismCard: {
    padding: 12,
    borderRadius: 10,
  },
  daltonismRadio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  daltonismTextCol: {
    flex: 1,
  },
  daltonismLabel: {
    fontSize: 14,
  },
  daltonismDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  colorPreviewContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  swatch: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
