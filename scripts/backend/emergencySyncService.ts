import { getEmergencyPool } from '../config/emergencyDb';
import { appLogger, logHandledError } from '../logging/appLogger';

// Modelos do MongoDB
import User from '../models/user';
import Materia from '../models/materia';
import Trilha from '../models/trilha';
import Secao from '../models/secao';
import Fase from '../models/fase';
import Progresso from '../models/progresso';
import Score from '../models/score';
import LicaoSalva from '../models/licaoSalva';
import Feedback from '../models/feedback';

export interface SyncResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  stats: {
    users: number;
    materias: number;
    trilhas: number;
    secoes: number;
    fases: number;
    perguntas: number;
    progresso: number;
    scores: number;
    licoesSalvas: number;
    feedbacks: number;
  };
  errors?: string[];
}

function getRecord(val: unknown): Record<string, unknown> {
  return val && typeof val === 'object' ? (val as Record<string, unknown>) : {};
}

function getDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Sincroniza todos os dados do MongoDB para o PostgreSQL de emergência (Idempotente)
 * Utiliza ON CONFLICT DO UPDATE e transações ACID
 */
export async function syncMongoToPostgres(): Promise<SyncResult> {
  const pool = getEmergencyPool();
  const client = await pool.connect();
  const start = Date.now();
  const stats = {
    users: 0,
    materias: 0,
    trilhas: 0,
    secoes: 0,
    fases: 0,
    perguntas: 0,
    progresso: 0,
    scores: 0,
    licoesSalvas: 0,
    feedbacks: 0,
  };

  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO emerg_db, public');

    // 1. Sincronizar Usuários
    const users = await User.find({}).lean();
    for (const u of users) {
      const uRec = getRecord(u);
      await client.query(
        `INSERT INTO users (
          id, nome, email, senha_hash, data_nascimento, tipo_usuario, username,
          personagem, foto_perfil, materia_favorita, xp_total, telefone, endereco,
          aceite_termos, data_aceite_termos, tema, idioma, is_verified,
          two_factor_enabled, two_factor_backup_codes, status, can_promote_to_admin,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        )
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          senha_hash = EXCLUDED.senha_hash,
          tipo_usuario = EXCLUDED.tipo_usuario,
          username = EXCLUDED.username,
          personagem = EXCLUDED.personagem,
          foto_perfil = EXCLUDED.foto_perfil,
          materia_favorita = EXCLUDED.materia_favorita,
          xp_total = EXCLUDED.xp_total,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(u._id),
          u.nome,
          u.email,
          u.senha,
          u.dataNascimento || new Date(),
          u.tipoUsuario || 'ALUNO',
          u.username || null,
          u.personagem || '',
          u.fotoPerfil || '',
          u.materiaFavorita || '',
          u.xpTotal || 0,
          u.telefone || '',
          u.endereco || '',
          u.aceiteTermos ?? false,
          u.dataAceiteTermos || null,
          u.tema || 'light',
          u.idioma || 'pt-BR',
          u.isVerified ?? false,
          u.twoFactorEnabled ?? false,
          JSON.stringify(u.twoFactorBackupCodes || []),
          u.status || 'ATIVO',
          u.canPromoteToAdmin ?? false,
          getDate(uRec.createdAt),
          getDate(uRec.updatedAt),
        ]
      );
      stats.users++;
    }

    // 2. Sincronizar Matérias
    const materias = await Materia.find({}).lean();
    for (const m of materias) {
      const mRec = getRecord(m);
      await client.query(
        `INSERT INTO materias (id, nome, ativo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          ativo = EXCLUDED.ativo,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(m._id),
          m.nome,
          m.ativo ?? true,
          getDate(mRec.createdAt),
          getDate(mRec.updatedAt),
        ]
      );
      stats.materias++;
    }

    // 3. Sincronizar Trilhas
    const trilhas = await Trilha.find({}).lean();
    for (const t of trilhas) {
      const tRec = getRecord(t);
      const fallbackUserId = users[0]?._id ? String(users[0]._id) : '';
      await client.query(
        `INSERT INTO trilhas (
          id, usuario_id, titulo, descricao, data_criacao, data_termino,
          materia, dificuldade, disponibilidade, pagamento, fase_selecionada,
          imagem, visualizacoes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descricao = EXCLUDED.descricao,
          materia = EXCLUDED.materia,
          dificuldade = EXCLUDED.dificuldade,
          disponibilidade = EXCLUDED.disponibilidade,
          pagamento = EXCLUDED.pagamento,
          fase_selecionada = EXCLUDED.fase_selecionada,
          imagem = EXCLUDED.imagem,
          visualizacoes = EXCLUDED.visualizacoes,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(t._id),
          t.usuario ? String(t.usuario) : fallbackUserId,
          t.titulo,
          t.descricao,
          t.dataCriacao || new Date().toISOString(),
          t.dataTermino || null,
          t.materia,
          t.dificuldade || 'Facil',
          t.disponibilidade || 'Privado',
          t.pagamento || 'Gratuita',
          t.faseSelecionada || 1,
          t.imagem || '/img/fases/vila.jpg',
          t.visualizacoes || 0,
          getDate(tRec.createdAt),
          getDate(tRec.updatedAt),
        ]
      );
      stats.trilhas++;

      // Sincronizar usuários que iniciaram a trilha (N:N)
      if (Array.isArray(t.usuariosIniciaram)) {
        for (const uId of t.usuariosIniciaram) {
          await client.query(
            `INSERT INTO trilha_usuarios_iniciaram (trilha_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [String(t._id), String(uId)]
          );
        }
      }
    }

    // 4. Sincronizar Seções
    const secoes = await Secao.find({}).lean();
    for (const s of secoes) {
      const sRec = getRecord(s);
      await client.query(
        `INSERT INTO secoes (id, trilha_id, titulo, descricao, ordem, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descricao = EXCLUDED.descricao,
          ordem = EXCLUDED.ordem,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(s._id),
          String(s.trilhaId),
          s.titulo,
          s.descricao || '',
          s.ordem || 0,
          getDate(sRec.createdAt),
          getDate(sRec.updatedAt),
        ]
      );
      stats.secoes++;
    }

    // 5. Sincronizar Fases & Perguntas
    const fases = await Fase.find({}).lean();
    for (const f of fases) {
      const fRec = getRecord(f);
      await client.query(
        `INSERT INTO fases (
          id, trilha_id, secao_id, titulo, descricao, conteudo,
          ordem, personagem_selecionado, cenario, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descricao = EXCLUDED.descricao,
          conteudo = EXCLUDED.conteudo,
          ordem = EXCLUDED.ordem,
          personagem_selecionado = EXCLUDED.personagem_selecionado,
          cenario = EXCLUDED.cenario,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(f._id),
          String(f.trilhaId),
          f.secaoId ? String(f.secaoId) : null,
          f.titulo,
          f.descricao || null,
          f.conteudo || '',
          f.ordem || 0,
          f.personagem_selecionado || 'samurai',
          f.cenario || 'bg_dojo',
          getDate(fRec.createdAt),
          getDate(fRec.updatedAt),
        ]
      );
      stats.fases++;

      // Atualiza perguntas da fase
      if (Array.isArray(f.perguntas) && f.perguntas.length > 0) {
        await client.query(`DELETE FROM perguntas WHERE fase_id = $1;`, [String(f._id)]);
        let pIndex = 1;
        for (const p of f.perguntas) {
          await client.query(
            `INSERT INTO perguntas (fase_id, enunciado, alternativas, resposta_correta, ordem_pergunta)
             VALUES ($1, $2, $3, $4, $5);`,
            [
              String(f._id),
              p.enunciado,
              JSON.stringify(p.alternativas || []),
              p.respostaCorreta,
              pIndex++,
            ]
          );
          stats.perguntas++;
        }
      }
    }

    // 6. Sincronizar Progresso
    const progressos = await Progresso.find({}).lean();
    for (const p of progressos) {
      const pRec = getRecord(p);
      await client.query(
        `INSERT INTO progresso (
          id, user_id, fase_id, trilha_id, pontuacao, total_perguntas,
          porcentagem_acertos, xp_ganho, concluido, respostas_usuario,
          perguntas_respondidas, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          pontuacao = EXCLUDED.pontuacao,
          porcentagem_acertos = EXCLUDED.porcentagem_acertos,
          xp_ganho = EXCLUDED.xp_ganho,
          concluido = EXCLUDED.concluido,
          respostas_usuario = EXCLUDED.respostas_usuario,
          perguntas_respondidas = EXCLUDED.perguntas_respondidas,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(p._id),
          String(p.userId),
          String(p.faseId),
          String(p.trilhaId),
          p.pontuacao || 0,
          p.totalPerguntas || 1,
          p.porcentagemAcertos || 0,
          p.xpGanho || 0,
          p.concluido ?? false,
          JSON.stringify(p.respostasUsuario || []),
          JSON.stringify(p.perguntasRespondidas || []),
          getDate(pRec.createdAt),
          getDate(pRec.updatedAt),
        ]
      );
      stats.progresso++;
    }

    // 7. Sincronizar Scores
    const scores = await Score.find({}).lean();
    for (const s of scores) {
      const sRec = getRecord(s);
      await client.query(
        `INSERT INTO scores (
          id, user_id, xp_total, nivel, xp_atual, xp_necessario,
          xp_acumulado, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) DO UPDATE SET
          xp_total = EXCLUDED.xp_total,
          nivel = EXCLUDED.nivel,
          xp_atual = EXCLUDED.xp_atual,
          xp_necessario = EXCLUDED.xp_necessario,
          xp_acumulado = EXCLUDED.xp_acumulado,
          updated_at = EXCLUDED.updated_at;`,
        [
          String(sRec._id || ''),
          String(sRec.userId || ''),
          Number(sRec.xpTotal) || 0,
          Number(sRec.nivel) || 1,
          Number(sRec.xpAtual) || 0,
          Number(sRec.xpNecessario) || 100,
          Number(sRec.xpAcumulado) || 0,
          getDate(sRec.createdAt),
          getDate(sRec.updatedAt),
        ]
      );
      stats.scores++;
    }

    // 8. Sincronizar Lições Salvas
    const licoes = await LicaoSalva.find({}).lean();
    for (const l of licoes) {
      const lRec = getRecord(l);
      await client.query(
        `INSERT INTO licoes_salvas (id, user_id, trilha_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          trilha_id = EXCLUDED.trilha_id;`,
        [
          String(lRec._id || ''),
          String(lRec.usuario || ''),
          String(lRec.trilha || ''),
          getDate(lRec.createdAt),
        ]
      );
      stats.licoesSalvas++;
    }

    // 9. Sincronizar Feedbacks
    const feedbacks = await Feedback.find({}).lean();
    for (const fb of feedbacks) {
      const fbRec = getRecord(fb);
      await client.query(
        `INSERT INTO feedbacks (id, user_id, tipo, avaliacao, sugestao, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [
          String(fbRec._id || ''),
          fbRec.usuario ? String(fbRec.usuario) : null,
          String(fbRec.tipo || 'other'),
          Number(fbRec.avaliacao) || 5,
          String(fbRec.sugestao || ''),
          getDate(fbRec.data),
          getDate(fbRec.createdAt),
        ]
      );
      stats.feedbacks++;
    }

    await client.query('COMMIT');
    const duration = Date.now() - start;

    void appLogger.info('emergency_sync.success', {
      durationMs: duration,
      stats,
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      stats,
    };
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    logHandledError('emergency_sync.fail', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante a sincronização';
    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      stats,
      errors: [errorMessage],
    };
  } finally {
    client.release();
  }
}
