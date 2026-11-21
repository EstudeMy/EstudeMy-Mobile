/**
 * gameAiService.ts
 * Serviço de Inteligência Artificial do Oráculo / Mestre do Jogo EstudeMy.
 * 
 * REGRAS ESTRITAS DE ESCOPO:
 * 1. Responde EXCLUSIVAMENTE sobre o universo, mecânicas, combate, chefões, heróis,
 *    modos de jogo, skins, itens e estratégias do jogo EstudeMy.
 * 2. Qualquer pergunta fora do jogo (política, culinária, programação externa, tarefas alheias)
 *    é educadamente rejeitada com uma resposta imersiva temática do Mestre do Jogo.
 * 3. Opera com arquitetura híbrida: Tenta conexão com IA em nuvem (Gemini) e conta
 *    com um motor de conhecimento local completo e à prova de falhas offline.
 */

export interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: number;
}

// Chave do Gemini configurada via variável de ambiente (nunca hardcoded)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// System prompt com guardrail estrito focado no jogo
const SYSTEM_PROMPT = `
Você é o "Mestre do Jogo EstudeMy" (Guia Oficial e Oráculo Lendário do EstudeMy Game).
Sua ÚNICA e EXCLUSIVA função é auxiliar o jogador com dúvidas, táticas e explicações sobre o jogo EstudeMy Game.

CONHECIMENTO COMPLETO DO JOGO QUE VOCÊ DOMINA:
1. MECÂNICAS DE COMBATE:
   - O combate é um RPG de ação em turnos integrado a perguntas pedagógicas.
   - Acertar a resposta desfere ataques do herói contra os monstros.
   - Errar a pergunta faz os inimigos contra-atacarem e o herói perde HP/vida.
   - QTE (Quick Time Event) & Parry Defensivo: Quando um inimigo desfere um ataque pesado, um botão dourado de reflexo pode surgir. Pressioná-lo no timing certo bloqueia grande parte do dano ou contra-ataca com golpe crítico!
   - Barra de Ultimate: Cada acerto consecutivo carrega a barra de energia de 0 a 100%. Ao atingir 100%, o herói desfere um ataque supremo com animação cinemática em tela cheia que causa dano em área devastador!
2. CHEFÕES SUPREMOS (SUPREME BOSSES):
   - Ignis, o Titã Vulcânico Primordial: Chefão elemental de fogo e lava. Usa 'Erupção Sísmica de Punhos' e 'Cataclismo da Supercratera'. Dica: Mantenha concentração máxima e acerte combos rápidos antes que ele entre em Fúria Ardente!
   - Khepri-Ra, o Escaravelho Solar: Guardião místico das dunas do Deserto Primordial. Dispara tempestades solares e pragas de areia.
   - Shogun do Vazio: Senhor interdimensional com quatro katanas astrais. Usa 'Dança Dimensional' e 'Fenda Temporal de Vácuo'. Exige timing afiado no Parry!
   - Behemoth da Cripta (Réquiem Gótico): Monstro colossal de ossos antigos e chamas verdes espectrais das Catacumbas. Golpes brutais que testam a resistência do herói.
3. INIMIGOS DE TRILHA (HORDAS):
   - O jogador pode enfrentar de 1 a 3 monstros por fase em campo simultâneo (ex: Lorde da Geada, Sentinela das Areias, Colosso de Magma, Ceifador Eclipse, Ladino das Sombras, Arquimago Solar).
4. OS 5 MODOS DE JOGO:
   - Campanha (Trilha da Sabedoria): Modo história linear onde cada fase desbloqueia a seguinte.
   - Torre do Conhecimento (Sobrevivência estilo Mortal Kombat): Desafio vertical. A cada vitória você sobe um andar. Se morrer, desce até o início!
   - Boss Rush (Arena dos Mestres): Enfrente todos os chefões supremos consecutivos com barra de vida que NÃO regenera entre as lutas!
   - Speedrun (Ataque Contra o Tempo): Cronômetro decrescente acelerado. Acertos dão +3 segundos de bônus; erros tiram -5 segundos.
   - Mundo Aberto RPG: Mapa panorâmico navegável com cidades, NPCs interativos, baús de tesouros secretos e lojas de poções.
5. HERÓIS JOGÁVEIS & SKINS:
   - Kaito (Samurai): Alta agilidade e taxa de acerto crítico de 25%. Skins: Ronin das Sombras, Cyber Void.
   - Boran (Guerreiro): Alta vida (140 HP) e defesa impenetrável. Skins: Templário Sagrado, Berserker de Lava.
   - Valerius (Mago): Maior ataque base e carregamento acelerado de Ultimate (+20 inicial). Skins: Arcanista Místico, Necromante.
   - Lyra (Arqueira) & Draven (Spectre): Especialistas em ataques à distância e drenagem de essência.
6. CUTSCENES & ÁUDIO ADAPTATIVO:
   - Câmera dinâmica com aproximação, tremor de impacto e orquestra adaptativa sintetizada em tempo real que transiciona para marcha de combate.

REGRA DE GUARDA-CHUVA (GUARDRAILS ABSOLUTOS):
- Você NUNCA deve responder sobre assuntos externos ao jogo (como culinária, política, esportes, finanças, programação não relacionada ao jogo, deveres escolares gerais, redação, etc.).
- Se o usuário perguntar algo fora do jogo, RESPONDA ESTRITAMENTE:
"🛡️ Como Oráculo e Mestre do EstudeMy Game, minha sabedoria é consagrada unicamente às terras, batalhas, chefões e segredos do nosso jogo! Não posso responder sobre assuntos fora do game. Me pergunte sobre estratégias de combate, fraquezas de chefes, como usar o Ultimate, modos de jogo ou heróis!"
- Sempre seja empolgante, amigável, utilize emojis de RPG e forneça respostas práticas e bem estruturadas.
`;

