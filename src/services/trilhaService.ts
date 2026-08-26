import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface Trilha {
  _id: string;
  titulo: string;
  materia: string;
  descricao?: string;
  nivelDificuldade?: string;
  popularidade?: number;
  visualizacoes?: number;
  criadoPor?: string;
}

export const listarTrilhas = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.LISTAR);
  return response.data || [];
};

export const buscarTrilhas = async (query: string): Promise<Trilha[]> => {
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.BUSCAR}?query=${encodeURIComponent(query)}`);
  return response.data || [];
};

export const obterNovidades = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.NOVIDADES);
  return response.data || [];
};

export const obterPopulares = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.POPULARES);
  return response.data || [];
};

export const obterContinue = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.CONTINUE);
  return response.data || [];
};

export const buscarTrilhaPorId = async (id: string): Promise<Trilha> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.POR_ID(id));
  return response.data;
};

export const iniciarTrilha = async (trilhaId: string): Promise<any> => {
  const response = await api.post(`${API_ENDPOINTS.TRILHAS.INICIAR}/${trilhaId}`);
  return response.data;
};

export const incrementarVisualizacoes = async (trilhaId: string): Promise<any> => {
  const response = await api.post(`${API_ENDPOINTS.TRILHAS.VISUALIZAR}/${trilhaId}`);
  return response.data;
};
