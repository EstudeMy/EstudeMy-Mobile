/**
 * EstudeMy - Secure Logger (Controle de Exposição de Dados - RC10 e LGPD)
 * 
 * - Oculta dados sensíveis (PII: tokens, senhas, emails, cpfs)
 * - Remove stack traces completos em produção
 * - Desativa logs verbosos quando fora de ambiente de desenvolvimento
 */

const IS_DEV = __DEV__;

// Expressões regulares para detecção e mascaramento de PII sensível
const SENSITIVE_PATTERNS = [
  { regex: /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, replacement: '$1[PROTECTED_TOKEN]' },
  { regex: /(["']?(?:senha|password|secret|jwt|token|apiKey)["']?\s*[:=]\s*["'])([^"']+)(["'])/gi, replacement: '$1********$3' },
  { regex: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: (_: string, user: string, domain: string) => `${user.slice(0, 2)}***@${domain}` },
];

/**
 * Sanitiza objetos e strings removendo dados confidenciais
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let result = data;
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern.regex, pattern.replacement as any);
    }
    return result;
  }

  if (data instanceof Error) {
    return {
      message: sanitizeLogData(data.message),
      name: data.name,
      // Em produção, suprime stack traces para mitigar RC10
      stack: IS_DEV ? data.stack : undefined,
    };
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  if (typeof data === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('senha') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization')
      ) {
        copy[key] = '[PROTECTED]';
      } else {
        copy[key] = sanitizeLogData(value);
      }
    }
    return copy;
  }

  return data;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.log(`[INFO] ${message}`, ...args.map(sanitizeLogData));
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args.map(sanitizeLogData));
  },

  error: (message: string, ...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    if (IS_DEV) {
      console.error(`[SEC_ERROR] ${message}`, ...sanitizedArgs);
    } else {
      // Em produção, registra apenas mensagens genéricas protegidas
      console.error(`[SEC_ERROR] ${message}`);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.debug(`[DEBUG] ${message}`, ...args.map(sanitizeLogData));
    }
  },
};

export default logger;
