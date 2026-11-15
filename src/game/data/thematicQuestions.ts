/**
 * thematicQuestions.ts
 * Banco de perguntas pedagógicas autênticas e estruturadas por Trilha e por Fase Temática.
 * Garante que cada trilha e cada fase tenham perguntas rigorosamente alinhadas com a matéria e o cenário.
 */

export interface ThematicQuestion {
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string;
  indiceRespostaCorreta: number;
  explicacao: string;
}

export type ThemeKey = 'castelo' | 'montanha' | 'deserto' | 'vila' | 'vazio_cosmico';

export const THEMATIC_QUESTIONS: Record<ThemeKey, ThematicQuestion[][]> = {
  // ============================================================================
  // TRILHA 1: BANCO DE DADOS & PROGRAMAÇÃO (CASTELO DOS DADOS)
  // ============================================================================
  castelo: [
    // Fase 1: Muralha e Portão dos Algoritmos (Fundamentos & Lógica de Programação)
    [
      {
        enunciado: 'Qual é a função básica de uma variável em um algoritmo?',
        alternativas: [
          'Armazenar dados temporariamente na memória para processamento',
          'Acelerar a velocidade da placa de vídeo do computador',
          'Conectar o computador à rede de internet externa',
          'Eliminar erros de sintaxe automaticamente do código',
        ],
        respostaCorreta: 'Armazenar dados temporariamente na memória para processamento',
        indiceRespostaCorreta: 0,
        explicacao: 'Variáveis são posições nomeadas de memória destinadas a guardar valores durante a execução.',
      },
      {
        enunciado: 'O que representa uma estrutura condicional (if / else) em programação?',
        alternativas: [
          'Um desvio no fluxo de execução baseado em uma condição lógica',
          'Uma repetição infinita de instruções do processador',
          'A conversão automática de números em texto legível',
          'A exclusão de dados não utilizados pelo sistema operacional',
        ],
        respostaCorreta: 'Um desvio no fluxo de execução baseado em uma condição lógica',
        indiceRespostaCorreta: 0,
        explicacao: 'Estruturas condicionais avaliam expressões booleanas e decidem qual bloco de código será executado.',
      },
      {
        enunciado: 'Qual a principal vantagem da computação em nuvem?',
        alternativas: [
          'Escalabilidade sob demanda e alta disponibilidade',
          'Custo fixo alto sem possibilidade de alteração',
          'Necessidade obrigatória de manter servidor físico no local',
          'Perda de controle total sobre as credenciais de acesso',
        ],
        respostaCorreta: 'Escalabilidade sob demanda e alta disponibilidade',
        indiceRespostaCorreta: 0,
        explicacao: 'A nuvem permite provisionar e desprovisionar poder computacional de forma flexível.',
      },
      {
        enunciado: 'Qual a complexidade de tempo média da busca binária em um vetor ordenado?',
        alternativas: ['O(log n)', 'O(n²)', 'O(n!)', 'O(1)'],
        respostaCorreta: 'O(log n)',
        indiceRespostaCorreta: 0,
        explicacao: 'A busca binária divide o espaço de busca pela metade a cada comparação, atingindo O(log n).',
      },
    ],
    // Fase 2: Grande Salão dos Dados (SQL & Bancos Relacionais)
    [
      {
        enunciado: 'O que caracteriza um banco de dados relacional (SQL)?',
        alternativas: [
          'Tabelas organizadas com chaves primárias e relacionamentos',
          'Documentos JSON armazenados sem qualquer estrutura',
          'Pares de chave e valor sem suporte a consultas complexas',
          'Grafos não direcionados com nós sem atributos',
        ],
        respostaCorreta: 'Tabelas organizadas com chaves primárias e relacionamentos',
        indiceRespostaCorreta: 0,
        explicacao: 'Modelos relacionais organizam dados em tuplas e colunas, garantindo integridade referencial.',
      },
      {
        enunciado: 'Qual comando da linguagem SQL é utilizado para extrair dados de uma tabela?',
        alternativas: ['SELECT', 'INSERT', 'UPDATE', 'DROP'],
        respostaCorreta: 'SELECT',
        indiceRespostaCorreta: 0,
        explicacao: 'O comando SELECT é a instrução DML fundamental para consultas e recuperação de registros.',
      },
      {
        enunciado: 'Qual a função de uma Chave Estrangeira (Foreign Key)?',
        alternativas: [
          'Estabelecer um vínculo de integridade referencial entre duas tabelas',
          'Criptografar senhas na tabela de usuários',
          'Garantir que a chave primária nunca seja nula',
          'Aumentar o espaço de armazenamento do disco rígido',
        ],
        respostaCorreta: 'Estabelecer um vínculo de integridade referencial entre duas tabelas',
        indiceRespostaCorreta: 0,
        explicacao: 'A chave estrangeira aponta para a chave primária de outra tabela, preservando a coerência dos dados.',
      },
      {
        enunciado: 'No SQL, qual cláusula filtra resultados agrupados por GROUP BY?',
        alternativas: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
        respostaCorreta: 'HAVING',
        indiceRespostaCorreta: 0,
        explicacao: 'WHERE filtra registros individuais antes do agrupamento; HAVING filtra grupos já agregados.',
      },
    ],
    // Fase 3: Catacumbas da Memória RAM (Estruturas de Dados & Otimização)
    [
      {
        enunciado: 'Qual estrutura de dados opera no princípio LIFO (Last In, First Out)?',
        alternativas: ['Pilha (Stack)', 'Fila (Queue)', 'Vetor (Array)', 'Árvore Binária'],
        respostaCorreta: 'Pilha (Stack)',
        indiceRespostaCorreta: 0,
        explicacao: 'Na Pilha, o último elemento inserido (push) é obrigatoriamente o primeiro a ser removido (pop).',
      },
      {
        enunciado: 'O que é um vazamento de memória (Memory Leak)?',
        alternativas: [
          'Memória alocada dinamicamente que não é liberada após perder a referência',
          'Uma invasão de rede que rouba arquivos confidenciais do servidor',
          'O desligamento abrupto do computador por queda de energia',
          'A compactação excessiva de dados em arquivos ZIP',
        ],
        respostaCorreta: 'Memória alocada dinamicamente que não é liberada após perder a referência',
        indiceRespostaCorreta: 0,
        explicacao: 'Quando ponteiros perdem a referência sem desalocar a memória, o consumo de RAM cresce continuamente.',
      },
      {
        enunciado: 'Qual a principal vantagem de uma Tabela Hash (Hash Map)?',
        alternativas: [
          'Acesso e busca em tempo constante médio O(1)',
          'Ordenação alfabética garantida sem processamento adicional',
          'Uso nulo de espaço em memória secundária',
          'Garantia de que nunca ocorrerão colisões de chaves',
        ],
        respostaCorreta: 'Acesso e busca em tempo constante médio O(1)',
        indiceRespostaCorreta: 0,
        explicacao: 'Uma função hash calcula o índice correspondente da chave diretamente na memória.',
      },
      {
        enunciado: 'Em uma estrutura de dados de Fila (Queue), como ocorrem as inserções e remoções?',
        alternativas: [
          'Primeiro a entrar é o primeiro a sair (FIFO)',
          'Último a entrar é o primeiro a sair (LIFO)',
          'Inserções e remoções ocorrem apenas no elemento central',
          'Elementos são removidos em ordem alfabética aleatória',
        ],
        respostaCorreta: 'Primeiro a entrar é o primeiro a sair (FIFO)',
        indiceRespostaCorreta: 0,
        explicacao: 'Filas seguem o princípio FIFO (First In, First Out), ideal para buffers e filas de processamento.',
      },
    ],
    // Fase 4: Torre do Trono do Spectre (Engenharia de Software & Arquitetura)
    [
      {
        enunciado: 'Em arquitetura de microsserviços, qual a função primordial de um API Gateway?',
        alternativas: [
          'Roteamento, autenticação e limitação de tráfego centralizados',
          'Substituir a necessidade de bancos de dados relacionais',
          'Eliminar a camada física de rede e cabos do data center',
          'Executar a compilação do código-fonte em tempo real',
        ],
        respostaCorreta: 'Roteamento, autenticação e limitação de tráfego centralizados',
        indiceRespostaCorreta: 0,
        explicacao: 'O API Gateway atua como ponto único de entrada, gerenciando tráfego, autorização e balanceamento.',
      },
      {
        enunciado: 'Nas propriedades ACID de bancos de dados, o que significa Atomicidade?',
        alternativas: [
          'A transação é executada por completo ou todas as alterações são revertidas',
          'Os dados são gravados exclusivamente em memórias atômicas quânticas',
          'Múltiplas transações simultâneas não interferem entre si',
          'Os dados persistem mesmo em caso de falha física do hardware',
        ],
        respostaCorreta: 'A transação é executada por completo ou todas as alterações são revertidas',
        indiceRespostaCorreta: 0,
        explicacao: 'Tudo ou nada: se qualquer etapa da transação falhar, o estado original é restaurado (rollback).',
      },
      {
        enunciado: 'Qual padrão arquitetural separa leitura (consultas) de escrita (comandos)?',
        alternativas: ['CQRS', 'Monólito Clássico', 'MVC Puro', 'Singleton'],
        respostaCorreta: 'CQRS',
        indiceRespostaCorreta: 0,
        explicacao: 'Command Query Responsibility Segregation (CQRS) isola modelos de atualização de modelos de leitura.',
      },
      {
        enunciado: 'O que caracteriza a Idempotência em uma API RESTful (métodos PUT/DELETE)?',
        alternativas: [
          'Executar a mesma requisição múltiplas vezes produz o mesmo efeito no estado do servidor',
          'A requisição só pode ser feita uma única vez por endereço IP',
          'O servidor gera uma chave criptográfica nova a cada milissegundo',
          'As respostas da API são sempre entregues em formato XML',
        ],
        respostaCorreta: 'Executar a mesma requisição múltiplas vezes produz o mesmo efeito no estado do servidor',
        indiceRespostaCorreta: 0,
        explicacao: 'Uma operação idempotente garante estabilidade mesmo em caso de retransmissões por falha de rede.',
      },
    ],
  ],

  // ============================================================================
  // TRILHA 2: MATEMÁTICA, FÍSICA & LÓGICA (PICO DA LÓGICA)
  // ============================================================================
  montanha: [
    // Fase 1: Encosta Nevada dos Vetores (Álgebra & Funções)
    [
      {
        enunciado: 'Qual é o valor da raiz quadrada exata de 144?',
        alternativas: ['12', '14', '16', '10'],
        respostaCorreta: '12',
        indiceRespostaCorreta: 0,
        explicacao: '12 × 12 = 144.',
      },
      {
        enunciado: 'Dada a função afim f(x) = 3x - 5, qual o valor numérico de f(4)?',
        alternativas: ['7', '9', '12', '17'],
        respostaCorreta: '7',
        indiceRespostaCorreta: 0,
        explicacao: 'f(4) = 3(4) - 5 = 12 - 5 = 7.',
      },
      {
        enunciado: 'Se uma armadura custa R$ 200,00 e recebe um desconto de 15%, qual o valor a pagar?',
        alternativas: ['R$ 170,00', 'R$ 180,00', 'R$ 185,00', 'R$ 160,00'],
        respostaCorreta: 'R$ 170,00',
        indiceRespostaCorreta: 0,
        explicacao: '15% de 200 = 30. Logo, 200 - 30 = R$ 170,00.',
      },
      {
        enunciado: 'Qual é a soma dos ângulos internos de qualquer triângulo plano?',
        alternativas: ['180°', '360°', '90°', '270°'],
        respostaCorreta: '180°',
        indiceRespostaCorreta: 0,
        explicacao: 'Na geometria euclidiana, a soma dos três ângulos internos de um triângulo é sempre 180 graus.',
      },
    ],
    // Fase 2: Desfiladeiro da Gravidade (Cinemática & Leis de Newton)
    [
      {
        enunciado: 'De acordo com a 2ª Lei de Newton, a Força Resultante (F) é calculada por:',
        alternativas: ['F = m × a (Massa vezes aceleração)', 'F = m / a', 'F = m + a', 'F = m × v²'],
        respostaCorreta: 'F = m × a (Massa vezes aceleração)',
        indiceRespostaCorreta: 0,
        explicacao: 'O princípio fundamental da dinâmica estabelece que a força resultante é proporcional à aceleração.',
      },
      {
        enunciado: 'Um veículo percorre 180 km em exatamente 2 horas. Qual foi a sua velocidade média?',
        alternativas: ['90 km/h', '100 km/h', '80 km/h', '120 km/h'],
        respostaCorreta: '90 km/h',
        indiceRespostaCorreta: 0,
        explicacao: 'Vm = ΔS / Δt = 180 km / 2 h = 90 km/h.',
      },
      {
        enunciado: 'Qual a principal diferença entre grandezas escalares e vetoriais?',
        alternativas: [
          'Vetores necessitam de módulo, direção e sentido para estarem completos',
          'Escalares possuem apenas direção geográfica',
          'Vetores nunca podem ser representados numericamente',
          'Escalares são exclusivos da física quântica',
        ],
        respostaCorreta: 'Vetores necessitam de módulo, direção e sentido para estarem completos',
        indiceRespostaCorreta: 0,
        explicacao: 'Enquanto escalares dependem apenas de valor e unidade, vetores exigem direção e sentido no espaço.',
      },
      {
        enunciado: 'Na superfície da Terra, qual o valor aproximado da aceleração da gravidade (g)?',
        alternativas: ['9,8 m/s²', '1,6 m/s²', '24,8 m/s²', '300.000 km/s'],
        respostaCorreta: '9,8 m/s²',
        indiceRespostaCorreta: 0,
        explicacao: 'A aceleração da gravidade terrestre padrão ao nível do mar é de aproximadamente 9,8 m/s².',
      },
    ],
    // Fase 3: Caverna dos Cristais Lógicos (Geometria & Trigonometria)
    [
      {
        enunciado: 'Pelo Teorema de Pitágoras, em um triângulo retângulo com catetos 3 e 4, a hipotenusa mede:',
        alternativas: ['5', '6', '7', '8'],
        respostaCorreta: '5',
        indiceRespostaCorreta: 0,
        explicacao: 'h² = 3² + 4² = 9 + 16 = 25 -> h = √25 = 5.',
      },
      {
        enunciado: 'Qual é o valor do seno de um ângulo de 30 graus no círculo trigonométrico?',
        alternativas: ['1/2 (0,5)', '√3/2', '1', '0'],
        respostaCorreta: '1/2 (0,5)',
        indiceRespostaCorreta: 0,
        explicacao: 'sen(30°) = 1/2.',
      },
      {
        enunciado: 'Como se calcula a área de um círculo em função do seu raio (r)?',
        alternativas: ['A = π × r²', 'A = 2 × π × r', 'A = π × r³', 'A = 4 × π × r²'],
        respostaCorreta: 'A = π × r²',
        indiceRespostaCorreta: 0,
        explicacao: 'A fórmula da área circular é π multiplicado pelo quadrado do raio.',
      },
      {
        enunciado: 'Quantos vértices e faces possui um cubo regular (hexaedro)?',
        alternativas: ['8 vértices e 6 faces', '6 vértices e 8 faces', '12 vértices e 6 faces', '8 vértices e 12 faces'],
        respostaCorreta: '8 vértices e 6 faces',
        indiceRespostaCorreta: 0,
        explicacao: 'Pela relação de Euler (V - A + F = 2): 8 - 12 + 6 = 2.',
      },
    ],
    // Fase 4: Pico Cósmico da Lógica (Cálculo & Lógica Matemática Avançada)
    [
      {
        enunciado: 'Na lógica matemática booleana, a conjunção (A ∧ B) só é verdadeira se:',
        alternativas: [
          'Tanto A quanto B forem proposições verdadeiras',
          'Pelo menos uma das duas for verdadeira',
          'A for verdadeira e B for falsa',
          'Ambas forem proposições falsas',
        ],
        respostaCorreta: 'Tanto A quanto B forem proposições verdadeiras',
        indiceRespostaCorreta: 0,
        explicacao: 'A tabela-verdade do operador E (AND) exige que ambos os operandos sejam verdadeiros.',
      },
      {
        enunciado: 'Qual a probabilidade de sortear a face 6 no lançamento de um dado equilibrado de 6 faces?',
        alternativas: ['1/6 (aprox. 16,6%)', '1/2 (50%)', '1/3 (aprox. 33,3%)', '1/12 (aprox. 8,3%)'],
        respostaCorreta: '1/6 (aprox. 16,6%)',
        indiceRespostaCorreta: 0,
        explicacao: 'Há 1 evento favorável em um espaço amostral de 6 resultados possíveis.',
      },
      {
        enunciado: 'Na progressão geométrica (2, 4, 8, 16...), qual é o valor da razão (q)?',
        alternativas: ['2', '4', '8', '1'],
        respostaCorreta: '2',
        indiceRespostaCorreta: 0,
        explicacao: 'q = 4 / 2 = 8 / 4 = 2.',
      },
      {
        enunciado: 'No cálculo diferencial, qual é a derivada da função f(x) = x² em relação a x?',
        alternativas: ['2x', 'x', '2', 'x³ / 3'],
        respostaCorreta: '2x',
        indiceRespostaCorreta: 0,
        explicacao: 'Pela regra da potência: d/dx(xⁿ) = n·xⁿ⁻¹, logo d/dx(x²) = 2x.',
      },
    ],
  ],

  // ============================================================================
  // TRILHA 3: CIÊNCIAS, GEOGRAFIA & BIOLOGIA (DESERTO PRIMORDIAL)
  // ============================================================================
  deserto: [
    // Fase 1: Dunas Escaldantes da Erosão (Geologia & Geomorfologia)
    [
      {
        enunciado: 'Qual agente natural é o principal responsável pela formação e movimentação das dunas?',
        alternativas: [
          'Ação eólica (força dos ventos e transporte de sedimentos)',
          'Erosão fluvial de rios subterrâneos caudalosos',
          'Abalo sísmico contínuo do manto terrestre',
          'Ação da gravidade lunar sobre os oceanos',
        ],
        respostaCorreta: 'Ação eólica (força dos ventos e transporte de sedimentos)',
        indiceRespostaCorreta: 0,
        explicacao: 'O vento move grãos de areia por saltação e suspensão, moldando cristas de dunas.',
      },
      {
        enunciado: 'Qual camada sólida mais externa compõe a crosta rochosa do nosso planeta?',
        alternativas: ['Litosfera', 'Astenosfera', 'Mesosfera', 'Núcleo Interno'],
        respostaCorreta: 'Litosfera',
        indiceRespostaCorreta: 0,
        explicacao: 'A litosfera engloba a crosta e a parte superior do manto terrestre rígido.',
      },
      {
        enunciado: 'O que impulsiona o movimento das placas tectônicas na Terra?',
        alternativas: [
          'Correntes de convecção térmica no manto fluido de magma',
          'A rotação atmosférica de furacões e ciclones',
          'O magnetismo polar dos polos norte e sul',
          'A pressão dos oceanos sobre as fossas marinhas',
        ],
        respostaCorreta: 'Correntes de convecção térmica no manto fluido de magma',
        indiceRespostaCorreta: 0,
        explicacao: 'O calor interno do núcleo gera células convectivas de magma que arrastam as placas.',
      },
      {
        enunciado: 'Qual característica climática define os desertos áridos globais?',
        alternativas: [
          'Pluviosidade extremamente baixa e ampla amplitude térmica diária',
          'Chuvas constantes durante todas as estações do ano',
          'Temperaturas congelantes sem variação entre dia e noite',
          'Umidade relativa do ar próxima de 100% de forma constante',
        ],
        respostaCorreta: 'Pluviosidade extremamente baixa e ampla amplitude térmica diária',
        indiceRespostaCorreta: 0,
        explicacao: 'A ausência de umidade faz com que o calor escape rapidamente à noite, gerando altas amplitudes.',
      },
    ],
    // Fase 2: Oásis dos Fósseis Antigos (Ecologia & Botânica)
    [
      {
        enunciado: 'Qual processo biológico converte luz solar, água e CO2 em glicose nas plantas?',
        alternativas: ['Fotossíntese', 'Respiração celular', 'Fermentação láctica', 'Quimiossíntese'],
        respostaCorreta: 'Fotossíntese',
        indiceRespostaCorreta: 0,
        explicacao: 'A clorofila vegetal captura fótons luminosos para converter matéria inorgânica em carboidratos.',
      },
      {
        enunciado: 'Em uma cadeia alimentar, como são denominados os organismos que produzem seu próprio alimento?',
        alternativas: ['Produtores (Autótrofos)', 'Consumidores primários', 'Decompositores', 'Parasitas estritos'],
        respostaCorreta: 'Produtores (Autótrofos)',
        indiceRespostaCorreta: 0,
        explicacao: 'Seres autótrofos (como vegetais e algas) constituem a base energética dos ecossistemas.',
      },
      {
        enunciado: 'Qual gás essencial é liberado para a atmosfera como subproduto da fotossíntese?',
        alternativas: ['Oxigênio (O₂)', 'Dióxido de carbono (CO₂)', 'Metano (CH₄)', 'Hélio (He)'],
        respostaCorreta: 'Oxigênio (O₂)',
        indiceRespostaCorreta: 0,
        explicacao: 'A quebra da molécula de água (fotólise da água) na fase clara libera gás oxigênio.',
      },
      {
        enunciado: 'O que são fósseis no registro das ciências naturais?',
        alternativas: [
          'Restos ou vestígios petrificados de seres vivos pré-históricos',
          'Minerais sintéticos produzidos em fornos industriais',
          'Rochas magmáticas expelidas recentemente por vulcões',
          'Cristais de sal formados por evaporação imediata',
        ],
        respostaCorreta: 'Restos ou vestígios petrificados de seres vivos pré-históricos',
        indiceRespostaCorreta: 0,
        explicacao: 'Fósseis preservam ossadas, pegadas e carapaças minerais de organismos com mais de 10 mil anos.',
      },
    ],
    // Fase 3: Templo Solar do Arenito (Química & Estrutura da Matéria)
    [
      {
        enunciado: 'Qual partícula atômica possui carga elétrica negativa e se localiza na eletrosfera?',
        alternativas: ['Elétron', 'Próton', 'Nêutron', 'Pósitron'],
        respostaCorreta: 'Elétron',
        indiceRespostaCorreta: 0,
        explicacao: 'O núcleo contém prótons (+) e nêutrons (neutros), enquanto elétrons (-) orbitam na eletrosfera.',
      },
      {
        enunciado: 'Na tabela periódica dos elementos, qual símbolo representa o elemento químico Ferro?',
        alternativas: ['Fe', 'Fr', 'F', 'Ir'],
        respostaCorreta: 'Fe',
        indiceRespostaCorreta: 0,
        explicacao: 'O símbolo Fe tem origem no termo latino "Ferrum".',
      },
      {
        enunciado: 'Qual é a fórmula molecular padrão da substância Água?',
        alternativas: ['H₂O', 'CO₂', 'NaCl', 'H₂O₂'],
        respostaCorreta: 'H₂O',
        indiceRespostaCorreta: 0,
        explicacao: 'Dois átomos de hidrogênio ligados covalentemente a um átomo de oxigênio.',
      },
      {
        enunciado: 'Em soluções aquosas a 25°C, qual valor da escala de pH indica neutralidade?',
        alternativas: ['7', '0', '14', '1'],
        respostaCorreta: '7',
        indiceRespostaCorreta: 0,
        explicacao: 'pH < 7 é ácido, pH = 7 é neutro e pH > 7 é alcalino (básico).',
      },
    ],
    // Fase 4: Cratera da Tempestade Solar (Astronomia & Genética)
    [
      {
        enunciado: 'Qual molécula biológica carrega as instruções genéticas hereditárias de todos os seres vivos?',
        alternativas: ['DNA (Ácido Desoxirribonucleico)', 'Glicose', 'Colesterol', 'Hemoglobina'],
        respostaCorreta: 'DNA (Ácido Desoxirribonucleico)',
        indiceRespostaCorreta: 0,
        explicacao: 'A fita dupla de DNA codifica todas as sequências de aminoácidos para síntese de proteínas.',
      },
      {
        enunciado: 'O que provoca o fenômeno luminoso das auroras polares (boreais e austrais)?',
        alternativas: [
          'Interação do vento solar carregado com o campo magnético e atmosfera terrestre',
          'Reflexo da luz solar nas calotas de gelo polares',
          'Incêndios florestais naturais nas taigas do norte',
          'Colisão de meteoritos de grande porte na estratosfera',
        ],
        respostaCorreta: 'Interação do vento solar carregado com o campo magnético e atmosfera terrestre',
        indiceRespostaCorreta: 0,
        explicacao: 'Partículas solares ionizadas colidem com átomos de oxigênio e nitrogênio, emitindo luz.',
      },
      {
        enunciado: 'Qual planeta do Sistema Solar é popularmente apelidado de Planeta Vermelho devido ao óxido de ferro?',
        alternativas: ['Marte', 'Júpiter', 'Vênus', 'Mercúrio'],
        respostaCorreta: 'Marte',
        indiceRespostaCorreta: 0,
        explicacao: 'O solo marciano é rico em minerais de ferro oxidado (ferrugem), conferindo tom avermelhado.',
      },
      {
        enunciado: 'Qual a principal fonte de energia que mantém o ciclo hidrológico e os ventos na Terra?',
        alternativas: ['A radiação emitida pelo Sol', 'O calor residual do núcleo terrestre', 'A força de atrito das marés', 'A eletricidade das nuvens'],
        respostaCorreta: 'A radiação emitida pelo Sol',
        indiceRespostaCorreta: 0,
        explicacao: 'A energia solar evapora oceanos e aquece a atmosfera de maneira desigual, criando ventos.',
      },
    ],
  ],

  // ============================================================================
  // TRILHA 4: LÍNGUA PORTUGUESA, HISTÓRIA & HUMANIDADES (VILA ANCESTRAL)
  // ============================================================================
  vila: [
    // Fase 1: Praça do Mercado das Crônicas (Gramática & Ortografia)
    [
      {
        enunciado: 'Em qual das alternativas o acento indicador de crase foi empregado CORRETAMENTE?',
        alternativas: [
          'Todos os sábios foram à biblioteca consultar os manuscritos.',
          'O mensageiro começou à cavalgar ao amanhecer.',
          'Entregamos o documento à ele com rapidez.',
          'Eles caminharam passo à passo até a colina.',
        ],
        respostaCorreta: 'Todos os sábios foram à biblioteca consultar os manuscritos.',
        indiceRespostaCorreta: 0,
        explicacao: 'Houve a fusão da preposição "a" exigida pelo verbo "ir" com o artigo definido feminino "a" de biblioteca.',
      },
      {
        enunciado: 'Assinale a frase com a concordância verbal no padrão culto da língua:',
        alternativas: [
          'Havia muitos cavaleiros reunidos na praça da vila.',
          'Haviam muitos cavaleiros reunidos na praça da vila.',
          'Fazem dez anos que o castelo foi construído.',
          'Devem de haver soluções melhores para o povo.',
        ],
        respostaCorreta: 'Havia muitos cavaleiros reunidos na praça da vila.',
        indiceRespostaCorreta: 0,
        explicacao: 'O verbo haver no sentido de existir ou tempo decorrido é impessoal e fica na 3ª pessoa do singular.',
      },
      {
        enunciado: 'Na pontuação tradicional, qual sinal introduz a fala de um personagem no diálogo direto?',
        alternativas: ['Travessão (—)', 'Reticências (...)', 'Ponto e vírgula (;)', 'Parênteses ()'],
        respostaCorreta: 'Travessão (—)',
        indiceRespostaCorreta: 0,
        explicacao: 'O travessão é o sinal canônico para marcar mudanças de interlocutor em narrativas.',
      },
      {
        enunciado: 'Na oração "Chegaram os sábios cronistas ao amanhecer", qual é o sujeito gramatical?',
        alternativas: ['Os sábios cronistas', 'Ao amanhecer', 'Chegaram', 'Oração sem sujeito'],
        respostaCorreta: 'Os sábios cronistas',
        indiceRespostaCorreta: 0,
        explicacao: 'O sujeito está posposto ao verbo: quem chegou? Os sábios cronistas.',
      },
    ],
    // Fase 2: Grande Arquivo e Biblioteca Arcana (Literatura & Redação)
    [
      {
        enunciado: 'Qual figura de linguagem consiste no exagero intencional para enfatizar uma expressão?',
        alternativas: ['Hipérbole', 'Eufemismo', 'Metonímia', 'Paradoxo'],
        respostaCorreta: 'Hipérbole',
        indiceRespostaCorreta: 0,
        explicacao: '"Chorei rios de lágrimas" ou "estou morrendo de fome" são exemplos clássicos de hipérbole.',
      },
      {
        enunciado: 'Quem é o consagrado autor brasileiro da obra-prima "Dom Casmurro" e de "Memórias Póstumas"?',
        alternativas: ['Machado de Assis', 'José de Alencar', 'Clarice Lispector', 'Guimarães Rosa'],
        respostaCorreta: 'Machado de Assis',
        indiceRespostaCorreta: 0,
        explicacao: 'Machado de Assis é o mestre maior do Realismo na literatura brasileira.',
      },
      {
        enunciado: 'O que define a coesão textual em uma dissertação argumentativa?',
        alternativas: [
          'A conexão harmônica entre orações e parágrafos por conectivos e pronomes',
          'O uso de fontes e margens padronizadas no editor de texto',
          'A contagem exata de páginas do documento impresso',
          'A inserção de ilustrações coloridas no cabeçalho',
        ],
        respostaCorreta: 'A conexão harmônica entre orações e parágrafos por conectivos e pronomes',
        indiceRespostaCorreta: 0,
        explicacao: 'A coesão encadeia logicamente as ideias através de operadores argumentativos.',
      },
      {
        enunciado: 'A qual grande período literário pertence a epopeia clássica "Os Lusíadas", de Luís de Camões?',
        alternativas: ['Classicismo / Renascimento', 'Romantismo', 'Modernismo', 'Barroco'],
        respostaCorreta: 'Classicismo / Renascimento',
        indiceRespostaCorreta: 0,
        explicacao: 'Publicado em 1572, "Os Lusíadas" é o marco ápice do Classicismo renascentista lusitano.',
      },
    ],
    // Fase 3: Cripta dos Filósofos (Filosofia & Ética Cidadã)
    [
      {
        enunciado: 'Qual filósofo grego clássico imortalizou a reflexão "Só sei que nada sei"?',
        alternativas: ['Sócrates', 'Platão', 'Aristóteles', 'Heráclito'],
        respostaCorreta: 'Sócrates',
        indiceRespostaCorreta: 0,
        explicacao: 'Sócrates utilizava a maiêutica e o reconhecimento da ignorância como ponto de partida da sabedoria.',
      },
      {
        enunciado: 'O que preconizava o movimento filosófico do Iluminismo no século XVIII?',
        alternativas: [
          'O predomínio da razão, da ciência e a defesa dos direitos individuais',
          'A submissão absoluta do pensamento ao dogma religioso medieval',
          'O retorno às sociedades tribais sem leis escritas',
          'A proibição do ensino público da matemática e da leitura',
        ],
        respostaCorreta: 'O predomínio da razão, da ciência e a defesa dos direitos individuais',
        indiceRespostaCorreta: 0,
        explicacao: 'Pensadores como Voltaire, Locke e Rousseau defendiam a luz da razão contra o obscurantismo.',
      },
      {
        enunciado: 'Para Aristóteles na obra Ética a Nicômaco, qual o objetivo final (Telos) de toda ação humana?',
        alternativas: ['Atingir a Felicidade (Eudaimonia)', 'Acumular riquezas materiais ilimitadas', 'Vencer guerras militares de conquista', 'Alcançar a imortalidade física'],
        respostaCorreta: 'Atingir a Felicidade (Eudaimonia)',
        indiceRespostaCorreta: 0,
        explicacao: 'Aristóteles sustentava que a virtude e o equilíbrio levam à eudaimonia (plenitude e felicidade ética).',
      },
      {
        enunciado: 'O que define o conceito moderno de Cidadania em um Estado Democrático de Direito?',
        alternativas: [
          'O exercício pleno de direitos civis, políticos e sociais atrelado ao cumprimento de deveres',
          'Apenas o direito de residir em uma grande cidade',
          'A posse obrigatória de títulos de nobreza imperial',
          'A isenção permanente de qualquer lei ou tributo público',
        ],
        respostaCorreta: 'O exercício pleno de direitos civis, políticos e sociais atrelado ao cumprimento de deveres',
        indiceRespostaCorreta: 0,
        explicacao: 'Cidadania é a participação ativa na vida comunitária com direitos fundamentais e responsabilidades.',
      },
    ],
    // Fase 4: Campanário do Cavaleiro (História Geral & do Brasil)
    [
      {
        enunciado: 'Em qual país e século teve início a Primeira Revolução Industrial com as máquinas a vapor?',
        alternativas: ['Inglaterra, no século XVIII', 'França, no século XVI', 'Alemanha, no século XIX', 'Estados Unidos, no século XVII'],
        respostaCorreta: 'Inglaterra, no século XVIII',
        indiceRespostaCorreta: 0,
        explicacao: 'A Grã-Bretanha reuniu carvão, ferro, capital e mão de obra, transformando a manufatura em maquinofatura.',
      },
      {
        enunciado: 'O que caracterizou o Feudalismo na Europa durante a Idade Média?',
        alternativas: [
          'Economia agrária descentralizada, relações de suserania e servidão camponesa',
          'Globalização comercial via comércio digital internacional',
          'Poder centralizado em presidentes eleitos por sufrágio universal',
          'Industrialização massiva com fábricas automatizadas',
        ],
        respostaCorreta: 'Economia agrária descentralizada, relações de suserania e servidão camponesa',
        indiceRespostaCorreta: 0,
        explicacao: 'O feudo era a unidade autossuficiente com laços de lealdade militar entre nobres.',
      },
      {
        enunciado: 'Em qual ano a Organização das Nações Unidas (ONU) proclamou a Declaração Universal dos Direitos Humanos?',
        alternativas: ['1948', '1918', '1789', '2000'],
        respostaCorreta: '1948',
        indiceRespostaCorreta: 0,
        explicacao: 'Após os horrores da 2ª Guerra Mundial, a DUDH estabeleceu a proteção inalienável da dignidade humana.',
      },
      {
        enunciado: 'Qual lei sancionada em 13 de maio de 1888 aboliu formalmente a escravidão no Brasil?',
        alternativas: ['Lei Áurea', 'Lei do Ventre Livre', 'Lei dos Sexagenários', 'Lei Eusébio de Queirós'],
        respostaCorreta: 'Lei Áurea',
        indiceRespostaCorreta: 0,
        explicacao: 'A Lei Áurea extinguiu a escravidão, embora sem fornecer garantias de integração social aos libertos.',
      },
    ],
  ],

  // ============================================================================
  // TRILHA 5: AVALIAÇÃO FINAL INTERDISCIPLINAR (VAZIO CÓSMICO)
  // ============================================================================
  vazio_cosmico: [
    // Fase 1: Fragmentos dos Tomos Perdidos (Pensamento Crítico & Metodologia)
    [
      {
        enunciado: 'No pensamento computacional e científico, o que significa o pilar da "Decomposição"?',
        alternativas: [
          'Dividir um problema complexo em partes menores e mais fáceis de resolver',
          'Descartar permanentemente informações consideradas difíceis',
          'Transformar código de computador em instruções mecânicas',
          'Repetir o mesmo procedimento até que o computador trave',
        ],
        respostaCorreta: 'Dividir um problema complexo em partes menores e mais fáceis de resolver',
        indiceRespostaCorreta: 0,
        explicacao: 'Decompor reduz a sobrecarga cognitiva ao solucionar subproblemas modulares.',
      },
      {
        enunciado: 'Qual a diferença crucial entre Correlação estatística e Relação de Causalidade?',
        alternativas: [
          'Correlação mostra eventos que variam juntos; causalidade prova que um evento gera o outro',
          'Não há qualquer diferença, ambas as expressões são sinônimos perfeitos',
          'Causalidade aplica-se somente a fórmulas de matemática financeira',
          'Correlação é sempre uma ilusão óptica não comprovada por dados',
        ],
        respostaCorreta: 'Correlação mostra eventos que variam juntos; causalidade prova que um evento gera o outro',
        indiceRespostaCorreta: 0,
        explicacao: 'Duas variáveis podem oscilar juntas por coincidência ou por um terceiro fator não observado.',
      },
      {
        enunciado: 'Por que a interdisciplinaridade é fundamental na formação contemporânea?',
        alternativas: [
          'Porque os desafios reais do mundo integram tecnologia, humanidades e ciências',
          'Para forçar o estudante a memorizar datas sem conexão entre si',
          'Porque reduz a necessidade de raciocínio lógico no cotidiano',
          'Apenas para economizar professores no ambiente escolar',
        ],
        respostaCorreta: 'Porque os desafios reais do mundo integram tecnologia, humanidades e ciências',
        indiceRespostaCorreta: 0,
        explicacao: 'Problemas complexos como clima, bioética e inteligência artificial exigem síntese multidisciplinar.',
      },
    ],
    // Fase 2: Nebulosa da Entropia Cósmica (Ética, IA & Teoria da Informação)
    [
      {
        enunciado: 'Na teoria da informação de Claude Shannon e na física, o que expressa o conceito de Entropia?',
        alternativas: [
          'A medida do grau de incerteza, desordem ou conteúdo de informação de um sistema',
          'A velocidade terminal de um corpo em queda livre na atmosfera',
          'A quantidade de volts gerada por uma turbina hidrelétrica',
          'A densidade de pixels em um monitor de cristal líquido',
        ],
        respostaCorreta: 'A medida do grau de incerteza, desordem ou conteúdo de informação de um sistema',
        indiceRespostaCorreta: 0,
        explicacao: 'Sistemas com maior imprevisibilidade carregam maior entropia de informação.',
      },
      {
        enunciado: 'Qual é o papel central da Ética no desenvolvimento de sistemas de Inteligência Artificial?',
        alternativas: [
          'Mitigar vieses discriminatórios, garantir transparência e proteger os direitos humanos',
          'Impedir que programas de computador processem cálculos matemáticos',
          'Tornar todos os computadores dependentes de comandos analógicos manuais',
          'Eliminar o acesso das pessoas à internet aberta e livre',
        ],
        respostaCorreta: 'Mitigar vieses discriminatórios, garantir transparência e proteger os direitos humanos',
        indiceRespostaCorreta: 0,
        explicacao: 'Algoritmos devem operar com responsabilidade, equidade e respeito às garantias civis.',
      },
      {
        enunciado: 'O que distingue a computação quântica da computação binária convencional?',
        alternativas: [
          'O uso de qubits com capacidade de superposição e entrelaçamento quântico',
          'O funcionamento sem necessidade de qualquer energia elétrica',
          'A capacidade de prever o futuro das pessoas com 100% de precisão',
          'A utilização exclusiva de engrenagens de cobre da era vitoriana',
        ],
        respostaCorreta: 'O uso de qubits com capacidade de superposição e entrelaçamento quântico',
        indiceRespostaCorreta: 0,
        explicacao: 'Qubits representam estados superpostos (0 e 1 simultaneamente), acelerando cálculos complexos.',
      },
    ],
    // Fase 3: Singularidade do Infinito (O Horizonte Final do Saber)
    [
      {
        enunciado: 'Em astrofísica, o que caracteriza uma Singularidade gravitacional em um buraco negro?',
        alternativas: [
          'Uma região de curvatura e densidade extremas onde as leis da física clássica colapsam',
          'Uma estrela comum feita exclusivamente de gás oxigênio puro',
          'Um planeta rochoso habitável localizado no centro da galáxia',
          'Um espelho cósmico que apenas reflete a luz das constelações vizinhas',
        ],
        respostaCorreta: 'Uma região de curvatura e densidade extremas onde as leis da física clássica colapsam',
        indiceRespostaCorreta: 0,
        explicacao: 'Na singularidade, a relatividade geral aponta para densidade infinita, requerendo gravidade quântica.',
      },
      {
        enunciado: 'Ao concluir sua jornada de aprendizado através de todas as trilhas, qual a missão de um mestre do conhecimento?',
        alternativas: [
          'Aplicar a sabedoria para melhorar a sociedade, ensinar os outros e seguir sempre aprendendo',
          'Guardar todo o conhecimento trancado para que ninguém mais possa evoluir',
          'Esquecer tudo o que aprendeu ao chegar ao final da jornada',
          'Parar de estudar e nunca mais fazer perguntas sobre o universo',
        ],
        respostaCorreta: 'Aplicar a sabedoria para melhorar a sociedade, ensinar os outros e seguir sempre aprendendo',
        indiceRespostaCorreta: 0,
        explicacao: 'O conhecimento só atinge seu verdadeiro propósito quando compartilhado para iluminar o mundo.',
      },
      {
        enunciado: 'Qual a principal lição que o método científico e a jornada do herói nos ensinam sobre os erros?',
        alternativas: [
          'Erros são hipóteses testadas que indicam caminhos de ajuste e evolução contínua',
          'Errar significa que o estudante deve desistir imediatamente de estudar',
          'Os grandes cientistas da história nunca cometeram nenhum erro',
          'Erros anulam permanentemente toda a experiência adquirida anteriormente',
        ],
        respostaCorreta: 'Erros são hipóteses testadas que indicam caminhos de ajuste e evolução contínua',
        indiceRespostaCorreta: 0,
        explicacao: 'Na ciência e na vida, o erro analisado é o motor do aprendizado e do aprimoramento.',
      },
    ],
  ],
};

