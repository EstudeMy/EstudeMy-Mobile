import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { isValidId, sanitizeInput } from '../utils/security';
import logger from '../utils/logger';

export interface Fase {
  _id: string;
  titulo: string;
  descricao?: string;
  conteudo?: string;
  ordem: number;
  trilhaId: string;
  secaoId: string;
  perguntas: any[];
  personagem_selecionado?: string;
  cenario?: string;
}

export const listarFases = async (trilhaId?: string | null): Promise<Fase[]> => {
  if (trilhaId && !isValidId(trilhaId)) {
    logger.warn(`Identificador de trilha inválido ignorado: ${trilhaId}`);
    trilhaId = undefined;
  }

  const url = trilhaId
    ? `${API_ENDPOINTS.FASES.LISTAR}?trilhaId=${encodeURIComponent(trilhaId)}`
    : API_ENDPOINTS.FASES.LISTAR;
  
  const response = await api.get(url);
  return response.data;
};

export const buscarFasesPorTrilha = async (trilhaId: string): Promise<Fase[]> => {
  if (!isValidId(trilhaId)) {
    logger.warn(`buscarFasesPorTrilha: ID inválido ${trilhaId}`);
    return [];
  }
  const response = await api.get(API_ENDPOINTS.FASES.POR_TRILHA(trilhaId));
  return response.data;
};

export const buscarFasesPorSecao = async (secaoId: string): Promise<Fase[]> => {
  if (!isValidId(secaoId)) {
    logger.warn(`buscarFasesPorSecao: ID inválido ${secaoId}`);
    return [];
  }
  const response = await api.get(API_ENDPOINTS.FASES.POR_SECAO(secaoId));
  return response.data;
};

export const buscarFasePorId = async (id: string): Promise<Fase> => {
  if (!isValidId(id)) {
    throw new Error('ID de fase inválido.');
  }
  const response = await api.get(API_ENDPOINTS.FASES.POR_ID(id));
  return response.data;
};

export const concluirFase = async (dados: {
  faseId: string;
  pontuacao: number;
  acertos?: number;
  erros?: number;
  totalPerguntas?: number;
  respostasUsuario?: any[];
}): Promise<any> => {
  if (!isValidId(dados.faseId)) {
    throw new Error('ID da fase informado é inválido.');
  }

  const total = dados.totalPerguntas || ((dados.acertos || 0) + (dados.erros || 0)) || 1;
  const payload = {
    faseId: dados.faseId,
    pontuacao: Math.max(0, Number(dados.pontuacao) || 0),
    totalPerguntas: total,
    respostasUsuario: Array.isArray(dados.respostasUsuario) ? dados.respostasUsuario : [],
  };
  const response = await api.post(API_ENDPOINTS.PROGRESSO.SALVAR, payload);
  return response.data;
};
