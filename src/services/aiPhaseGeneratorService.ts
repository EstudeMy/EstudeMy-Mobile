/**
 * aiPhaseGeneratorService.ts
 * Serviço especializado para geração de fases e perguntas de quiz pedagógicas via IA.
 * Suporta integração com Gemini e fallback inteligente para criação de fases.
 */

import api from './api';
import logger from '../utils/logger';

export interface PerguntaQuizIA {
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string;
}

export interface FaseGeradaIA {
  titulo: string;
  descricao: string;
  conteudo: string;
  ordem: number;
  perguntas: PerguntaQuizIA[];
}

export interface GerarFaseParams {
  materia: string;
  temaOuFoco: string;
  dificuldade?: 'Facil' | 'Medio' | 'Dificil';
  ordem?: number;
  quantidadePerguntas?: number;
  idioma?: string;
}

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

/**
 * Gera uma fase completa de estudo com perguntas pedagógicas de múltipla escolha.
 */
export async function gerarFaseComIA(params: GerarFaseParams): Promise<FaseGeradaIA> {
  const {
    materia,
    temaOuFoco,
    dificuldade = 'Facil',
    ordem = 1,
    quantidadePerguntas = 3,
    idioma = 'Português',
  } = params;

  // 1. Tenta gerar via Backend da aplicação (/api/trilhas/gerar-com-ia com 1 seção e 1 fase)
  try {
    const res = await api.post('/api/trilhas/gerar-com-ia', {
      materia,
      temaOuObjetivo: temaOuFoco,
      dificuldade,
      numeroSecoes: 1,
      fasesPorSecao: 1,
      perguntasPorFase: Math.max(2, Math.min(5, quantidadePerguntas)),
      idioma,
    });

    const sec = res.data?.secoes?.[0];
    const fase = sec?.fases?.[0];
    if (fase && Array.isArray(fase.perguntas) && fase.perguntas.length > 0) {
      return {
        titulo: fase.titulo || `Fase: ${temaOuFoco}`,
        descricao: fase.descricao || `Estudo sobre ${temaOuFoco} em ${materia}`,
        conteudo: fase.conteudo || `Nesta fase vamos explorar os conceitos de ${temaOuFoco}.`,
        ordem,
        perguntas: fase.perguntas.map((p: any) => ({
          enunciado: p.enunciado || p.pergunta,
          alternativas: Array.isArray(p.alternativas) ? p.alternativas : [
            p.respostaCorreta || 'Opção A',
            'Opção B',
            'Opção C',
            'Opção D',
          ],
          respostaCorreta: p.respostaCorreta || (p.alternativas ? p.alternativas[0] : 'Opção A'),
        })),
      };
    }
  } catch (backendErr) {
    logger.warn('[aiPhaseGenerator] Backend gerar-com-ia indisponível, tentando Gemini direto:', backendErr);
  }

  // 2. Tenta gerar via Gemini API direta se chave disponível
  if (GEMINI_API_KEY) {
    try {
      const prompt = `Você é um gerador de conteúdo educacional gamificado para o aplicativo EstudeMy.
Crie UMA fase pedagógica sobre a matéria "${materia}" com o tema/foco "${temaOuFoco}".
Nível de dificuldade: ${dificuldade}.
Idioma: ${idioma}.
Quantidade de perguntas de quiz: ${quantidadePerguntas}.

Retorne ESTRITAMENTE um JSON no seguinte formato, sem formatação markdown ou código adicional:
{
  "titulo": "Nome conciso da fase",
  "descricao": "Resumo de 1 frase do que será aprendido",
  "conteudo": "Explicação teórica concisa de 2 parágrafos sobre o assunto",
  "perguntas": [
    {
      "enunciado": "Pergunta clara sobre o conteúdo",
      "alternativas": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],
      "respostaCorreta": "Alternativa 1"
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const cleanText = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          if (parsed.titulo && Array.isArray(parsed.perguntas) && parsed.perguntas.length > 0) {
            return {
              titulo: parsed.titulo,
              descricao: parsed.descricao || `Estudo sobre ${temaOuFoco}`,
              conteudo: parsed.conteudo || `Conteúdo pedagógico de ${temaOuFoco}.`,
              ordem,
              perguntas: parsed.perguntas,
            };
          }
        }
      }
    } catch (geminiErr) {
      logger.warn('[aiPhaseGenerator] Erro ao consultar Gemini direto:', geminiErr);
    }
  }

  // 3. Fallback Pedagógico Inteligente Estruturado
  return gerarFaseFallback(materia, temaOuFoco, dificuldade, ordem, quantidadePerguntas);
}

/**
 * Fallback resiliente offline com banco de questões conceituais
 */
function gerarFaseFallback(
  materia: string,
  temaOuFoco: string,
  dificuldade: string,
  ordem: number,
  qtd: number
): FaseGeradaIA {
  const cleanTema = temaOuFoco.trim() || 'Conceitos Fundamentais';
  return {
    titulo: `Fase ${ordem}: ${cleanTema}`,
    descricao: `Explore os fundamentos essenciais e conceitos práticos de ${cleanTema} aplicados a ${materia}.`,
    conteudo: `Nesta fase dedicada a ${cleanTema}, você aprofundará seus conhecimentos em ${materia}. A compreensão sólida desses princípios é a base para solucionar desafios complexos e avançar na sua jornada de aprendizado. Analise cada pergunta com atenção!`,
    ordem,
    perguntas: [
      {
        enunciado: `Qual é o princípio fundamental relacionado a ${cleanTema} no contexto de ${materia}?`,
        alternativas: [
          `A aplicação correta das diretrizes e propriedades conceituais de ${cleanTema}.`,
          'A memorização passiva sem aplicação prática de regras.',
          'A desconsideração do contexto teórico durante a resolução.',
          'A exclusão de variáveis e fundamentos da matéria.',
        ],
        respostaCorreta: `A aplicação correta das diretrizes e propriedades conceituais de ${cleanTema}.`,
      },
      {
        enunciado: `Ao resolver um problema prático sobre ${cleanTema}, qual estratégia é mais eficiente?`,
        alternativas: [
          'Decompor o problema em etapas claras e validar cada passo teoricamente.',
          'Tentar adivinhar o resultado final sem planejamento inicial.',
          'Pular a verificação dos dados e premissas apresentadas.',
          'Ignorar as definições básicas ensinadas na introdução.',
        ],
        respostaCorreta: 'Decompor o problema em etapas claras e validar cada passo teoricamente.',
      },
      {
        enunciado: `Qual a importância de dominar ${cleanTema} para estudos avançados em ${materia}?`,
        alternativas: [
          'Permite integrar conceitos e resolver desafios com pensamento crítico e velocidade.',
          'Substitui a necessidade de praticar exercícios futuros.',
          'Serve unicamente para responder testes de múltipla escolha sem reflexão.',
          'Elimina a relação entre prática e fundamentação conceitual.',
        ],
        respostaCorreta: 'Permite integrar conceitos e resolver desafios com pensamento crítico e velocidade.',
      },
    ].slice(0, Math.max(1, qtd)),
  };
}
