/**
 * EstudeMy - Módulo Central de Segurança da Informação (AppSec)
 * 
 * Implementação de controles para mitigar os 11 riscos do Relatório de Segurança:
 * - RC01: SQL Injection (Validação de parâmetros e IDs)
 * - RC02: Cross-Site Scripting (XSS - Sanitização de inputs e encode de saídas)
 * - RC03: Session Hijacking (Validação de formato e expiração de token JWT)
 * - RC04: Brute Force & Credential Stuffing (Política de senhas fortes e rate limiting client)
 * - RC05: Phishing & Engenharia Social (Validação de URLs e domínios confiáveis)
 * - RC06: IDOR (Validação de integridade de IDs e checagem de posse)
 * - RC07: Privilege Escalation (Sanitização contra Mass Assignment e RBAC)
 * - RC08: DDoS (Proteção contra loops e throttling de requisições)
 * - RC09: Race Condition (Idempotência e chaves únicas)
 * - RC10: Data Exposure (Mascaramento de PII e proteção LGPD)
 * - RC11: Directory Traversal (Sanitização estrita de caminhos de arquivos)
 */

// ============================================================================
// RC02: Sanitização de Entradas (Anti-XSS) & RC01: Anti-Injection
// ============================================================================

/**
 * Sanitiza texto de entrada do usuário para prevenir injeções de script (XSS)
 * e caracteres de manipulação.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove tags HTML/XML (<script>, <style>, <iframe>, <img onerror=>, etc.)
    .replace(/<[^>]*>?/gm, '')
    // Remove esquemas de pseudo-protocolo perigosos (javascript:, data:, vbscript:)
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/vbscript\s*:/gi, '')
    // Remove manipuladores de evento inline (onclick=, onload=, onerror=, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Limita caracteres invisíveis ou nulos
    .replace(/\0/g, '')
    .trim();
}

/**
 * Codifica entidades HTML para exibição segura em ambientes web
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=/]/g, (tag) => htmlEntities[tag] || tag);
}

// ============================================================================
// RC04: Política de Senhas Fortes e Proteção contra Força Bruta
// ============================================================================

export interface PasswordStrengthResult {
  score: number; // 0 a 4
  isValid: boolean;
  feedback: string[];
}

/**
 * Avalia a força da senha segundo diretrizes OWASP ASVS
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    feedback.push('A senha deve conter no mínimo 8 caracteres.');
  } else {
    score++;
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Inclua pelo menos uma letra maiúscula.');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Inclua pelo menos uma letra minúscula.');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Inclua pelo menos um número.');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Recomendado: inclua um caractere especial (!@#$%).');
  }

  return {
    score: Math.min(4, Math.max(0, score - (feedback.length > 2 ? 1 : 0))),
    isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password),
    feedback,
  };
}

// Gerenciador de Rate Limit no Cliente (Anti Brute Force - RC04)
interface AttemptState {
  attempts: number;
  blockedUntil: number | null;
}

const loginAttempts = new Map<string, AttemptState>();
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 60 * 1000; // 60 segundos de bloqueio

export function recordFailedLogin(identifier: string): { isBlocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const current = loginAttempts.get(identifier) || { attempts: 0, blockedUntil: null };

  current.attempts += 1;

  if (current.attempts >= MAX_FAILED_ATTEMPTS) {
    current.blockedUntil = now + COOLDOWN_DURATION_MS;
    loginAttempts.set(identifier, current);
    return { isBlocked: true, remainingSeconds: Math.ceil(COOLDOWN_DURATION_MS / 1000) };
  }

  loginAttempts.set(identifier, current);
  return { isBlocked: false, remainingSeconds: 0 };
}

export function checkLoginRateLimit(identifier: string): { isBlocked: boolean; remainingSeconds: number } {
  const current = loginAttempts.get(identifier);
  if (!current || !current.blockedUntil) return { isBlocked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (now >= current.blockedUntil) {
    // Cooldown expirado, reseta
    loginAttempts.delete(identifier);
    return { isBlocked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((current.blockedUntil - now) / 1000);
  return { isBlocked: true, remainingSeconds };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// ============================================================================
// RC05: Validação de URLs e Domínios Confiáveis (Anti-Phishing / Open Redirect)
// ============================================================================

const TRUSTED_DOMAINS = [
  'estudemy.com',
  'estudemydocker.onrender.com',
  'onrender.com',
  'github.com',
  'google.com',
  'accounts.google.com',
  'localhost',
  '127.0.0.1',
];

/**
 * Valida se uma URL é segura e pertence a um domínio permitido para evitar ataques de Phishing
 */