/**
 * Retorna as perguntas temáticas para um determinado tema e fase (0 a 3).
 */
export function getThematicQuestions(theme: ThemeKey, phaseIndex: number): ThematicQuestion[] {
  const themeGroup = THEMATIC_QUESTIONS[theme] || THEMATIC_QUESTIONS.castelo;
  const safeIdx = Math.max(0, Math.min(phaseIndex, themeGroup.length - 1));
  return themeGroup[safeIdx] || themeGroup[0];
}

/**
 * Detecta com precisão hierárquica o tema da trilha com base na matéria, imagem, título e cenário.
 */
export function getTrilhaTheme(
  trilha?: { materia?: string; titulo?: string; descricao?: string; imagem?: string; image?: string; cenario?: string; trilhaTema?: string } | string | null
): ThemeKey {
  if (!trilha) return 'castelo';

  if (typeof trilha === 'string') {
    const s = trilha.toLowerCase().trim();
    if (s.includes('deserto') || s.includes('dunas') || s.includes('oasis') || s.includes('geo')) return 'deserto';
    if (s.includes('vila') || s.includes('mercado') || s.includes('aldeia') || s.includes('portug') || s.includes('literat') || s.includes('cienc')) return 'vila';
    if (s.includes('montanha') || s.includes('pico') || s.includes('matem') || (s.includes('fisic') && !s.includes('geo')) || s.includes('calculo')) return 'montanha';
    if (s.includes('vazio') || s.includes('cosmic')) return 'vazio_cosmico';
    return 'castelo';
  }

  // 1. Cenário ou tema explícito tem prioridade máxima
  const cenarioExplicit = (trilha.cenario || trilha.trilhaTema || '').toLowerCase().trim();
  if (cenarioExplicit.includes('deserto')) return 'deserto';
  if (cenarioExplicit.includes('vila')) return 'vila';
  if (cenarioExplicit.includes('montanha')) return 'montanha';
  if (cenarioExplicit.includes('vazio')) return 'vazio_cosmico';
  if (cenarioExplicit.includes('castelo')) return 'castelo';

  // 2. Imagem da Trilha (o que o usuário vê na capa do card é o que ele deve jogar!)
  const imgPath = (trilha.imagem || trilha.image || '').toLowerCase();
  if (imgPath.includes('deserto')) return 'deserto';
  if (imgPath.includes('vila')) return 'vila';
  if (imgPath.includes('montanha')) return 'montanha';
  if (imgPath.includes('castelo')) return 'castelo';
  if (imgPath.includes('vazio')) return 'vazio_cosmico';

  // 3. Matéria da Trilha (Hierarquia canônica das disciplinas)
  const materia = (trilha.materia || '').toLowerCase().trim();
  if (materia) {
    if (materia.includes('geo') || materia.includes('hist')) {
      return 'deserto'; // Geografia e História -> Deserto com pirâmides, ruínas e oásis
    }
    if (
      materia.includes('port') ||
      materia.includes('cien') ||
      materia.includes('bio') ||
      materia.includes('filo') ||
      materia.includes('sociol') ||
      materia.includes('literat') ||
      materia.includes('arte') ||
      materia.includes('ingles') ||
      materia.includes('espanhol')
    ) {
      return 'vila'; // Português, Literatura, Ciências e Humanas -> Vila Ancestral
    }
    if (
      materia.includes('mat') ||
      materia.includes('calc') ||
      (materia.includes('fis') && !materia.includes('geo'))
    ) {
      return 'montanha'; // Matemática, Cálculo e Física -> Pico da Lógica / Montanha
    }
    if (
      materia.includes('prog') ||
      materia.includes('comp') ||
      materia.includes('dado') ||
      materia.includes('soft') ||
      materia.includes('banco') ||
      materia.includes('tecnol') ||
      materia.includes('node')
    ) {
      return 'castelo'; // Computação, TI e Banco de Dados -> Castelo dos Dados
    }
  }

  // 4. Título da Trilha
  const titulo = (trilha.titulo || '').toLowerCase();
  if (
    titulo.includes('deserto') ||
    titulo.includes('dunas') ||
    titulo.includes('oasis') ||
    titulo.includes('oásis') ||
    titulo.includes('cartografia') ||
    titulo.includes('arenito') ||
    titulo.includes('egito') ||
    titulo.includes('piramide') ||
    titulo.includes('pirâmide')
  ) {
    return 'deserto';
  }
  if (
    titulo.includes('vila') ||
    titulo.includes('mercado') ||
    titulo.includes('aldeia') ||
    titulo.includes('crônica') ||
    titulo.includes('crônicas') ||
    titulo.includes('redação') ||
    titulo.includes('redacao') ||
    titulo.includes('gramática') ||
    titulo.includes('gramatica') ||
    titulo.includes('biblioteca') ||
    titulo.includes('filósofos')
  ) {
    return 'vila';
  }
  if (
    titulo.includes('montanha') ||
    titulo.includes('pico') ||
    titulo.includes('cume') ||
    titulo.includes('geometria') ||
    titulo.includes('álgebra') ||
    titulo.includes('algebra') ||
    titulo.includes('vetor') ||
    titulo.includes('trigonometria') ||
    titulo.includes('funções')
  ) {
    return 'montanha';
  }
  if (
    titulo.includes('castelo') ||
    titulo.includes('dados') ||
    titulo.includes('algoritmo') ||
    titulo.includes('código') ||
    titulo.includes('codigo') ||
    titulo.includes('servidor') ||
    titulo.includes('api') ||
    titulo.includes('sql')
  ) {
    return 'castelo';
  }

  // 5. Descrição (com proteção para termos ambíguos)
  const desc = (trilha.descricao || '').toLowerCase();
  if (desc.includes('deserto') || desc.includes('dunas') || desc.includes('oasis') || desc.includes('geografia')) {
    return 'deserto';
  }
  if (desc.includes('vila') || desc.includes('mercado') || desc.includes('crônicas') || desc.includes('literatura')) {
    return 'vila';
  }
  if (desc.includes('montanha') || desc.includes('pico') || desc.includes('matemática') || desc.includes('cálculo')) {
    return 'montanha';
  }
  if (desc.includes('vazio') || desc.includes('cosmico') || desc.includes('singularidade')) {
    return 'vazio_cosmico';
  }

  return 'castelo';
}
