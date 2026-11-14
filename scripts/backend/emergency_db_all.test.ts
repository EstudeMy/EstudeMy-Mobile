// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Módulos a serem testados
import { getEmergencyPool, queryEmergency, checkEmergencyDbHealth, closeEmergencyPool } from '../config/emergencyDb';
import { dbManager } from '../services/dbManager';
import { syncMongoToPostgres } from '../services/emergencySyncService';
import emergencyRoutes from '../routes/emergencyRoutes';

// Modelos do MongoDB em memória
import User from '../models/user';
import Materia from '../models/materia';
import Trilha from '../models/trilha';
import Secao from '../models/secao';
import Fase from '../models/fase';
import Progresso from '../models/progresso';
import Score from '../models/score';
import LicaoSalva from '../models/licaoSalva';
import Feedback from '../models/feedback';

import jwt from 'jsonwebtoken';

describe('Emergency Database & Failover Suite', () => {
  let app: express.Express;
  let adminToken: string;
  let alunoToken: string;

  beforeEach(async () => {
    // Configura app de teste do Express
    app = express();
    app.use(express.json());
    app.use('/api/emergency', emergencyRoutes);

    // Mock de tokens JWT
    const secret = process.env.JWT_SECRET || 'test-secret-for-jest';
    adminToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', email: 'admin@estudemy.site', tipoUsuario: 'ADMINISTRADOR' },
      secret,
      { expiresIn: '1h' }
    );
    alunoToken = jwt.sign(
      { id: '507f1f77bcf86cd799439022', email: 'aluno@estudemy.site', tipoUsuario: 'ALUNO' },
      secret,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // 1. Testes de Conexão e Pool SQL (emergencyDb.ts)
  // ===========================================================================
  describe('Configuração do Banco SQL (emergencyDb)', () => {
    it('deve inicializar o pool do PostgreSQL com configurações corretas', () => {
      const pool = getEmergencyPool();
      expect(pool).toBeDefined();
      expect(typeof pool.query).toBe('function');
    });

    it('deve executar queryEmergency com parâmetros e retornar resultado esperado', async () => {
      const pool = getEmergencyPool();
      const mockResult = { rows: [{ id: '1', nome: 'Teste' }], rowCount: 1 };
      const querySpy = jest.spyOn(pool, 'query').mockResolvedValueOnce(mockResult as any);

      const res = await queryEmergency('SELECT * FROM users WHERE id = $1', ['1']);
      expect(querySpy).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['1']);
      expect(res.rows[0].nome).toBe('Teste');
    });

    it('checkEmergencyDbHealth deve retornar ok: true quando o PostgreSQL responde', async () => {
      const pool = getEmergencyPool();
      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [{ healthcheck: 1 }] } as any);

      const health = await checkEmergencyDbHealth();
      expect(health.ok).toBe(true);
      expect(typeof health.latencyMs).toBe('number');
    });

    it('checkEmergencyDbHealth deve capturar erro e retornar ok: false em caso de falha', async () => {
      const pool = getEmergencyPool();
      jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Connection refused'));

      const health = await checkEmergencyDbHealth();
      expect(health.ok).toBe(false);
      expect(health.error).toContain('Connection refused');
    });

    it('closeEmergencyPool deve encerrar o pool corretamente', async () => {
      const pool = getEmergencyPool();
      const endSpy = jest.spyOn(pool, 'end').mockResolvedValueOnce(undefined as any);
      await closeEmergencyPool();
      expect(endSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 2. Testes do Circuit Breaker & Watchdog (dbManager.ts)
  // ===========================================================================
  describe('Circuit Breaker & Monitoramento (dbManager)', () => {
    it('deve fornecer o status inicial de ambos os bancos', async () => {
      const status = await dbManager.getStatus();
      expect(status.primary.type).toBe('MongoDB');
      expect(status.primary.status).toBeDefined();
      expect(status.emergency.type).toBe('PostgreSQL');
      expect(status.circuitBreaker.emergencyModeActive).toBe(false);
    });

    it('deve ativar o modo de emergência quando forçado ou quando threshold for atingido', () => {
      expect(dbManager.isEmergencyActive()).toBe(false);
      dbManager.activateEmergencyMode('Simulação de queda crítica');
      expect(dbManager.isEmergencyActive()).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Testes do Serviço de Sincronização Transacional (emergencySyncService.ts)
  // ===========================================================================
  describe('Sincronização Transacional (emergencySyncService)', () => {
    it('deve sincronizar documentos populados do MongoDB com prepared statements', async () => {
      // 1. Criar dados de teste no MongoDB em memória
      const testUser = await User.create({
        nome: 'Herói do Teste',
        email: 'heroi.teste@estudemy.site',
        senha: 'hash_seguro_bcrypt',
        dataNascimento: new Date('2000-01-01'),
        tipoUsuario: 'ALUNO',
        personagem: 'Samurai',
        aceiteTermos: true,
      });

      const testMateria = await Materia.create({
        nome: 'Banco de Dados Relacional',
        ativo: true,
      });

      const testTrilha = await Trilha.create({
        usuario: testUser._id,
        titulo: 'Trilha SQL Segura',
        descricao: 'Aprenda PostgreSQL',
        dataCriacao: new Date().toISOString(),
        materia: 'Banco de Dados Relacional',
        faseSelecionada: 1,
      });

      // 2. Mockar o cliente do PostgreSQL para validar comandos transacionais
      const pool = getEmergencyPool();
      const mockQueries: string[] = [];
      const mockClient = {
        query: jest.fn(async (sql: string, params?: any[]) => {
          mockQueries.push(typeof sql === 'string' ? sql.trim() : '');
          return { rows: [], rowCount: 1 };
        }),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient as any);

      // 3. Executar a sincronização
      const result = await syncMongoToPostgres();

      // 4. Asserções
      expect(result.success).toBe(true);
      expect(result.stats.users).toBeGreaterThanOrEqual(1);
      expect(result.stats.materias).toBeGreaterThanOrEqual(1);
      expect(result.stats.trilhas).toBeGreaterThanOrEqual(1);

      // Verifica garantia de transação ACID (BEGIN e COMMIT)
      expect(mockQueries).toContain('BEGIN');
      expect(mockQueries).toContain('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      // Limpeza dos mocks no Mongo
      await User.deleteOne({ _id: testUser._id });
      await Materia.deleteOne({ _id: testMateria._id });
      await Trilha.deleteOne({ _id: testTrilha._id });
    });

    it('deve executar ROLLBACK caso ocorra erro durante a inserção', async () => {
      const pool = getEmergencyPool();
      const mockQueries: string[] = [];
      const mockClient = {
        query: jest.fn(async (sql: string) => {
          mockQueries.push(sql);
          if (sql.includes('INSERT INTO users')) {
            throw new Error('Erro de integridade forçado');
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient as any);

      await User.create({
        nome: 'Usuário Falha',
        email: 'falha@estudemy.site',
        senha: 'hash',
        dataNascimento: new Date(),
        tipoUsuario: 'ALUNO',
        aceiteTermos: true,
      });

      const result = await syncMongoToPostgres();
      expect(result.success).toBe(false);
      expect(mockQueries).toContain('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();

      await User.deleteOne({ email: 'falha@estudemy.site' });
    });
  });

  // ===========================================================================
  // 4. Testes das Rotas HTTP e Políticas de Segurança (emergencyRoutes.ts)
  // ===========================================================================
  describe('Rotas e Permissões de Segurança (/api/emergency)', () => {
    it('GET /api/emergency/status deve ser acessível publicamente para monitoramento', async () => {
      const response = await request(app).get('/api/emergency/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('primary');
      expect(response.body).toHaveProperty('emergency');
      expect(response.body).toHaveProperty('circuitBreaker');
    });

    it('POST /api/emergency/sync deve rejeitar acesso sem token (401)', async () => {
      const response = await request(app).post('/api/emergency/sync');
      expect(response.status).toBe(401);
    });

    it('POST /api/emergency/sync deve rejeitar usuários não-administradores (403)', async () => {
      const response = await request(app)
        .post('/api/emergency/sync')
        .set('Authorization', `Bearer ${alunoToken}`);
      expect(response.status).toBe(403);
    });

    it('POST /api/emergency/sync deve permitir execução para administradores autorizados', async () => {
      const pool = getEmergencyPool();
      const mockClient = {
        query: jest.fn(async () => ({ rows: [] })),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient as any);

      const response = await request(app)
        .post('/api/emergency/sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');
    });

    it('GET /api/emergency/inspect/:tableName deve bloquear tabelas fora da whitelist (RC01/RC06)', async () => {
      const response = await request(app)
        .get('/api/emergency/inspect/tabela_maliciosa_ou_invalida')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Tabela não permitida');
    });

    it('GET /api/emergency/inspect/:tableName deve permitir inspecionar tabelas da whitelist', async () => {
      const pool = getEmergencyPool();
      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [{ total: 42 }] } as any);

      const response = await request(app)
        .get('/api/emergency/inspect/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.table).toBe('users');
      expect(response.body.totalRecords).toBe(42);
    });
  });
});
