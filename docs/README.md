# 📚 Documentação do Projeto EstudeMy

Este diretório centraliza todos os relatórios, manuais técnicos, diagramas de arquitetura e análises de segurança do projeto **EstudeMy**.

---

## 📁 Estrutura de Documentos

### 1. ☁️ Arquitetura e Computação em Nuvem (`docs/architecture/`)
* [Documentacao_EstudeMy_Nuvem.md](./architecture/Documentacao_EstudeMy_Nuvem.md): Visão geral da topologia em nuvem da plataforma.
* [IMPLEMENTACAO_NUVEM.md](./architecture/IMPLEMENTACAO_NUVEM.md): Relatório técnico completo de implantação da infraestrutura em nuvem, contendo os 14 requisitos do edital, testes de estresse, segurança e evidências.
* [PLANEJAMENTO_IMPLANTACAO_NUVEM.md](./architecture/PLANEJAMENTO_IMPLANTACAO_NUVEM.md): Planejamento e levantamento inicial dos requisitos de nuvem.
* [CLOUDSTACK.md](./architecture/CLOUDSTACK.md): Manual passo a passo para implantação de nuvem privada corporativa utilizando Apache CloudStack 4.22 LTS.
* [DOCKER.md](./architecture/DOCKER.md): Guia de contêineres Docker, orquestração multi-ambiente e healthchecks.
* [diagrama_arquitetura_nuvem.svg](./architecture/diagrama_arquitetura_nuvem.svg): Diagrama vetorial completo da arquitetura multi-cloud (Edge/WAF, DMZ, Subnet Privada, Banco e Observabilidade).

---

### 2. 🛡️ Segurança e Análise de Riscos (`docs/security/`)
* [Relatorio_Riscos_Seguranca_EstudeMy.md](./security/Relatorio_Riscos_Seguranca_EstudeMy.md): Relatório analítico completo dos 11 Riscos-Chave (OWASP Top 10 e AppSec), contendo impacto, probabilidade, mitigação e matriz de severidade.
* [Relatorio_Analise_de_Riscos_EstudeMy.pdf](./security/Relatorio_Analise_de_Riscos_EstudeMy.pdf): Versão em PDF consolidada do relatório de análise de riscos.
* [Analise_de_Riscos_Seguranca_EstudeMy.pdf](./security/Analise_de_Riscos_Seguranca_EstudeMy.pdf): Cópia diagramada do relatório de riscos de segurança.
* [relatorio_riscos_imprimir.html](./security/relatorio_riscos_imprimir.html): Relatório de riscos formatado especificamente para visualização e impressão em folha A4.
* [relatorio_riscos.html](./security/relatorio_riscos.html): Visualizador interativo web do relatório de riscos.
* [rascunho_analise_riscos.txt](./security/rascunho_analise_riscos.txt): Notas de apoio e cálculos de criticidade de risco.

---

### 3. 📊 Relatórios Formatados para Impressão (`docs/reports/`)
* [relatorio_nuvem_imprimir.html](./reports/relatorio_nuvem_imprimir.html): Relatório acadêmico da disciplina de Computação em Nuvem I, com cabeçalho institucional FATEC/CEETEPS, gráficos e diagramas.
* [relatorio_machine_learning_imprimir.html](./reports/relatorio_machine_learning_imprimir.html): Relatório detalhado dos modelos de Machine Learning (K-Means, PCA, Random Forest) aplicados ao dataset sintético de 1.000 alunos.

---

### 4. 🤖 Machine Learning (`ml/`)
* [ml/RELATORIO_MACHINE_LEARNING.md](../ml/RELATORIO_MACHINE_LEARNING.md): Relatório técnico da entrega de Inteligência Artificial / Machine Learning.
* [ml/EstudeMy_Machine_Learning.ipynb](../ml/EstudeMy_Machine_Learning.ipynb): Jupyter Notebook com a exploração de dados, treinamento e validação dos modelos.
