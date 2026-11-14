// Carrega .env antes de qualquer outro módulo ler process.env (tokens Better Stack, Mongo, etc.).
import './config/loadEnv';
import './logging/installConsolePatch';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { httpLogMiddleware } from './middlewares/httpLogMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { registerUnhandledProcessHandlers } from './middlewares/unhandledProcessHandlers';
import { appLogger } from './logging/appLogger';
import { setupSwagger } from './config/swagger';
import { dbManager } from './services/dbManager';

// --- Importação das Rotas ---
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import faseRoutes from './routes/faseRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import homeRoutes from './routes/homeRoutes';
import licaoSalvaRoutes from './routes/licaoSalvaRoutes';
import perguntaRoutes from './routes/perguntaRoutes';
import progressoRoutes from './routes/progressoRoutes';
import rankingRoutes from './routes/rankingRoutes';
import secoesRoutes from './routes/secoesRoutes';
import trilhaRoutes from './routes/trilhaRoutes';
import scoreRoutes from './routes/scoreRoutes';
import materiaRoutes from './routes/materiaRoutes';
import adminRoutes from './routes/adminRoutes';
import emergencyRoutes from './routes/emergencyRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Atrás de proxy (Nginx, Render, etc.) para rate limit e cookies corretos por IP
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}

// --- Middlewares ---
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogMiddleware);

// --- Registro das Rotas ---
setupSwagger(app);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fases', faseRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/licoes-salvas', licaoSalvaRoutes);
app.use('/api/perguntas', perguntaRoutes);
app.use('/api/progresso', progressoRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/secoes', secoesRoutes);
app.use('/api/trilhas', trilhaRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);

// Rota raiz para verificar se o servidor está online
app.get('/', (req, res) => {
    res.send('API do Estudemy está rodando!');
});

app.use(errorHandler);

// --- Inicialização do Servidor ---
if (process.env.NODE_ENV !== 'test') {
    registerUnhandledProcessHandlers();
    
    // Inicializa o watchdog do Circuit Breaker para monitorar MongoDB e PostgreSQL de contingência
    dbManager.initializeWatchdog();

    // Conecta ao banco de dados apenas quando o servidor real é iniciado 
    connectDB().then(() => {
        // Semeadura gerenciada via painel admin / emergência
    });

    app.listen(PORT, () => {
        void appLogger.info('server.started', {
            port: PORT,
            nodeEnv: process.env.NODE_ENV || 'development',
            appEnv: process.env.APP_ENV || 'development',
        });
    });
}

export default app;
