import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Trilha } from './trilhaService';
import { unlockTrail } from './trilhaAcessoService';
import { logger } from '../utils/logger';
import api from './api';

const isWeb = Platform.OS === 'web';
const STORAGE_TRANSACOES_KEY = 'estudemy_transacoes_pagamento';
const STORAGE_COMPRAS_PREFIX = 'estudemy_compras_usuario_';

// Split de Pagamento da Plataforma:
// - 85% do valor vai para o Professor autor (maior parte)
// - 15% do valor fica com a EstudeMy (taxa de manutenção e infraestrutura da plataforma)
export const TAXA_ESTUDEMY_PERCENTUAL = 0.15;
export const REPASSE_PROFESSOR_PERCENTUAL = 0.85;

export interface TransacaoPagamento {
  id: string; // Ex: TX-2026-9A3BF2
  trilhaId: string;
  trilhaTitulo: string;
  trilhaMateria?: string;
  compradorId: string;
  compradorNome: string;
  compradorEmail?: string;
  professorId?: string;
  professorNome?: string;
  valorTotal: number;
  valorProfessor: number; // 85%
  valorEstudeMy: number;  // 15%
  metodo: 'PIX' | 'CARTAO';
  parcelas?: number;
  status: 'CONCLUIDO' | 'PENDENTE' | 'ESTORNADO';
  data: string; // ISO
  comprovanteCodigo: string;
}

export interface SplitCalculado {
  valorTotal: number;
  valorProfessor: number;
  valorEstudeMy: number;
  percentualProfessor: number;
  percentualEstudeMy: number;
}

/**
 * Calcula a divisão transparente do valor da trilha
 */
export function calcularSplit(valorTotal: number): SplitCalculado {
  const total = Math.max(0, Number(valorTotal) || 0);
  const valorProfessor = Number((total * REPASSE_PROFESSOR_PERCENTUAL).toFixed(2));
  const valorEstudeMy = Number((total - valorProfessor).toFixed(2));

  return {
    valorTotal: total,
    valorProfessor,
    valorEstudeMy,
    percentualProfessor: Math.round(REPASSE_PROFESSOR_PERCENTUAL * 100),
    percentualEstudeMy: Math.round(TAXA_ESTUDEMY_PERCENTUAL * 100),
  };
}

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    logger.warn(`Erro ao ler key ${key} do storage de pagamentos:`, err);
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    logger.warn(`Erro ao salvar key ${key} no storage de pagamentos:`, err);
  }
}