/**
 * Verifica se a mensagem do usuário é explicitamente fora do escopo do jogo
 */
function isOutOfGameScope(query: string): boolean {
  const q = query.toLowerCase().trim();

  // Termos claros fora do jogo
  const forbiddenThemes = [
    'receita', 'bolo', 'cozinhar', 'politica', 'presidente', 'deputado', 'eleicao',
    'futebol', 'copa do mundo', 'campeonato', 'flamengo', 'corinthians', 'palmeiras',
    'quanto custa o dolar', 'criptomoeda', 'bitcoin', 'investimento',
    'fazer meu dever de casa', 'redacao sobre', 'resumo do livro',
    'escreva um codigo python para', 'codigo em c++', 'como criar um site'
  ];

  for (const term of forbiddenThemes) {
    if (q.includes(term)) {
      // Se não mencionar termos do jogo concomitantemente
      if (!q.includes('jogo') && !q.includes('estudemy') && !q.includes('boss') && !q.includes('heroi')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Base de Conhecimento Offline Inteligente (Garante respostas ricas mesmo sem internet)
 */
function getOfflineGameResponse(query: string): string {
  const q = query.toLowerCase().trim();

  if (isOutOfGameScope(q)) {
    return '🛡️ Como Oráculo e Mestre do EstudeMy Game, minha sabedoria é consagrada unicamente às terras, batalhas, chefões e segredos do nosso game!\n\nNão posso responder sobre assuntos fora do jogo. Me pergunte sobre estratégias de combate, como derrotar os chefes, mecânicas de parry e ultimate, heróis ou modos de jogo!';
  }

  // 1. Chefões específicos
  if (q.includes('ignis')) {
    return '🔥 **Como Vencer Ignis, o Titã Vulcânico Primordial:**\n\n' +
      '• **Comportamento:** Ignis ataca com poderosas erupções de punhos e crateras sísmicas.\n' +
      '• **Estratégia Recomendada:** Responda as perguntas com agilidade para preencher sua barra de Ultimate antes da metade do combate.\n' +
      '• **Mecânica de Parry:** Fique atento aos ataques pesados dele! Quando a tela tremer e surgir o sinal de alerta, use o reflexo do Parry para diminuir o dano.\n' +
      '• **Herói Recomendado:** Valerius (Mago) consegue canalizar magias de gelo e carregar o Ultimate 30% mais rápido contra a armadura de magma!';
  }

  if (q.includes('khepri')) {
    return '☀️ **Guia Tático: Khepri-Ra, o Escaravelho Solar:**\n\n' +
      '• **Comportamento:** Khepri invoca tempestades de areia e feixes solares cegantes no Deserto Primordial.\n' +
      '• **Dica de Ouro:** Não hesite nas alternativas. Cada acerto consecutivo anula parte da tempestade e aumenta seu multiplicador de combo!\n' +
      '• **Herói Recomendado:** Kaito (Samurai) é excelente pela alta taxa de crítico (25%), cortando a carapaça sagrada de Khepri com facilidade.';
  }

  if (q.includes('shogun') || q.includes('vazio')) {
    return '🌌 **Como Derrotar o Shogun do Vazio:**\n\n' +
      '• **Comportamento:** Mestre cósmico de quatro katanas dimensionais na Trilha do Vazio.\n' +
      '• **Ataques:** Fenda Temporal e Dança Dimensional dos Quatro Braços.\n' +
      '• **Tática:** A velocidade é essencial! Acertos rápidos garantem que seu herói ataque antes das ilusões temporais do Shogun.\n' +
      '• **Dica:** Guarde o Ultimate para a fase final da barra de vida do Shogun para encerrar a batalha antes de sua fase de fúria!';
  }

  if (q.includes('behemoth') || q.includes('cripta') || q.includes('caveira') || q.includes('esqueleto')) {
    return '💀 **Como Vencer o Behemoth da Cripta:**\n\n' +
      '• **Comportamento:** Colosso necromântico de ossos amaldiçoados e chamas verdes espectrais na Trilha da Vila/Catacumbas.\n' +
      '• **Ataques:** Pancada Esmagadora de Tumbas e Bafo Espectral.\n' +
      '• **Estratégia:** Boran (Guerreiro) é formidável aqui graças aos seus 140 de HP e escudo defensivo, resistindo aos golpes de impacto sem perder vidas!';
  }

  // 2. Mecânicas de combate: Parry, QTE, Ultimate
  if (q.includes('parry') || q.includes('qte') || q.includes('esquiva') || q.includes('bloqueio') || q.includes('contra-ataque')) {
    return '⚔️ **Mecânica de Parry & QTE (Quick Time Event):**\n\n' +
      '1. **O que é o Parry?** É a capacidade do seu herói de aparar golpes pesados dos chefões e inimigos.\n' +
      '2. **Como Funciona?** Quando um monstro desfere um ataque pesado, um botão dourado de reflexo surgirá em tela por breves instantes.\n' +
      '3. **Recompensa do Timing:** Acertar o timing perfeito reduz o dano sofrido em até 70% e ativa um contra-golpe relâmpago!\n' +
      '4. **Dica:** Manter a calma e focar no centro da tela garante o melhor tempo de reação!';
  }

  if (q.includes('ultimate') || q.includes('supremo') || q.includes('barra de ult') || q.includes('especial')) {
    return '⚡ **Como Funciona a Barra de Ultimate:**\n\n' +
      '• **Carregamento:** Cada resposta correta no Quiz preenche uma porcentagem da barra de energia do Ultimate (de 0 a 100%).\n' +
      '• **Ativação:** Ao atingir 100%, seu herói entra em postura heroica e dispara a técnica suprema (ex: *Lâmina do Vazio* do Samurai, *Meteoro Cósmico* do Mago, *Fúria Titânica* do Guerreiro)!\n' +
      '• **Efeito:** Uma animação cinematográfica em tela cheia é disparada e o chefão sofre um dano avassalador em área!';
  }

  // 3. Modos de jogo
  if (q.includes('boss rush') || q.includes('arena dos mestres')) {
    return '👑 **Modo Boss Rush (Arena dos Mestres):**\n\n' +
      '• **O Grande Desafio:** Enfrente todos os chefões supremos consecutivos do EstudeMy!\n' +
      '• **Regra Suprema:** Sua vida NÃO se regenera entre uma batalha e outra! O HP com que você termina o chefe 1 é o mesmo com que inicia o chefe 2.\n' +
      '• **Multiplicador:** Concede 2.5x de XP e 3.0x de moedas de recompensa.\n' +
      '• **Dica:** Priorize acertar com calma absoluta e use o Guerreiro Boran para ter a maior margem de sobrevivência!';
  }

  if (q.includes('torre') || q.includes('mortal kombat') || q.includes('sobrevivencia') || q.includes('andar')) {
    return '🗼 **Torre do Conhecimento (Modo Sobrevivência):**\n\n' +
      '• **Inspiração:** Estilo clássico de progressão por andares (estilo torre de Mortal Kombat).\n' +
      '• **Regra:** A cada inimigo vencido, você sobe um andar. Se errar e for derrotado, volta ao Andar 1!\n' +
      '• **Recompensa:** Concede 2.0x de XP e coloca seu nome no topo do Ranking da Torre.';
  }

  if (q.includes('speedrun') || q.includes('tempo') || q.includes('relogio')) {
    return '⏱️ **Modo Speedrun (Ataque Contra o Tempo):**\n\n' +
      '• **Dinâmica:** Você começa com um cronômetro regressivo (50 segundos).\n' +
      '• **Bônus de Tempo:** Cada resposta correta concede **+3 segundos** no relógio!\n' +
      '• **Penalidade:** Cada erro penaliza com **-5 segundos**.\n' +
      '• **Objetivo:** Terminar o circuito no menor tempo possível para recordes lendários de pontuação!';
  }

  if (q.includes('mundo aberto') || q.includes('mapa') || q.includes('npc') || q.includes('bau') || q.includes('loja')) {
    return '🗺️ **Modo Mundo Aberto RPG:**\n\n' +
      '• **Exploração Livre:** Ande livremente com seu herói por vilarejos, oásis e fortalezas.\n' +
      '• **NPCs Interativos:** Converse com aldeões, mercadores e mestres para descobrir dicas pedagógicas e segredos das matérias.\n' +
      '• **Lojas de Itens:** Utilize suas moedas de ouro para comprar poções de cura, elixires de foco e itens colecionáveis.\n' +
      '• **Baús Secretos:** Explore cantos ocultos do mapa panorâmico para abrir baús de tesouro!';
  }

  // 4. Heróis e skins
  if (q.includes('heroi') || q.includes('personagem') || q.includes('samurai') || q.includes('mago') || q.includes('guerreiro') || q.includes('kaito') || q.includes('boran') || q.includes('valerius')) {
    return '🥋 **Guia dos Heróis Jogáveis:**\n\n' +
      '1. **Kaito (Samurai):**\n' +
      '   • Estilo: Foco crítico e velocidade relâmpago.\n' +
      '   • Vantagem: 25% de taxa de crítico base (dano dobrado em acertos críticos)!\n\n' +
      '2. **Boran (Guerreiro):**\n' +
      '   • Estilo: Tanque impenetrável e resiliência.\n' +
      '   • Vantagem: Maior vida do jogo (140 HP) e alta defesa.\n\n' +
      '3. **Valerius (Mago):**\n' +
      '   • Estilo: Mago arcanista de alto dano.\n' +
      '   • Vantagem: Maior ataque base e já começa com 20% da barra de Ultimate carregada!\n\n' +
      '💡 *Dica:* Você pode escolher seu herói e trocar suas skins a qualquer momento na tela de Perfil!';
  }

  if (q.includes('skin') || q.includes('visual') || q.includes('roupa')) {
    return '🎨 **Skins e Personalização de Heróis:**\n\n' +
      '• **Como Trocar:** Acesse a aba **Perfil** no menu inferior do app e selecione a seção de Herói.\n' +
      '• **Skins Lendárias:**\n' +
      '  - Kaito: *Samurai Ronin* e *Cyber Void*\n' +
      '  - Boran: *Templário Sagrado* e *Berserker de Lava*\n' +
      '  - Valerius: *Arcanista Místico* e *Necromante Espectral*\n' +
      '• **Bônus:** Cada skin traz efeitos visuais e auras únicas nas batalhas e nas cutscenes!';
  }

  // 5. Como progredir / vidas / XP
  if (q.includes('vida') || q.includes('xp') || q.includes('moeda') || q.includes('pontos') || q.includes('ranking')) {
    return '💎 **Recursos e Progressão no EstudeMy:**\n\n' +
      '• **Vidas (❤️):** Cada quiz começa com suas vidas. Erros consomem 1 vida. Revisar fases já concluídas NÃO gasta vidas!\n' +
      '• **XP (⚡):** Conquistado ao acertar perguntas e derrotar monstros. O XP define sua colocação nas Ligas do Ranking Semanal!\n' +
      '• **Moedas (🪙):** Ganhas ao manter sequências de acertos e vencer chefões. Use-as na loja do Mundo Aberto para comprar itens!';
  }

  // 6. Resposta padrão do Mestre do Jogo
  return '⚔️ **Saudações, nobre estudante e guerreiro!**\n\n' +
    'Como Mestre do EstudeMy Game, posso te guiar em qualquer aspecto do jogo:\n\n' +
    '• **Chefões:** Dicas táticas para derrotar Ignis, Khepri, Shogun ou Behemoth;\n' +
    '• **Combate:** Como funciona o Parry, QTE e ativação do Ultimate;\n' +
    '• **Modos de Jogo:** Campanha, Torre Infinita (Mortal Kombat), Boss Rush ou Mundo Aberto;\n' +
    '• **Heróis & Skins:** Atributos de Kaito, Boran, Valerius e personalização no Perfil;\n' +
    '• **Progressão:** Como ganhar mais moedas, vidas e XP nas batalhas.\n\n' +
    'O que você deseja desvendar sobre o game agora?';
}

/**
 * Envia uma mensagem para o Oráculo do Jogo
 */
export async function askGameOracle(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<string> {
  const query = userQuery.trim();
  if (!query) return 'Por favor, escreva uma pergunta sobre o jogo!';

  // 1. Verificação prévia de escopo (Guardrail Imediato)
  if (isOutOfGameScope(query)) {
    return '🛡️ Como Oráculo e Mestre do EstudeMy Game, minha sabedoria é consagrada exclusivamente ao universo do nosso jogo!\n\nNão posso responder sobre temas fora do game. Me pergunte sobre estratégias de combate, como derrotar os chefões, modos de jogo, heróis ou itens!';
  }

  // 2. Tentar chamada à API do Gemini se houver chave configurada e conectividade
  if (GEMINI_API_KEY) {
    try {
      const formattedContents = [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nPergunta do Jogador: ${query}` }]
        }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: formattedContents }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiReply && aiReply.trim()) {
          return aiReply.trim();
        }
      }
    } catch {
      // Se a chamada online falhar (offline, timeout, rate limit), cai graciosamente no motor local
    }
  }

  // 3. Fallback: Base de Conhecimento Local Completa
  return getOfflineGameResponse(query);
}
