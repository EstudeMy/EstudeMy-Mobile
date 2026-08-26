import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface Secao {
  _id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  trilhaId: string;
}

export const buscarSecoesPorTrilha = async (trilhaId: string): Promise<Secao[]> => {
  const response = await api.get(API_ENDPOINTS.SECOES.POR_TRILHA(trilhaId));
  return response.data || [];
};

export const buscarSecaoPorId = async (id: string): Promise<Secao> => {
  const response = await api.get(API_ENDPOINTS.SECOES.POR_ID(id));
  return response.data;
};
