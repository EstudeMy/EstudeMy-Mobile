/**
 * Utilitários para Geração, Formatação e Leitura de QR Codes do EstudeMy
 */

export const QR_SERVER_BASE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

/**
 * Retorna a URL canônica da trilha com parâmetro opcional de código de acesso.
 * Ao ser escaneado por qualquer câmera padrão de celular, abre diretamente a trilha no navegador.
 */
export function getTrailQrContent(trilhaId: string, codigoAcesso?: string): string {
  const cleanId = trilhaId ? trilhaId.trim() : '';
  const cleanCode = codigoAcesso ? codigoAcesso.trim().toUpperCase() : '';

  if (!cleanId) return cleanCode;

  // URL padrão de produção apontando para a instância AWS
  const baseUrl = 'http://18.222.3.101/trilha';
  if (cleanCode) {
    return `${baseUrl}/${cleanId}?code=${encodeURIComponent(cleanCode)}`;
  }
  return `${baseUrl}/${cleanId}`;
}

/**
 * Retorna o endpoint para renderizar a imagem PNG do QR Code com margem limpa e alto contraste.
 */
export function getQrImageUrl(content: string, size = 320): string {
  const encoded = encodeURIComponent(content);
  return `${QR_SERVER_BASE_URL}?size=${size}x${size}&data=${encoded}&margin=10&format=png`;
}

/**
 * Analisa e extrai o ID da trilha e/ou código de acesso a partir do texto lido pelo scanner.
 * Suporta:
 * 1. URLs completas: http://18.222.3.101/trilha/6727...?code=TRL-XXXXXX
 * 2. Formato customizado: ESTUDEMY:6727...:TRL-XXXXXX
 * 3. Apenas o código: TRL-XXXXXX
 */
export function parseQrCodeData(rawData: string): {
  trilhaId?: string;
  code?: string;
  isUrl: boolean;
} {
  if (!rawData) {
    return { isUrl: false };
  }

  const trimmed = rawData.trim();

  // 1. Verificar se é uma URL (ex: http://.../trilha/:id?code=...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      // Regex para capturar o ID da trilha após /trilha/
      const idMatch = trimmed.match(/\/trilha\/([a-zA-Z0-9_-]+)/);
      const trilhaId = idMatch ? idMatch[1] : undefined;

      // Regex para capturar o parâmetro ?code= ou &code=
      const codeMatch = trimmed.match(/[?&]code=([a-zA-Z0-9_-]+)/i);
      const code = codeMatch ? codeMatch[1].toUpperCase() : undefined;

      return {
        trilhaId,
        code,
        isUrl: true,
      };
    } catch {
      // Falha no parse de URL
    }
  }

  // 2. Verificar formato com prefixo ESTUDEMY
  if (trimmed.toUpperCase().startsWith('ESTUDEMY:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 3) {
      return {
        trilhaId: parts[1],
        code: parts[2].toUpperCase(),
        isUrl: false,
      };
    }
    if (parts.length === 2) {
      const val = parts[1].toUpperCase();
      if (val.startsWith('TRL-')) {
        return { code: val, isUrl: false };
      }
      return { trilhaId: val, isUrl: false };
    }
  }

  // 3. Verificar se é diretamente um código TRL-XXXXXX
  if (trimmed.toUpperCase().startsWith('TRL-') || trimmed.length === 10) {
    return {
      code: trimmed.toUpperCase(),
      isUrl: false,
    };
  }

  // 4. Retorna como código genérico ou ID se for hexadecimal padrão (24 chars)
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
    return {
      trilhaId: trimmed,
      isUrl: false,
    };
  }

  return {
    code: trimmed.toUpperCase(),
    isUrl: false,
  };
}
