import { Pool, QueryResult, QueryResultRow } from 'pg';
import { appLogger, logHandledError } from '../logging/appLogger';

let pool: Pool | null = null;

export const getEmergencyPool = (): Pool => {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URI ||
      'postgresql://estudemy_app:estudemy_app_secure_pass_2026@localhost:5432/estudemy_emergencia';

    const useSsl =
      process.env.POSTGRES_SSL === 'true' ||
      (process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') && !connectionString.includes('postgres:5432'));

    pool = new Pool({
      connectionString,
      max: Number(process.env.POSTGRES_MAX_POOL) || 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: useSsl ? { rejectUnauthorized: process.env.NODE_ENV === 'production' } : false,
    });

    pool.on('error', (err) => {
      void appLogger.error('emergency_db.pool_error', { message: err.message });
    });
  }

  return pool;
};

/**
 * Executa uma consulta SQL parametrizada de forma segura (mitigação RC01: SQL Injection)
 */
export const queryEmergency = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const p = getEmergencyPool();
  const start = Date.now();
  try {
    const res = await p.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      void appLogger.warn('emergency_db.slow_query', { durationMs: duration, query: text.substring(0, 100) });
    }
    return res;
  } catch (error) {
    logHandledError('emergency_db.query', error, { query: text.substring(0, 100) });
    throw error;
  }
};

/**
 * Checa a saúde e conectividade do banco SQL de emergência
 */
export const checkEmergencyDbHealth = async (): Promise<{ ok: boolean; latencyMs?: number; error?: string }> => {
  const start = Date.now();
  try {
    await queryEmergency('SELECT 1 AS healthcheck');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao conectar no PostgreSQL de emergência';
    return { ok: false, error: message };
  }
};

export const closeEmergencyPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
