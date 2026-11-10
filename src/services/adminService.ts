import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Trilha } from './trilhaService';
import { logger } from '../utils/logger';

export interface AdminUserItem {
  _id: string;
  id?: string;
  nome: string;
  email: string;
  username?: string | null;
  tipoUsuario: 'ALUNO' | 'PROFESSOR' | 'ADMINISTRADOR' | 'OWNER' | string;
  xpTotal?: number;
  personagem?: string | null;
  createdAt?: string;
  ativo?: boolean;
}

/**
 * Lista todos os usuários cadastrados no sistema (Admin / Owner)
 */
export async function listarUsuariosAdmin(): Promise<AdminUserItem[]> {
  try {
    const res = await api.get('/api/admin/usuarios');
    if (Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    logger.warn('Erro ao chamar /api/admin/usuarios, tentando fallback /api/users:', err);
    try {
      const fallback = await api.get(API_ENDPOINTS.USERS.LISTAR);
      if (Array.isArray(fallback.data)) {
        return fallback.data;
      }
    } catch (e2) {
      logger.error('Erro ao listar usuários via fallback:', e2);
    }
  }
  return [];
}

/**
 * Altera o cargo/tipo de um usuário (Admin / Owner)
 */
export async function alterarTipoUsuarioAdmin(
  userId: string,
  novoTipo: 'ALUNO' | 'PROFESSOR' | 'ADMINISTRADOR' | 'OWNER'
): Promise<boolean> {
  try {
    await api.put(`/api/admin/usuarios/${userId}/tipo`, { tipoUsuario: novoTipo });
    return true;
  } catch (err) {
    logger.error('Erro ao alterar cargo do usuário:', err);
    throw err;
  }
}

/**
 * Lista todas as trilhas da plataforma com metadados completos
 */
export async function listarTodasTrilhasAdmin(): Promise<Trilha[]> {
  try {
    const res = await api.get(API_ENDPOINTS.TRILHAS.LISTAR);
    return res.data || [];
  } catch (err) {
    logger.error('Erro ao listar todas as trilhas para admin:', err);
    return [];
  }
}

/**
 * Exclui um usuário da plataforma (Admin / Owner)
 */
export async function excluirUsuarioAdmin(userId: string): Promise<boolean> {
  try {
    await api.delete(`/api/admin/usuarios/${userId}`);
    return true;
  } catch (err) {
    logger.error('Erro ao excluir usuário no backend:', err);
    throw err;
  }
}

/**
 * Altera a senha do usuário logado na plataforma
 */
export async function alterarMinhaSenha(senhaAtual: string, novaSenha: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.put(API_ENDPOINTS.USERS.MUDAR_SENHA, {
      senhaAtual,
      novaSenha,
    });
    return {
      success: true,
      message: res.data?.message || 'Senha alterada com sucesso!',
    };
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Falha ao alterar senha. Verifique sua senha atual.';
    return {
      success: false,
      message: msg,
    };
  }
}
