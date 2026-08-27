import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

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
  const url = trilhaId
    ? `${API_ENDPOINTS.FASES.LISTAR}?trilhaId=${trilhaId}`
    : API_ENDPOINTS.FASES.LISTAR;
  
  const response = await api.get(url);
  return response.data;
};

export const buscarFasesPorTrilha = async (trilhaId: string): Promise<Fase[]> => {
  const response = await api.get(API_ENDPOINTS.FASES.POR_TRILHA(trilhaId));
  return response.data;
};

export const buscarFasesPorSecao = async (secaoId: string): Promise<Fase[]> => {
  const response = await api.get(API_ENDPOINTS.FASES.POR_SECAO(secaoId));
  return response.data;
};

export const buscarFasePorId = async (id: string): Promise<Fase> => {
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
  const total = dados.totalPerguntas || ((dados.acertos || 0) + (dados.erros || 0)) || 1;
  const payload = {
    faseId: dados.faseId,
    pontuacao: dados.pontuacao,
    totalPerguntas: total,
    respostasUsuario: dados.respostasUsuario || [],
  };
  const response = await api.post(API_ENDPOINTS.PROGRESSO.SALVAR, payload);
  return response.data;
};

