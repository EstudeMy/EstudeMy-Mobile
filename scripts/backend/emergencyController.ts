import { Request, Response } from 'express';
import { dbManager } from '../services/dbManager';
import { syncMongoToPostgres } from '../services/emergencySyncService';
import { queryEmergency } from '../config/emergencyDb';
import { logHandledError } from '../logging/appLogger';

export const getEmergencyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await dbManager.getStatus();
    res.json(status);
  } catch (error) {
    logHandledError('emergencyController.getStatus', error);
    res.status(500).json({ error: 'Erro ao verificar status dos bancos de dados' });
  }
};

export const triggerEmergencySync = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncMongoToPostgres();
    if (result.success) {
      res.json({
        message: 'Sincronização com banco SQL de emergência concluída com sucesso!',
        result,
      });
    } else {
      res.status(500).json({
        message: 'Falha durante a sincronização com banco SQL de emergência',
        result,
      });
    }
  } catch (error) {
    logHandledError('emergencyController.triggerSync', error);
    res.status(500).json({ error: 'Erro interno ao disparar sincronização' });
  }
};

export const inspectEmergencyTable = async (req: Request, res: Response): Promise<void> => {
  const rawTableName = req.params.tableName;
  const tableName = Array.isArray(rawTableName) ? rawTableName[0] : String(rawTableName || '');
  const allowedTables = ['users', 'materias', 'trilhas', 'secoes', 'fases', 'progresso', 'scores', 'licoes_salvas'];

  if (!allowedTables.includes(tableName)) {
    res.status(400).json({ error: 'Tabela não permitida para inspeção de segurança' });
    return;
  }

  try {
    // Sanitizado por whitelist estrita acima
    const countResult = await queryEmergency(`SELECT COUNT(*)::int AS total FROM ${tableName}`);
    res.json({
      table: tableName,
      totalRecords: countResult.rows[0]?.total || 0,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    logHandledError('emergencyController.inspectTable', error);
    res.status(500).json({ error: `Erro ao inspecionar tabela ${tableName}` });
  }
};
