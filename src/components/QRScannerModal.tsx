import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { parseQrCodeData } from '../utils/qrCode';
import { Camera, X, Image as ImageIcon, Key, CheckCircle, ShieldAlert } from 'lucide-react-native';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onCodeScanned?: (parsed: { trilhaId?: string; code?: string; raw: string }) => void;
  onScanSuccess?: (parsed: { trilhaId?: string; code?: string; raw: string }) => void;
}

export default function QRScannerModal({
  visible,
  onClose,
  onCodeScanned,
  onScanSuccess,
}: QRScannerModalProps) {
  const { colors } = useTheme();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isWeb = Platform.OS === 'web';

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDetectedContent = useCallback((rawText: string) => {
    if (!rawText || isProcessing) return;
    setIsProcessing(true);
    setScanSuccess(true);
    stopCamera();

    const parsed = parseQrCodeData(rawText);
    setTimeout(() => {
      const callback = onScanSuccess || onCodeScanned;
      if (callback) {
        callback({ ...parsed, raw: rawText });
      }
    }, 600);
  }, [isProcessing, onCodeScanned, onScanSuccess, stopCamera]);

  const startBarcodeDetection = useCallback(() => {
    if (typeof window === 'undefined') return;

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code'],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleDetectedContent(rawValue);
            }
          }
        } catch {
          // Frame sem leitura
        }
      }, 250);
    }
  }, [handleDetectedContent]);

  const startWebCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Câmera não suportada neste navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Inicia detecção contínua de QR Code via BarcodeDetector nativo se disponível
        startBarcodeDetection();
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError('Permissão de câmera negada ou não disponível.');
    }
  }, [startBarcodeDetection]);

  const handleClose = useCallback(() => {
    stopCamera();
    setScanSuccess(false);
    setCameraError(null);
    setIsProcessing(false);
    onClose();
  }, [onClose, stopCamera]);

  // Iniciar e finalizar câmera no Web
  useEffect(() => {
    if (!visible) return;

    if (activeTab === 'camera' && isWeb) {
      void startWebCamera();
    }

    return () => {
      stopCamera();
    };
  }, [visible, activeTab, isWeb, startWebCamera, stopCamera]);
            if (rawValue) {
              handleDetectedContent(rawValue);
            }
          }
        } catch {
          // Frame sem leitura
        }
      }, 250);
    }
  };

  const handleImageUpload = (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    const img = new (window as any).Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0) {
              handleDetectedContent(barcodes[0].rawValue);
              return;
            }
          } catch {
            // detector fail
          }
        }
        setCameraError('Nenhum QR code detectado na imagem. Digite o código manualmente abaixo.');
        setActiveTab('manual');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleDetectedContent(manualCode.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.cameraIconBubble}>
                <Camera size={20} color="#ffffff" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Escanear QR Code 📷</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Abas: Câmera vs Digitar Código */}
          <View style={[styles.tabBar, { backgroundColor: colors.cardSecondary }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'camera' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('camera')}
              activeOpacity={0.8}
            >
              <Camera size={16} color={activeTab === 'camera' ? '#ffffff' : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabBtnText, { color: activeTab === 'camera' ? '#ffffff' : colors.textMuted }]}>
                Câmera ao Vivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'manual' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('manual')}
              activeOpacity={0.8}
            >
              <Key size={16} color={activeTab === 'manual' ? '#ffffff' : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabBtnText, { color: activeTab === 'manual' ? '#ffffff' : colors.textMuted }]}>
                Digitar Código
              </Text>
            </TouchableOpacity>
          </View>

          {scanSuccess ? (
            <View style={styles.successBox}>
              <CheckCircle size={56} color="#10B981" />
              <Text style={[styles.successTitle, { color: colors.text }]}>QR Code Lido com Sucesso! 🎉</Text>
              <Text style={[styles.successDesc, { color: colors.textMuted }]}>
                Localizando e desbloqueando a trilha...
              </Text>
            </View>
          ) : activeTab === 'camera' ? (
            <View style={styles.cameraContainer}>
              {/* Visor de Câmera */}
              <View style={styles.viewfinderFrame}>
                {isWeb && (
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 14,
                    }}
                    autoPlay
                    playsInline
                    muted
                  />
                )}

                {/* Linha animada de Scanner e Mira */}
                <View style={styles.viewfinderCrosshairs}>
                  <View style={[styles.cornerMarker, styles.cornerTL]} />
                  <View style={[styles.cornerMarker, styles.cornerTR]} />
                  <View style={[styles.cornerMarker, styles.cornerBL]} />
                  <View style={[styles.cornerMarker, styles.cornerBR]} />
                  <View style={styles.scanLaser} />
                </View>
              </View>

              {cameraError ? (
                <View style={styles.cameraErrorCard}>
                  <ShieldAlert size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.cameraErrorText}>{cameraError}</Text>
                </View>
              ) : (
                <Text style={[styles.instructionText, { color: colors.textMuted }]}>
                  Aponte para o QR Code da trilha exibido na tela ou impresso pelo professor.
                </Text>
              )}

              {/* Botão de Upload de Foto com QR Code */}
              {isWeb && (
                <View style={{ width: '100%', marginTop: 10 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <TouchableOpacity
                    style={[styles.uploadImageBtn, { backgroundColor: colors.cardSecondary }]}
                    onPress={() => fileInputRef.current?.click()}
                    activeOpacity={0.85}
                  >
                    <ImageIcon size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                    <Text style={[styles.uploadImageBtnText, { color: colors.text }]}>
                      Escanear a partir de Imagem / Print
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Tab de Entrada Manual */
            <View style={styles.manualContainer}>
              <Text style={[styles.instructionText, { color: colors.textMuted, textAlign: 'left' }]}>
                Se não puder usar a câmera agora, digite o código de acesso da trilha fornecido pelo professor:
              </Text>
              <TextInput
                style={[
                  styles.manualInput,
                  { backgroundColor: colors.cardSecondary, color: colors.text },
                ]}
                placeholder="Ex: TRL-8K4M9Q"
                placeholderTextColor={colors.textMuted}
                value={manualCode}
                onChangeText={(t) => setManualCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.submitManualBtn}
                onPress={handleManualSubmit}
                activeOpacity={0.85}
              >
                <Key size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.submitManualBtnText}>Desbloquear Trilha</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border || '#1b1b1b' }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    width: '100%',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cameraContainer: {
    width: '100%',
    alignItems: 'center',
  },
  viewfinderFrame: {
    width: 250,
    height: 250,
    backgroundColor: '#09090B',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewfinderCrosshairs: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#10B981',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  scanLaser: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: '50%',
    height: 2.5,
    backgroundColor: '#10B981',
    boxShadow: '0 0 10px #10B981',
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  cameraErrorCard: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraErrorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    width: '100%',
  },
  uploadImageBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  manualContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  manualInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitManualBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
    width: '100%',
    marginBottom: 10,
  },
  submitManualBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
});
