// ==============================================================================
// MongoDB Initialization Script - EstudeMy Cloud (Seção 5 e 8)
// Cria o banco e o usuário da aplicação com privilégios restritos (Least Privilege)
// Executado automaticamente na primeira inicialização do contêiner MongoDB
// ==============================================================================

const dbName = process.env.MONGO_INITDB_DATABASE || 'estudemy';
const appUser = process.env.MONGO_APP_USER || 'estudemy_app';
const appPassword = process.env.MONGO_APP_PASSWORD || 'estudemy_pass_2026';

// Troca para o banco administrativo para criar o usuário do sistema
const adminDb = db.getSiblingDB('admin');

// Cria usuário com perfil de leitura e escrita exclusivo no banco 'estudemy'
adminDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    { role: 'readWrite', db: dbName },
    { role: 'dbAdmin', db: dbName }
  ]
});

// Inicializa o banco da aplicação com coleções essenciais e índices de performance
const appDb = db.getSiblingDB(dbName);

appDb.createCollection('users');
appDb.users.createIndex({ email: 1 }, { unique: true });
appDb.users.createIndex({ 'auth.token': 1 });

appDb.createCollection('trilhas');
appDb.trilhas.createIndex({ slug: 1 }, { unique: true });

appDb.createCollection('fases');
appDb.fases.createIndex({ trilhaId: 1, ordem: 1 });

appDb.createCollection('progresso');
appDb.progresso.createIndex({ userId: 1, trilhaId: 1 });

appDb.createCollection('rankings');
appDb.rankings.createIndex({ pontos: -1 });

print(`[EstudeMy Mongo Init] Banco '${dbName}' e usuário '${appUser}' inicializados com sucesso.`);
