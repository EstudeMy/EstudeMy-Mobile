import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

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
  const response = await api.post('/api/trilhas', dados);
  return response.data;
};

export const buscarTrilhas = async (query: string): Promise<Trilha[]> => {
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.BUSCAR}?q=${encodeURIComponent(query)}`);
  return response.data || [];
};


export const getMappedIdioma = (lang: string) => {
  if (lang === 'en-US') return 'Inglês';
  if (lang === 'es-ES') return 'Espanhol';
  return 'Português';
};

export const obterNovidades = async (idioma?: string): Promise<Trilha[]> => {
  const query = idioma ? `?idioma=${encodeURIComponent(idioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.NOVIDADES}${query}`);
  return response.data || [];
};

export const obterPopulares = async (idioma?: string): Promise<Trilha[]> => {
  const query = idioma ? `?idioma=${encodeURIComponent(idioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.POPULARES}${query}`);
  return response.data || [];
};

export const obterContinue = async (idioma?: string): Promise<Trilha[]> => {
  const query = idioma ? `?idioma=${encodeURIComponent(idioma)}` : '';
  const response = await api.get(`${API_ENDPOINTS.TRILHAS.CONTINUE}${query}`);
  return response.data || [];
};


export const buscarTrilhaPorId = async (id: string): Promise<Trilha> => {
  const response = await api.get(API_ENDPOINTS.TRILHAS.POR_ID(id));
  return response.data;
};

export const iniciarTrilha = async (trilhaId: string): Promise<any> => {
  const response = await api.post(API_ENDPOINTS.TRILHAS.INICIAR(trilhaId));
  return response.data;
};

export const incrementarVisualizacoes = async (trilhaId: string): Promise<any> => {
  const response = await api.post(API_ENDPOINTS.TRILHAS.VISUALIZAR(trilhaId));
  return response.data;
};

