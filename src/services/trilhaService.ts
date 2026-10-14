import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { isValidId, sanitizeInput } from '../utils/security';
import logger from '../utils/logger';

export interface Trilha {
  _id: string;
  titulo: string;
  materia: string;
  descricao?: string;
  nivelDificuldade?: string;
  dificuldade?: string;
  popularidade?: number;
  visualizacoes?: number;
  criadoPor?: string;
  imagem?: string;
  image?: string;
  disponibilidade?: string;
  idioma?: string;
}

export const listarTrilhas = async (): Promise<Trilha[]> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.LISTAR);
  return response.data || [];
};

export const criarTrilhaManual = async (dados: {
  titulo: string;
  descricao: string;
  materia: string;
  dificuldade: 'Facil' | 'Medio' | 'Dificil';
  disponibilidade?: 'Aberto' | 'Privado';
  pagamento?: 'Gratuita' | 'Paga';
  faseSelecionada?: number;
  imagem?: string;
  idioma?: string;
}): Promise<Trilha> => {
  // RC02: Sanitização de entradas
  const safeData = {
    ...dados,
    titulo: sanitizeInput(dados.titulo),
    descricao: sanitizeInput(dados.descricao),
    materia: sanitizeInput(dados.materia),
  };
  const response = await api.post('/api/trilhas', safeData);
  return response.data;
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
  return response.data;
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
