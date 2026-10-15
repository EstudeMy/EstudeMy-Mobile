-- =============================================================================
-- BANCO DE DADOS DE EMERGÊNCIA & BACKUP - ESTUDEMY
-- Compatível com PostgreSQL 16+
-- Executado automaticamente na inicialização do contêiner Docker
-- =============================================================================

-- Habilita extensões para UUIDs e funções criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Esquema isolado para controle e segurança estrita
CREATE SCHEMA IF NOT EXISTS emerg_db;
SET search_path TO emerg_db, public;

-- -----------------------------------------------------------------------------
-- Tipos Enumerados (Garantia de Integridade e Validação de Domínio)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE tipo_usuario_enum AS ENUM ('ALUNO', 'PROFESSOR', 'ADMINISTRADOR', 'OWNER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_usuario_enum AS ENUM ('ATIVO', 'BLOQUEADO', 'BANIDO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tema_enum AS ENUM ('light', 'dark');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE idioma_enum AS ENUM ('pt-BR', 'en-US', 'es-ES');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE personagem_enum AS ENUM ('', 'Guerreiro', 'Mago', 'Samurai');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE dificuldade_enum AS ENUM ('Facil', 'Medio', 'Dificil');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE disponibilidade_enum AS ENUM ('Privado', 'Aberto');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pagamento_enum AS ENUM ('Paga', 'Gratuita');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE feedback_tipo_enum AS ENUM ('bug', 'suggestion', 'doubt', 'praise', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- -----------------------------------------------------------------------------
-- 1. TABELA: users (Contas de usuários e heróis gamificados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(24) PRIMARY KEY, -- Paridade direta com ObjectId do MongoDB
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    tipo_usuario tipo_usuario_enum NOT NULL DEFAULT 'ALUNO',
    username VARCHAR(100) UNIQUE,
    personagem personagem_enum DEFAULT '',
    foto_perfil TEXT DEFAULT '',
    materia_favorita VARCHAR(100) DEFAULT '',
    xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
    telefone VARCHAR(30) DEFAULT '',
    endereco TEXT DEFAULT '',
    aceite_termos BOOLEAN NOT NULL DEFAULT FALSE,
    data_aceite_termos TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    tema tema_enum NOT NULL DEFAULT 'light',
    idioma idioma_enum NOT NULL DEFAULT 'pt-BR',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    token_expires TIMESTAMP WITH TIME ZONE,
    two_factor_secret TEXT DEFAULT NULL,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_backup_codes JSONB DEFAULT '[]'::jsonb,
    two_factor_failed_attempts INTEGER NOT NULL DEFAULT 0,
    two_factor_lock_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    status status_usuario_enum NOT NULL DEFAULT 'ATIVO',
    bloqueado_ate TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    can_promote_to_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL AND username <> '';
CREATE INDEX IF NOT EXISTS idx_users_xp_total ON users(xp_total DESC);

-- -----------------------------------------------------------------------------
-- 2. TABELA: materias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materias (
    id VARCHAR(24) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. TABELA: trilhas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trilhas (
    id VARCHAR(24) PRIMARY KEY,
    usuario_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao VARCHAR(50) NOT NULL,
    data_termino VARCHAR(50),
    materia VARCHAR(100) NOT NULL,
    dificuldade dificuldade_enum NOT NULL DEFAULT 'Facil',
    disponibilidade disponibilidade_enum NOT NULL DEFAULT 'Privado',
    pagamento pagamento_enum NOT NULL DEFAULT 'Gratuita',
    fase_selecionada INTEGER NOT NULL DEFAULT 1,
    imagem VARCHAR(255) DEFAULT '/img/fases/vila.jpg',
    visualizacoes INTEGER NOT NULL DEFAULT 0 CHECK (visualizacoes >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trilhas_usuario ON trilhas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_trilhas_materia ON trilhas(materia);
CREATE INDEX IF NOT EXISTS idx_trilhas_visualizacoes ON trilhas(visualizacoes DESC);

-- Tabela associativa: usuários que iniciaram a trilha (N:N)
CREATE TABLE IF NOT EXISTS trilha_usuarios_iniciaram (
    trilha_id VARCHAR(24) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trilha_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. TABELA: secoes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS secoes (
    id VARCHAR(24) PRIMARY KEY,
    trilha_id VARCHAR(24) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT DEFAULT '',
    ordem INTEGER NOT NULL CHECK (ordem >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_trilha_secao_ordem UNIQUE (trilha_id, ordem)
);

CREATE INDEX IF NOT EXISTS idx_secoes_trilha_ordem ON secoes(trilha_id, ordem);

-- -----------------------------------------------------------------------------
-- 5. TABELA: fases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fases (
    id VARCHAR(24) PRIMARY KEY,
    trilha_id VARCHAR(24) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    secao_id VARCHAR(24) REFERENCES secoes(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT DEFAULT '',
    ordem INTEGER NOT NULL CHECK (ordem >= 0),
    personagem_selecionado VARCHAR(50) DEFAULT 'samurai',
    cenario VARCHAR(100) DEFAULT 'bg_dojo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fases_trilha_ordem ON fases(trilha_id, ordem);
CREATE INDEX IF NOT EXISTS idx_fases_secao ON fases(secao_id);

-- -----------------------------------------------------------------------------
-- 6. TABELA: perguntas (Normalização das perguntas aninhadas da fase)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perguntas (
    id BIGSERIAL PRIMARY KEY,
    fase_id VARCHAR(24) NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    alternativas JSONB NOT NULL,
    resposta_correta VARCHAR(255) NOT NULL,
    ordem_pergunta INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perguntas_fase ON perguntas(fase_id);

-- -----------------------------------------------------------------------------
-- 7. TABELA: progresso (Histórico de conclusão e pontuação das fases)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progresso (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fase_id VARCHAR(24) NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
    trilha_id VARCHAR(24) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    pontuacao INTEGER NOT NULL CHECK (pontuacao >= 0),
    total_perguntas INTEGER NOT NULL CHECK (total_perguntas > 0),
    porcentagem_acertos NUMERIC(5,2) NOT NULL CHECK (porcentagem_acertos >= 0 AND porcentagem_acertos <= 100),
    xp_ganho INTEGER NOT NULL DEFAULT 0 CHECK (xp_ganho >= 0),
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    respostas_usuario JSONB DEFAULT '[]'::jsonb,
    perguntas_respondidas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_user_fase UNIQUE (user_id, fase_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_user_trilha ON progresso(user_id, trilha_id);

-- -----------------------------------------------------------------------------
-- 8. TABELA: scores (Cache do sistema de Ranking e Níveis)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
    nivel INTEGER NOT NULL DEFAULT 1 CHECK (nivel >= 1),
    xp_atual INTEGER NOT NULL DEFAULT 0 CHECK (xp_atual >= 0),
    xp_necessario INTEGER NOT NULL DEFAULT 100 CHECK (xp_necessario > 0),
    xp_acumulado INTEGER NOT NULL DEFAULT 0 CHECK (xp_acumulado >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scores_xp_total ON scores(xp_total DESC);
CREATE INDEX IF NOT EXISTS idx_scores_nivel ON scores(nivel DESC);

-- -----------------------------------------------------------------------------
-- 9. TABELA: licoes_salvas (Favoritos N:N)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licoes_salvas (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trilha_id VARCHAR(24) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_user_trilha_salva UNIQUE (user_id, trilha_id)
);

-- -----------------------------------------------------------------------------
-- 10. TABELA: feedbacks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) REFERENCES users(id) ON DELETE SET NULL,
    tipo feedback_tipo_enum NOT NULL,
    avaliacao INTEGER NOT NULL CHECK (avaliacao >= 1 AND avaliacao <= 5),
    sugestao TEXT DEFAULT '',
    data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. TABELA: reset_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_lookup ON reset_tokens(email, token, used);

-- -----------------------------------------------------------------------------
-- 12. SEGURANÇA E RBAC: Princípio do Menor Privilégio
-- Cria usuário de aplicação com permissões restritas (somente DML, sem DDL)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'estudemy_app') THEN
        CREATE USER estudemy_app WITH ENCRYPTED PASSWORD 'estudemy_app_secure_pass_2026';
    END IF;
END $$;

-- Revoga permissões públicas no schema emerg_db
REVOKE ALL ON SCHEMA emerg_db FROM PUBLIC;
GRANT USAGE ON SCHEMA emerg_db TO estudemy_app;

-- Concede apenas permissões DML para o usuário de aplicação
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA emerg_db TO estudemy_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA emerg_db TO estudemy_app;

-- Garante que tabelas criadas no futuro herdem essas permissões seguras
ALTER DEFAULT PRIVILEGES IN SCHEMA emerg_db GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO estudemy_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA emerg_db GRANT USAGE, SELECT ON SEQUENCES TO estudemy_app;