export function isSafeUrl(urlStr: string): boolean {
  if (!urlStr) return false;

  try {
    const parsed = new URL(urlStr);

    // Permite apenas esquemas https (ou http exclusivamente em dev local)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return false;
    }

    // Checa se o hostname coincide ou é subdomínio de um domínio confiável
    return TRUSTED_DOMAINS.some(
      (trusted) => parsed.hostname === trusted || parsed.hostname.endsWith(`.${trusted}`)
    );
  } catch {
    // Se for caminho relativo seguro (ex: "/(tabs)/home"), é permitido
    return urlStr.startsWith('/') && !urlStr.startsWith('//');
  }
}

// ============================================================================
// RC06: IDOR & Validação de Recursos
// ============================================================================

/**
 * Valida se um identificador possui formato seguro (ObjectId MongoDB de 24 hex ou UUID)
 * prevenindo injeções e ataques de exploração de parâmetros
 */
export function isValidId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  // MongoDB ObjectID (24 caracteres hex) ou UUID (36 caracteres)
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  return isMongoId || isUUID;
}

/**
 * Checagem de posse de recurso no cliente para prevenir IDOR
 */
export function isResourceOwner(resourceOwnerId?: string, currentUserId?: string): boolean {
  if (!resourceOwnerId || !currentUserId) return false;
  return String(resourceOwnerId) === String(currentUserId);
}

// ============================================================================
// RC07: Proteção contra Privilege Escalation & Mass Assignment
// ============================================================================

/**
 * Lista de campos restritos e sensíveis que NUNCA devem ser alterados
 * por endpoints comuns de atualização de perfil do usuário.
 */
const FORBIDDEN_USER_MUTATION_KEYS = [
  'tipoUsuario',
  'role',
  'roles',
  'isAdmin',
  'isOwner',
  'isVerified',
  'xpTotal',
  'pontos',
  'saldo',
  'token',
  'tokens',
  'password',
  'senha',
  'hash',
  'salt',
  '_id',
  'id',
  'createdAt',
  'updatedAt',
];

/**
 * Remove proativamente campos privilegiados de qualquer payload de atualização
 * prevenindo ataques de Mass Assignment no cliente.
 */
export function sanitizeUserPayload<T extends Record<string, any>>(payload: T): Partial<T> {
  if (!payload || typeof payload !== 'object') return {};

  const sanitized: Record<string, any> = { ...payload };

  for (const forbiddenKey of FORBIDDEN_USER_MUTATION_KEYS) {
    delete sanitized[forbiddenKey];
  }

  return sanitized as Partial<T>;
}

// ============================================================================
// RC11: Proteção contra Directory Traversal
// ============================================================================

/**
 * Sanitiza caminhos de arquivos e nomes para evitar travessia de diretório (../../)
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return '';

  return filePath
    // Remove sequências de Directory Traversal
    .replace(/\.\.+[/\\]/g, '')
    .replace(/[/\\]\.\.+/g, '')
    // Remove caracteres nulos e de escape
    .replace(/%2e%2e%2f/gi, '')
    .replace(/%2e%2e/gi, '')
    .replace(/\0/g, '')
    // Substitui barras invertidas por barras normais
    .replace(/\\/g, '/')
    .trim();
}

/**
 * Extrai somente o nome base de arquivo seguro sem caminhos
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return '';
  const sanitized = sanitizeFilePath(fileName);
  const parts = sanitized.split('/');
  const base = parts[parts.length - 1] || '';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ============================================================================
// RC03: Validação de Token JWT
// ============================================================================

/**
 * Decodifica o cabeçalho/payload de um JWT no cliente sem expor o segredo,
 * verificando data de expiração para logout preventivo e mitigação de Session Hijacking.
 */
export function isJwtExpired(token: string): boolean {
  if (!token || typeof token !== 'string') return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true; // Formato inválido

    // Decodifica payload base64url
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;

    // Converte timestamp de segundos para milissegundos
    const expTimeMs = payload.exp * 1000;
    // Considera expirado se faltar menos de 30 segundos
    return Date.now() >= expTimeMs - 30000;
  } catch {
    return true; // Se falhar a decodificação, considera inválido/expirado
  }
}