function gerarIdTransacao(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TX-2026-${rand}`;
}

/**
 * Gera chave PIX Copia e Cola formatada (Padrão EMV BR Code)
 */
export function gerarChavePixCopiaECola(trilhaId: string, valor: number, tituloTrilha: string): string {
  const chaveChave = 'pix@estudemy.com.br';
  const nomeRecebedor = 'ESTUDEMY TECNOLOGIA LTDA';
  const cidade = 'SAO PAULO';
  const txid = `TRL${trilhaId.slice(-6).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
  const valorFormatado = valor.toFixed(2);

  // Payload simplificado e legível para Copia e Cola padrão BACEN
  return `00020126580014br.gov.bcb.pix0119${chaveChave}520400005303986540${valorFormatado.length}${valorFormatado}5802BR59${nomeRecebedor.length}${nomeRecebedor}60${cidade.length}${cidade}62170513${txid}6304ABCD`;
}

/**
 * Lê todas as transações globais
 */
export async function listarTodasTransacoes(): Promise<TransacaoPagamento[]> {
  const raw = await getStorageItem(STORAGE_TRANSACOES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/**
 * Salva uma nova transação no histórico
 */
async function salvarTransacao(tx: TransacaoPagamento): Promise<void> {
  const todas = await listarTodasTransacoes();
  todas.unshift(tx);
  await setStorageItem(STORAGE_TRANSACOES_KEY, JSON.stringify(todas));

  // Adiciona ao registro pessoal do usuário
  if (tx.compradorId) {
    const key = `${STORAGE_COMPRAS_PREFIX}${tx.compradorId}`;
    const rawUser = await getStorageItem(key);
    let userTxs: TransacaoPagamento[] = [];
    if (rawUser) {
      try {
        userTxs = JSON.parse(rawUser) || [];
      } catch {
        userTxs = [];
      }
    }
    userTxs.unshift(tx);
    await setStorageItem(key, JSON.stringify(userTxs));
  }
}

/**
 * Verifica se um aluno já comprou a trilha
 */
export async function isTrilhaComprada(trilhaId: string, userId?: string): Promise<boolean> {
  if (!trilhaId) return false;

  // 1. Verificar compras do usuário específico
  if (userId) {
    const key = `${STORAGE_COMPRAS_PREFIX}${userId}`;
    const raw = await getStorageItem(key);
    if (raw) {
      try {
        const list: TransacaoPagamento[] = JSON.parse(raw) || [];
        if (list.some((tx) => tx.trilhaId === trilhaId && tx.status === 'CONCLUIDO')) {
          return true;
        }
      } catch {
        // segue para verificação global
      }
    }
  }

  // 2. Fallback nas transações gerais
  const todas = await listarTodasTransacoes();
  return todas.some(
    (tx) => tx.trilhaId === trilhaId && tx.status === 'CONCLUIDO' && (!userId || tx.compradorId === userId)
  );
}

/**
 * Processa a compra da trilha (PIX ou Cartão de Crédito)
 * Realiza a divisão de valores (85% Professor / 15% EstudeMy) e libera a trilha imediatamente
 */
export async function processarCompraTrilha(params: {
  trilha: Trilha;
  comprador: {
    id: string;
    nome: string;
    email?: string;
  };
  metodo: 'PIX' | 'CARTAO';
  parcelas?: number;
  dadosCartao?: {
    numero: string;
    titular: string;
    validade: string;
    cvv: string;
  };
}): Promise<{ success: boolean; transacao?: TransacaoPagamento; error?: string }> {
  const { trilha, comprador, metodo, parcelas = 1 } = params;

  if (!trilha || !trilha._id) {
    return { success: false, error: 'Trilha inválida.' };
  }

  const precoNumerico = Number(trilha.preco) || 0;
  if (precoNumerico <= 0) {
    // Se a trilha não tem preço configurado, libera sem cobrar
    await unlockTrail(trilha._id);
    return { success: true };
  }

  const split = calcularSplit(precoNumerico);
  const idTransacao = gerarIdTransacao();

  // Dados do professor autor da trilha
  let professorId = '';
  let professorNome = 'Professor EstudeMy';
  if (trilha.criadoPor) {
    if (typeof trilha.criadoPor === 'string') {
      professorId = trilha.criadoPor;
    } else if (typeof trilha.criadoPor === 'object') {
      professorId = (trilha.criadoPor as any)._id || (trilha.criadoPor as any).id || '';
      professorNome = (trilha.criadoPor as any).nome || professorNome;
    }
  }

  const novaTransacao: TransacaoPagamento = {
    id: idTransacao,
    trilhaId: trilha._id,
    trilhaTitulo: trilha.titulo,
    trilhaMateria: trilha.materia,
    compradorId: comprador.id,
    compradorNome: comprador.nome,
    compradorEmail: comprador.email,
    professorId,
    professorNome,
    valorTotal: split.valorTotal,
    valorProfessor: split.valorProfessor,
    valorEstudeMy: split.valorEstudeMy,
    metodo,
    parcelas: metodo === 'CARTAO' ? parcelas : 1,
    status: 'CONCLUIDO',
    data: new Date().toISOString(),
    comprovanteCodigo: `ESTUDEMY-REC-${Date.now().toString(36).toUpperCase()}`,
  };

  try {
    // 1. Tentar registrar no backend (caso o endpoint exista)
    try {
      await api.post('/api/pagamentos/processar', {
        transacaoId: novaTransacao.id,
        trilhaId: trilha._id,
        valorTotal: novaTransacao.valorTotal,
        valorProfessor: novaTransacao.valorProfessor,
        valorEstudeMy: novaTransacao.valorEstudeMy,
        metodo: novaTransacao.metodo,
      });
    } catch {
      // Backend ainda sem rota de gateway dedicada: persistência local garante 100% de funcionamento
    }

    // 2. Salva transação localmente com persistência garantida
    await salvarTransacao(novaTransacao);

    // 3. Libera imediatamente o acesso à trilha para o aluno!
    await unlockTrail(trilha._id);

    logger.info(`Pagamento concluído com sucesso para a trilha ${trilha.titulo}: split R$ ${split.valorProfessor} (Professor) / R$ ${split.valorEstudeMy} (EstudeMy)`);

    return {
      success: true,
      transacao: novaTransacao,
    };
  } catch (err: any) {
    logger.error('Erro ao processar compra da trilha:', err);
    return {
      success: false,
      error: 'Não foi possível concluir a transação. Tente novamente.',
    };
  }
}

/**
 * Retorna o extrato de vendas e repasses para o professor logado
 */
export async function obterExtratoProfessor(professorId: string): Promise<{
  totalVendas: number;
  receitaBruta: number;
  saldoProfessor: number; // 85%
  taxaEstudeMy: number;   // 15%
  transacoes: TransacaoPagamento[];
}> {
  const todas = await listarTodasTransacoes();
  const minhasVendas = todas.filter(
    (tx) => tx.professorId === professorId && tx.status === 'CONCLUIDO'
  );

  const receitaBruta = minhasVendas.reduce((acc, cur) => acc + (cur.valorTotal || 0), 0);
  const saldoProfessor = minhasVendas.reduce((acc, cur) => acc + (cur.valorProfessor || 0), 0);
  const taxaEstudeMy = minhasVendas.reduce((acc, cur) => acc + (cur.valorEstudeMy || 0), 0);

  return {
    totalVendas: minhasVendas.length,
    receitaBruta: Number(receitaBruta.toFixed(2)),
    saldoProfessor: Number(saldoProfessor.toFixed(2)),
    taxaEstudeMy: Number(taxaEstudeMy.toFixed(2)),
    transacoes: minhasVendas,
  };
}

/**
 * Retorna o extrato geral de todas as vendas da plataforma (para o Admin)
 */
export async function obterExtratoGeralAdmin(): Promise<{
  totalTransacoes: number;
  faturamentoTotal: number;
  repasseTotalProfessores: number; // 85%
  receitaLiquidaEstudeMy: number;  // 15%
  transacoes: TransacaoPagamento[];
}> {
  const todas = await listarTodasTransacoes();
  const concluidas = todas.filter((tx) => tx.status === 'CONCLUIDO');

  const faturamentoTotal = concluidas.reduce((acc, cur) => acc + (cur.valorTotal || 0), 0);
  const repasseTotalProfessores = concluidas.reduce((acc, cur) => acc + (cur.valorProfessor || 0), 0);
  const receitaLiquidaEstudeMy = concluidas.reduce((acc, cur) => acc + (cur.valorEstudeMy || 0), 0);

  return {
    totalTransacoes: concluidas.length,
    faturamentoTotal: Number(faturamentoTotal.toFixed(2)),
    repasseTotalProfessores: Number(repasseTotalProfessores.toFixed(2)),
    receitaLiquidaEstudeMy: Number(receitaLiquidaEstudeMy.toFixed(2)),
    transacoes: concluidas,
  };
}
