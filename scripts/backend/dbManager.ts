import mongoose from 'mongoose';
import { appLogger } from '../logging/appLogger';
import { checkEmergencyDbHealth } from '../config/emergencyDb';
import { syncMongoToPostgres } from './emergencySyncService';

export interface DatabaseStatus {
  primary: {
    type: 'MongoDB';
    status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
    host?: string;
    database?: string;
  };
  emergency: {
    type: 'PostgreSQL';
    enabled: boolean;
    status: 'HEALTHY' | 'UNHEALTHY' | 'DISABLED';
    latencyMs?: number;
    error?: string;
  };
  circuitBreaker: {
    emergencyModeActive: boolean;
    consecutiveFailures: number;
    lastFailoverTimestamp: string | null;
  };
}

class DatabaseManager {
  private isEmergencyModeActive = false;
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private lastFailoverTimestamp: string | null = null;
  private isInitialized = false;

  public initializeWatchdog(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    mongoose.connection.on('connected', () => {
      this.consecutiveFailures = 0;
      if (this.isEmergencyModeActive) {
        appLogger.info('db_manager.mongo_recovered', {
          action: 'PRIMARY_RESTORED',
          message: 'MongoDB recuperado. Agendando sincronização com banco SQL de contingência.',
        });
        this.isEmergencyModeActive = false;
        // Dispara sincronização em segundo plano para refletir alterações
        void syncMongoToPostgres().catch(() => {});
      }
    });

    mongoose.connection.on('disconnected', () => {
      this.consecutiveFailures++;
      appLogger.warn('db_manager.mongo_disconnected', {
        consecutiveFailures: this.consecutiveFailures,
        threshold: this.FAILURE_THRESHOLD,
      });

      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD && !this.isEmergencyModeActive) {
        this.activateEmergencyMode('MongoDB disconnected repeatedly');
      }
    });

    mongoose.connection.on('error', (err) => {
      this.consecutiveFailures++;
      appLogger.error('db_manager.mongo_error', {
        message: err.message,
        consecutiveFailures: this.consecutiveFailures,
      });

      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD && !this.isEmergencyModeActive) {
        this.activateEmergencyMode(err.message);
      }
    });
  }

  public activateEmergencyMode(reason: string): void {
    this.isEmergencyModeActive = true;
    this.lastFailoverTimestamp = new Date().toISOString();
    appLogger.error('db_manager.failover_activated', {
      action: 'CIRCUIT_BREAKER_TRIGGERED',
      reason,
      status: 'EMERGENCY_SQL_ACTIVE',
    });
  }

  public isEmergencyActive(): boolean {
    return this.isEmergencyModeActive;
  }

  public async getStatus(): Promise<DatabaseStatus> {
    const mongoState = mongoose.connection.readyState;
    const mongoStatusMap: Record<number, DatabaseStatus['primary']['status']> = {
      0: 'DISCONNECTED',
      1: 'CONNECTED',
      2: 'CONNECTING',
      3: 'DISCONNECTED',
    };

    const isEmergencyConfigured = Boolean(process.env.POSTGRES_URI || process.env.EMERGENCY_DB_ENABLED);
    const pgHealth = isEmergencyConfigured
      ? await checkEmergencyDbHealth()
      : { ok: false, error: 'Não configurado' };

    return {
      primary: {
        type: 'MongoDB',
        status: mongoStatusMap[mongoState] || 'DISCONNECTED',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
      },
      emergency: {
        type: 'PostgreSQL',
        enabled: isEmergencyConfigured,
        status: !isEmergencyConfigured ? 'DISABLED' : pgHealth.ok ? 'HEALTHY' : 'UNHEALTHY',
        latencyMs: pgHealth.latencyMs,
        error: pgHealth.error,
      },
      circuitBreaker: {
        emergencyModeActive: this.isEmergencyModeActive,
        consecutiveFailures: this.consecutiveFailures,
        lastFailoverTimestamp: this.lastFailoverTimestamp,
      },
    };
  }
}

export const dbManager = new DatabaseManager();
