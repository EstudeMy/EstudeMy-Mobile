import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Trilha } from '../services/trilhaService';
import { copyToClipboard } from '../services/trilhaAcessoService';
import { getTrailQrContent, getQrImageUrl } from '../utils/qrCode';
import { QrCode, Copy, Check, X, Share2 } from 'lucide-react-native';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  trilha?: Trilha | null;
  trilhaId?: string;
  trilhaTitulo?: string;
  titulo?: string;
  codigoAcesso?: string;
}

export default function QRCodeModal({
  visible,
  onClose,
  trilha,
  trilhaId,
  trilhaTitulo,
  titulo,
  codigoAcesso,
}: QRCodeModalProps) {
  const { colors } = useTheme();
  const [loadingImg, setLoadingImg] = useState(true);
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const effectiveId = trilhaId || trilha?._id || '';
  const effectiveTitle = trilhaTitulo || titulo || trilha?.titulo || 'Trilha EstudeMy';
  const effectiveCode = codigoAcesso || trilha?.codigoAcesso || '';

  if (!visible) return null;

  const qrContent = getTrailQrContent(effectiveId, effectiveCode);
  const qrImageUrl = getQrImageUrl(qrContent, 340);

  const handleCopyCode = async () => {
    if (!effectiveCode) return;
    await copyToClipboard(effectiveCode);
    setCopiedType('code');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyLink = async () => {
    await copyToClipboard(qrContent);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Header com botão fechar */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.qrIconBubble}>
                <QrCode size={20} color="#ffffff" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>QR Code da Trilha 📱</Text>
            </View>
            <TouchableOpacity
              style={styles.closeIconBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.trailName, { color: colors.text }]} numberOfLines={2}>
            {effectiveTitle}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Apresente este QR Code em sala de aula ou envie aos alunos para que eles acessem e desbloqueiem a trilha diretamente:
          </Text>

          {/* Moldura Branca do QR Code para leitura perfeita */}
          <View style={styles.qrImageFrame}>
            {loadingImg && (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.qrLoadingText}>Gerando QR Code...</Text>
              </View>
            )}
            <Image
              source={{ uri: qrImageUrl }}
              style={[styles.qrImage, loadingImg && { opacity: 0 }]}
              resizeMode="contain"
              onLoad={() => setLoadingImg(false)}
            />
          </View>

          {/* Código em destaque */}
          {effectiveCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Código de Acesso:</Text>
              <View style={styles.codeDashedBox}>
                <Text style={styles.codeText}>{effectiveCode}</Text>
              </View>
            </View>
          ) : null}

          {/* Botões de Ação */}
          <View style={styles.actionsRow}>
            {effectiveCode ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCode]}
                onPress={handleCopyCode}
                activeOpacity={0.85}
              >
                {copiedType === 'code' ? (
                  <>
                    <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Código Copiado!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Copiar Código</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.actionBtn, styles.btnLink]}
              onPress={handleCopyLink}
              activeOpacity={0.85}
            >
              {copiedType === 'link' ? (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnText}>Link Copiado!</Text>
                </>
              ) : (
                <>
                  <Share2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnText}>Copiar Link</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.cardSecondary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.text }]}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#1b1b1b',
    padding: 22,
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
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeIconBtn: {
    padding: 4,
  },
  trailName: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrImageFrame: {
    width: 240,
    height: 240,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1b1b1b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  qrImage: {
    width: 216,
    height: 216,
  },
  qrLoadingBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  qrLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  codeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  codeDashedBox: {
    backgroundColor: '#09090B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#1b1b1b',
  },
  btnCode: {
    backgroundColor: '#4F46E5',
  },
  btnLink: {
    backgroundColor: '#10B981',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export { QRCodeModal };
