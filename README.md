# EstudeMy - Mobile App 📚🎮

**EstudeMy Mobile** é a versão móvel oficial da plataforma de ensino gamificada do EstudeMy. O aplicativo é focado em transformar o processo de aprendizagem em uma jornada RPG divertida, interativa e altamente motivadora, inspirada em dinâmicas de progresso linear (estilo Duolingo).

---

## 🎨 Identidade Visual & Design System

O aplicativo utiliza uma estética **Retro-Flat / Cartoon Premium**, caracterizada por:
*   **Bordas Fortes e Sombras Marcadas:** Contornos escuros expressivos de 3px-4px que dão profundidade cartoon a todos os botões e cartões.
*   **Modo Escuro & Claro Dinâmico:** Suporte a temas controlados globalmente por meio do `ThemeContext`.
*   **Banners de Unidades Coloridos:** Cores vibrantes alternadas em cada seção de aprendizado.
*   **Avatares RPG Dinâmicos:** O boneco do personagem escolhido pelo usuário (Samurai, Mago ou Guerreiro) se desloca fisicamente sobre o mapa da trilha apontando a fase ativa.

---

## 🚀 Funcionalidades Principais

### 1. Trilha de Aprendizado em Zigzag (Estilo Duolingo)
*   **Progressão Linear Travada:** Fases futuras permanecem bloqueadas até que a fase atual seja concluída.
*   **Trilha Organizada:** Separação automática de seções e fases do banco de dados ordenadas por ordem de seção e ordem de fase de forma consistente.
*   **Tipos de Fases:** Fases do tipo **Conteúdo** (ícone de livro 📖) para leitura teórica e **Quiz** (ícone de estrela ⭐) para testes de conhecimento.

### 2. Guia de Estudos Tabulado
*   Um modal interativo com 3 abas acessível no cabeçalho de cada trilha:
    *   **🗺️ A Trilha:** Explica os estados das fases (bloqueadas, disponíveis, concluídas).
    *   **⚔️ O Jogo:** Detalha o sistema de RPG de vidas (❤️), moedas (🪙) e experiência (XP ✨).
    *   **🏆 Dicas:** Orienta sobre liderar o ranking global, estudar teoria primeiro e revisar lições.

### 3. Cadastro Inteligente Separado (Professor vs Aluno)
*   Fluxo de registro integrado que adapta os campos com base no tipo de perfil selecionado:
    *   **Aluno:** Nome Completo, Nome de Usuário, E-mail, Data de Nascimento e Senha.
    *   **Professor:** Adiciona os campos obrigatórios de **Registro Profissional** e **Titulação** (selecionáveis através de um seletor visual em grid).

### 4. Meus Cursos (Organizados por Progresso)
*   Acessível pelo menu "Mais", essa tela agrupa os cursos iniciados pelo usuário em duas abas:
    *   **Em Andamento:** Cursos com andamento parcial, acompanhados de barras de progresso com porcentagem e contagem de fases.
    *   **Concluídos:** Cursos 100% finalizados.

### 5. Lições Salvas (Favoritos)
*   Armazenamento local persistente de trilhas favoritas utilizando a API segura `expo-secure-store`.
*   Possibilidade de favoritar trilhas na página de detalhes e gerenciar a lista excluindo itens em tempo real diretamente na aba de Lições Salvas.

### 6. Mecanismo de Tradução Multi-idioma
*   Motor de internacionalização dinâmico que suporta **Português (pt-BR)**, **Inglês (en-US)** e **Espanhol (es-ES)**, traduzindo todas as telas e adaptando dinamicamente as trilhas listadas na Home com base no idioma selecionado.

---

## 🛠️ Tecnologias Utilizadas

*   **Core:** React Native (Expo SDK 57)
*   **Roteamento:** Expo Router (File-based Routing)
*   **Armazenamento Seguro:** `expo-secure-store`
*   **Ícones:** `lucide-react-native`
*   **Vetores/Logos:** `react-native-svg`
*   **Estilização:** StyleSheet nativo do React Native com suporte a temas.
*   **API Client:** Axios integrado à API EstudeMy Docker em produção.

---

## 📂 Estrutura de Pastas do App

```text
src/
├── app/                      # Rotas e Telas (Expo Router)
│   ├── (auth)/               # Telas de Login e Cadastro
│   ├── (tabs)/               # Abas principais (Home, Ranking, Mais)
│   ├── trilha/[id].tsx       # Detalhes e Zigzag da Trilha
│   ├── game/[faseId].tsx     # Execução da Fase / Quiz
│   ├── perfil.tsx            # Visualização do Perfil do Herói
│   ├── configuracoes.tsx     # Configurações do Sistema
│   ├── meus-cursos.tsx       # Cursos Iniciados / Concluídos
│   ├── licoes-salvas.tsx     # Coleção de Favoritos do Usuário
│   └── _layout.tsx           # Configuração de rotas raiz da pilha (Stack)
├── contexts/                 # Provedores de Contexto (Autenticação, Idioma, Tema)
├── constants/                # Ativos de imagens, backgrounds e vetores SVG
├── locales/                  # Dicionários JSON de Internacionalização
└── services/                 # Serviços de Conexão com API REST
```

---

## 🚀 Como Rodar o Projeto

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Configurar Variáveis de Ambiente:**
    Verifique se existe um arquivo `.env` na raiz do projeto configurado com a URL correta do backend de produção:
    ```env
    EXPO_PUBLIC_API_URL=https://estudemydocker.onrender.com
    ```

3.  **Iniciar o Metro Bundler:**
    ```bash
    npx expo start -c
    ```

4.  **Abrir o Aplicativo:**
    *   Pressione **`a`** para emular no Android (necessário Android Studio com Emulador aberto).
    *   Pressione **`i`** para emular no iOS (necessário Xcode / macOS).
    *   Escaneie o QR Code no seu dispositivo móvel usando o aplicativo **Expo Go**.

5.  **Verificações de Qualidade:**
    *   Para checar erros de tipo do TypeScript:
        ```bash
        npx tsc --noEmit
        ```
    *   Para checar linting do código:
        ```bash
        npm run lint
        ```
