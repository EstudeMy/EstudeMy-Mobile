import { Router } from 'express';
import {
  getEmergencyStatus,
  triggerEmergencySync,
  inspectEmergencyTable,
} from '../controllers/emergencyController';
import { verificarToken, verificarAdministrador } from '../middlewares/authMiddleware';

const router = Router();

// Rota pública de status / healthcheck para sistemas de monitoramento (Better Stack / Uptime)
router.get('/status', getEmergencyStatus);

// Rotas administrativas protegidas (requer token JWT e permissão de ADMINISTRADOR ou OWNER)
router.post('/sync', verificarToken, verificarAdministrador, triggerEmergencySync);
router.get('/inspect/:tableName', verificarToken, verificarAdministrador, inspectEmergencyTable);

export default router;
