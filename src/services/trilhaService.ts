import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { isValidId, sanitizeInput } from '../utils/security';
import { logger } from '../utils/logger';
import { saveTrailAccessCode, getOrGenerateTrailAccessCode, removeTrailAccessCode } from './trilhaAcessoService';

export interface Trilha {
  _id: string;
  titulo: string;
  materia: string;
  descricao?: string;
  nivelDificuldade?: string;
  dificuldade?: string;
  popularidade?: number;
  visualizacoes?: number;
  criadoPor?: string | { _id: string; nome?: string; email?: string };
  imagem?: string;
  image?: string;
  disponibilidade?: 'Aberto' | 'Privado' | string;
  pagamento?: 'Gratuita' | 'Paga' | string;
  preco?: number;
  codigoAcesso?: string;
  idioma?: string;
  createdAt?: string;
  secoesCount?: number;
  fasesCount?: number;
}

export const listarTrilhas = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.LISTAR);
  return response.data || [];
};

export const listarMinhasTrilhas = async (userId: string): Promise<Trilha[]> => {
  if (!userId) return [];
  try {
    const all = await listarTrilhas();
    const cleanUserId = userId.trim();
    return all.filter((t) => {
      if (!t.criadoPor) return false;
      if (typeof t.criadoPor === 'string') {
        return t.criadoPor === cleanUserId;
      }
      return (t.criadoPor as any)._id === cleanUserId || (t.criadoPor as any).id === cleanUserId;
    });
  } catch (err) {
    logger.error('Erro ao listar trilhas do professor:', err);
    return [];
  }
};

export const criarTrilhaManual = async (dados: {
  titulo: string;
  descricao: string;
  materia: string;
  dificuldade: 'Facil' | 'Medio' | 'Dificil';
  disponibilidade?: 'Aberto' | 'Privado';
  pagamento?: 'Gratuita' | 'Paga';
  preco?: number;
  codigoAcesso?: string;
  faseSelecionada?: number;
  imagem?: string;
  idioma?: string;
}): Promise<Trilha> => {
  // RC02: Sanitização de entradas
  const cleanCode = dados.codigoAcesso ? sanitizeInput(dados.codigoAcesso).trim().toUpperCase() : undefined;
  const safeData = {
    ...dados,
    titulo: sanitizeInput(dados.titulo),
    descricao: sanitizeInput(dados.descricao),
    materia: sanitizeInput(dados.materia),
    codigoAcesso: cleanCode,
  };
  const response = await api.post('/api/trilhas', safeData);
  const trilhaCriada: Trilha = response.data;

  // Garante que o código de acesso seja salvo localmente caso seja privada, ou removido se aberta
  if (trilhaCriada && trilhaCriada._id) {
    if (dados.disponibilidade === 'Privado' && cleanCode) {
      await saveTrailAccessCode(trilhaCriada._id, cleanCode);
    } else {
      await removeTrailAccessCode(trilhaCriada._id);
    }
  }

  return trilhaCriada;
};

export const buscarTrilhas = async (query: string): Promise<Trilha[]> => {
  const cleanQuery = sanitizeInput(query).trim();
  if (!cleanQuery) return [];
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.BUSCAR}?q=${encodeURIComponent(cleanQuery)}`);
  return response.data || [];
};

export const getMappedIdioma = (lang: string) => {
  if (lang === 'en-US') return 'Inglês';
  if (lang === 'es-ES') return 'Espanhol';
  return 'Português';
};

export const obterNovidades = async (idioma?: string): Promise<Trilha[]> => {
  const cleanIdioma = idioma ? sanitizeInput(idioma) : '';
  const query = cleanIdioma ? `?idioma=${encodeURIComponent(cleanIdioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.NOVIDADES}${query}`);
  return response.data || [];
};

export const obterPopulares = async (idioma?: string): Promise<Trilha[]> => {
  const cleanIdioma = idioma ? sanitizeInput(idioma) : '';
  const query = cleanIdioma ? `?idioma=${encodeURIComponent(cleanIdioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.POPULARES}${query}`);
  return response.data || [];
};

export const obterContinue = async (idioma?: string): Promise<Trilha[]> => {
  const cleanIdioma = idioma ? sanitizeInput(idioma) : '';
  const query = cleanIdioma ? `?idioma=${encodeURIComponent(cleanIdioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.CONTINUE}${query}`);
  return response.data || [];
};

export const buscarTrilhaPorId = async (id: string): Promise<Trilha> => {
  if (!isValidId(id)) {
    throw new Error('ID da trilha inválido.');
  }
  const response = await api.get(API_ENDPOINTS.TRILHAS.POR_ID(id));
  const data: Trilha = response.data;
  if (data) {
    if (data.disponibilidade === 'Aberto') {
      data.codigoAcesso = undefined;
      await removeTrailAccessCode(id);
    } else if (data.disponibilidade === 'Privado' || Boolean(data.codigoAcesso)) {
      data.disponibilidade = 'Privado';
      const uniqueCode = await getOrGenerateTrailAccessCode(id, data.codigoAcesso, 'Privado');
      data.codigoAcesso = uniqueCode || undefined;
    } else {
      data.disponibilidade = 'Aberto';
      data.codigoAcesso = undefined;
      await removeTrailAccessCode(id);
    }
  }
  return data;
};

export const excluirTrilha = async (id: string): Promise<boolean> => {
  if (!isValidId(id)) {
    throw new Error('ID da trilha inválido.');
  }
  await api.delete(`/api/trilhas/${id}`);
  await removeTrailAccessCode(id);
  return true;
};

export const iniciarTrilha = async (trilhaId: string): Promise<any> => {
  if (!isValidId(trilhaId)) {
    logger.warn(`iniciarTrilha: ID inválido ${trilhaId}`);
    return null;
  }
  const response = await api.post(API_ENDPOINTS.TRILHAS.INICIAR(trilhaId));
  return response.data;
};

export const incrementarVisualizacoes = async (trilhaId: string): Promise<any> => {
  if (!isValidId(trilhaId)) {
    return null;
  }
  const response = await api.post(API_ENDPOINTS.TRILHAS.VISUALIZAR(trilhaId));
  return response.data;
};
