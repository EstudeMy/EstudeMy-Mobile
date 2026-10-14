/**
 * EstudeMy - Async Lock & Idempotency Manager (Mitigação de Race Condition - RC09)
 * 
 * - Evita requisições paralelas simultâneas que possam duplicar moedas, XP ou recompensas
 * - Fornece chaves de idempotência para garantir unicidade em ações críticas
 */

class AsyncLockManager {
  private activeLocks: Set<string> = new Set();

  /**
   * Tenta adquirir um lock para uma chave específica.
   * Se a chave já estiver ocupada, retorna false.
   */
  acquire(key: string): boolean {
    if (this.activeLocks.has(key)) {
      return false;
    }
    this.activeLocks.add(key);
    return true;
  }

  /**
   * Libera o lock da chave.
   */
  release(key: string): void {
    this.activeLocks.delete(key);
  }

  /**
   * Executa uma função assíncrona garantindo que ela não execute concorrentemente
   * para a mesma chave.
   */
  async runExclusive<T>(key: string, task: () => Promise<T>): Promise<T | null> {
    if (!this.acquire(key)) {
      // Já está em execução, rejeita chamada duplicada
      return null;
    }

    try {
      return await task();
    } finally {
      this.release(key);
    }
  }

  /**
   * Gera uma chave de idempotência aleatória única (UUID v4)
   * para ser enviada no cabeçalho `Idempotency-Key` das requisições sensíveis
   */
  generateIdempotencyKey(): string {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-4${s4().substr(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
  }
}

export const asyncLock = new AsyncLockManager();
export default asyncLock;
