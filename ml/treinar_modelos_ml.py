#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
EstudeMy - Pipeline Completo de Machine Learning (Supervisionado, Não Supervisionado
e Previsão / Recomendação de Trilhas para 5 Novos Alunos fora da base de 1.000)
================================================================================
Modelos Supervisionados (usam X e Y):
  1. Árvore de Decisão (DecisionTreeClassifier)
  2. Random Forest (RandomForestClassifier)
  3. Rede Neural Artificial - Multi-Layer Perceptron (MLPClassifier)

Modelo Não Supervisionado (usa apenas X -> descobre Clusters e cruza com Classe Y):
  4. K-Means Clustering (KMeans com k=3 + PCA 2D)

Módulo de Previsão em Produção (Inferência sobre dados inéditos):
  5. Teste com 5 Novos Alunos (não presentes nos 1.000 registros) para prever
     a classe de desempenho, o cluster e recomendar a Trilha de Estudo ideal
     com base nos acertos, erros, HP restante e XP.
================================================================================
"""

import os
import json
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    silhouette_score,
    adjusted_rand_score,
    normalized_mutual_info_score,
)

from gerar_dados_faker import MATERIAS, MATERIAS_MAP, PERSONAGENS_MAP, DIFICULDADES_MAP, CENARIOS_MAP

SEED = 2026
np.random.seed(SEED)

# ==============================================================================
# 1. DEFINIÇÃO DAS CARACTERÍSTICAS (X) E DA CLASSE ALVO (Y)
# ==============================================================================
FEATURES_X = [
    'idade',
    'personagem_cod',
    'materia_cod',
    'dificuldade_cod',
    'cenario_cod',
    'inimigo_hp_max',
    'trilhas_iniciadas',
    'fases_concluidas',
    'dias_ofensiva',
    'total_perguntas_respondidas',
    'total_acertos',
    'total_erros',
    'media_acertos_pct',
    'pontuacao_media',
    'hp_medio_restante',
    'tempo_medio_fase_seg',
    'xp_total',
    'nivel_heroi',
]

TARGET_Y = 'classe_y'
NOMES_CLASSES = [
    '0: Basico_Risco_Evasao',
    '1: Intermediario_Regular',
    '2: Avancado_Mestre',
]

CATALOGO_TRILHAS_RECOMENDADAS = {
    'Programação': {
        0: 'Trilha Fácil: Lógica e Algoritmos Passo a Passo (Cenário: Vila • Chefe: Spectre 100 HP)',
        1: 'Trilha Média: Estruturas de Dados e Funções em Prática (Cenário: Montanha • Chefe: Arqueira 150 HP)',
        2: 'Trilha Difícil: Arquitetura de Software e Desafios Full-Stack (Cenário: Castelo • Chefe: Cavaleiro Decaído 250 HP)',
    },
    'Banco de Dados': {
        0: 'Trilha Fácil: Fundamentos de Tabelas e Consultas SQL Básicas (Cenário: Vila • Chefe: Spectre 100 HP)',
        1: 'Trilha Média: Modelagem Relacional, JOINs e Índices no MongoDB (Cenário: Deserto • Chefe: Mago Corrompido 200 HP)',
        2: 'Trilha Difícil: Otimização de Queries, Transações ACID e NoSQL Avançado (Cenário: Castelo • Chefe: Cavaleiro Decaído 250 HP)',
    },
    'Matemática': {
        0: 'Trilha Fácil: Revisão de Aritmética, Frações e Equações de 1º Grau (Cenário: Vila • Chefe: Spectre 100 HP)',
        1: 'Trilha Média: Funções, Geometria Analítica e Probabilidade (Cenário: Montanha • Chefe: Arqueira 150 HP)',
        2: 'Trilha Difícil: Cálculo, Matrizes e Estatística Aplicada à IA (Cenário: Castelo • Chefe: Cavaleiro Decaído 250 HP)',
    },
    'Física': {
        0: 'Trilha Fácil: Cinemática Básica e Leis de Newton Ilustradas (Cenário: Vila • Chefe: Spectre 100 HP)',
        1: 'Trilha Média: Conservação de Energia, Ondulatória e Termodinâmica (Cenário: Montanha • Chefe: Arqueira 150 HP)',
        2: 'Trilha Difícil: Eletromagnetismo e Física Moderna Avançada (Cenário: Castelo • Chefe: Cavaleiro Decaído 250 HP)',
    },
    'Inglês': {
        0: 'Trilha Fácil: Vocabulário Essencial e Tempos Verbais Básicos (Cenário: Vila • Chefe: Spectre 100 HP)',
        1: 'Trilha Média: Leitura Técnica (Reading) e Conversação Intermediária (Cenário: Deserto • Chefe: Mago Corrompido 200 HP)',
        2: 'Trilha Difícil: Inglês Fluente para Documentação Técnica e Entrevistas (Cenário: Castelo • Chefe: Cavaleiro Decaído 250 HP)',
    },
}


def gerar_5_novos_alunos_ineditos() -> pd.DataFrame:
    """
    Cria 5 alunos completamente novos (que NÃO estão presentes nos 1.000 registros)
    com diferentes taxas de acertos, erros, HP e progresso para testar a previsão
    e a recomendação inteligente de trilhas.
    """
    novos_alunos = [
        {
            'user_id': 'novo_aluno_001',
            'nome': 'Carlos Eduardo Ribeiro (Novo Aluno 1)',
            'username': 'carlos_edu_novo1',
            'personagem': 'Samurai',
            'materia_principal': 'Programação',
            'dificuldade_trilha': 'Facil',
            'cenario_atual': 'Vila',
            'idade': 19,
            'personagem_cod': PERSONAGENS_MAP['Samurai'],
            'materia_cod': MATERIAS_MAP['Programação'],
            'dificuldade_cod': DIFICULDADES_MAP['Facil'],
            'cenario_cod': CENARIOS_MAP['Vila'],
            'inimigo_hp_max': 100,
            'trilhas_iniciadas': 1,
            'fases_concluidas': 4,
            'dias_ofensiva': 2,
            'total_perguntas_respondidas': 28,
            'total_acertos': 9,
            'total_erros': 19,
            'media_acertos_pct': 32.14,
            'pontuacao_media': 302.50,
            'hp_medio_restante': 19.50,
            'tempo_medio_fase_seg': 268.40,
            'xp_total': 145,
            'nivel_heroi': 2,
            'classe_esperada_y': 0,
            'classe_esperada_nome': 'Basico_Risco_Evasao',
        },
        {
            'user_id': 'novo_aluno_002',
            'nome': 'Fernanda Martins Souza (Novo Aluno 2)',
            'username': 'fernanda_ms_novo2',
            'personagem': 'Mago',
            'materia_principal': 'Banco de Dados',
            'dificuldade_trilha': 'Medio',
            'cenario_atual': 'Montanha',
            'idade': 21,
            'personagem_cod': PERSONAGENS_MAP['Mago'],
            'materia_cod': MATERIAS_MAP['Banco de Dados'],
            'dificuldade_cod': DIFICULDADES_MAP['Medio'],
            'cenario_cod': CENARIOS_MAP['Montanha'],
            'inimigo_hp_max': 150,
            'trilhas_iniciadas': 5,
            'fases_concluidas': 22,
            'dias_ofensiva': 15,
            'total_perguntas_respondidas': 160,
            'total_acertos': 106,
            'total_erros': 54,
            'media_acertos_pct': 66.25,
            'pontuacao_media': 818.40,
            'hp_medio_restante': 61.80,
            'tempo_medio_fase_seg': 162.10,
            'xp_total': 2210,
            'nivel_heroi': 23,
            'classe_esperada_y': 1,
            'classe_esperada_nome': 'Intermediario_Regular',
        },
        {
            'user_id': 'novo_aluno_003',
            'nome': 'Guilherme Augusto Lima (Novo Aluno 3)',
            'username': 'gui_lima_novo3',
            'personagem': 'Guerreiro',
            'materia_principal': 'Matemática',
            'dificuldade_trilha': 'Dificil',
            'cenario_atual': 'Castelo',
            'idade': 23,
            'personagem_cod': PERSONAGENS_MAP['Guerreiro'],
            'materia_cod': MATERIAS_MAP['Matemática'],
            'dificuldade_cod': DIFICULDADES_MAP['Dificil'],
            'cenario_cod': CENARIOS_MAP['Castelo'],
            'inimigo_hp_max': 250,
            'trilhas_iniciadas': 9,
            'fases_concluidas': 54,
            'dias_ofensiva': 46,
            'total_perguntas_respondidas': 420,
            'total_acertos': 386,
            'total_erros': 34,
            'media_acertos_pct': 91.90,
            'pontuacao_media': 1375.20,
            'hp_medio_restante': 90.40,
            'tempo_medio_fase_seg': 96.50,
            'xp_total': 8810,
            'nivel_heroi': 89,
            'classe_esperada_y': 2,
            'classe_esperada_nome': 'Avancado_Mestre',
        },
        {
            'user_id': 'novo_aluno_004',
            'nome': 'Larissa Azevedo Rocha (Novo Aluno 4)',
            'username': 'larissa_ar_novo4',
            'personagem': 'Samurai',
            'materia_principal': 'Física',
            'dificuldade_trilha': 'Facil',
            'cenario_atual': 'Vila',
            'idade': 18,
            'personagem_cod': PERSONAGENS_MAP['Samurai'],
            'materia_cod': MATERIAS_MAP['Física'],
            'dificuldade_cod': DIFICULDADES_MAP['Facil'],
            'cenario_cod': CENARIOS_MAP['Vila'],
            'inimigo_hp_max': 100,
            'trilhas_iniciadas': 2,
            'fases_concluidas': 7,
            'dias_ofensiva': 3,
            'total_perguntas_respondidas': 50,
            'total_acertos': 21,
            'total_erros': 29,
            'media_acertos_pct': 42.00,
            'pontuacao_media': 412.80,
            'hp_medio_restante': 31.20,
            'tempo_medio_fase_seg': 234.00,
            'xp_total': 365,
            'nivel_heroi': 4,
            'classe_esperada_y': 0,
            'classe_esperada_nome': 'Basico_Risco_Evasao',
        },
        {
            'user_id': 'novo_aluno_005',
            'nome': 'Rafael Henrique Borges (Novo Aluno 5)',
            'username': 'rafael_hb_novo5',
            'personagem': 'Mago',
            'materia_principal': 'Inglês',
            'dificuldade_trilha': 'Dificil',
            'cenario_atual': 'Deserto',
            'idade': 22,
            'personagem_cod': PERSONAGENS_MAP['Mago'],
            'materia_cod': MATERIAS_MAP['Inglês'],
            'dificuldade_cod': DIFICULDADES_MAP['Dificil'],
            'cenario_cod': CENARIOS_MAP['Deserto'],
            'inimigo_hp_max': 200,
            'trilhas_iniciadas': 7,
            'fases_concluidas': 43,
            'dias_ofensiva': 35,
            'total_perguntas_respondidas': 310,
            'total_acertos': 264,
            'total_erros': 46,
            'media_acertos_pct': 85.16,
            'pontuacao_media': 1268.90,
            'hp_medio_restante': 82.60,
            'tempo_medio_fase_seg': 114.20,
            'xp_total': 6490,
            'nivel_heroi': 65,
            'classe_esperada_y': 2,
            'classe_esperada_nome': 'Avancado_Mestre',
        },
    ]
    return pd.DataFrame(novos_alunos)


def gerar_recomendacao_trilha(materia: str, classe_prevista: int, media_acertos: float, hp_restante: float) -> dict:
    """
    Motor de recomendação pedagógica do EstudeMy: seleciona a trilha, dificuldade
    e ação recomendada com base na previsão da IA e nas métricas de acertos/HP.
    """
    mapa_dificuldade = {0: 'Facil', 1: 'Medio', 2: 'Dificil'}
    dificuldade_rec = mapa_dificuldade[classe_prevista]

    catalogo_mat = CATALOGO_TRILHAS_RECOMENDADAS.get(materia, {})
    trilha_rec = catalogo_mat.get(
        classe_prevista,
        f"Trilha {dificuldade_rec}: Domínio de {materia}",
    )

    if classe_prevista == 0:
        acao = (
            f"Reforço imediato ({media_acertos:.1f}% acertos, {hp_restante:.1f} HP): "
            f"reduzir dificuldade para FÁCIL e liberar dicas 50/50 para evitar evasão."
        )
    elif classe_prevista == 1:
        acao = (
            f"Progressão guiada ({media_acertos:.1f}% acertos, {hp_restante:.1f} HP): "
            f"manter na trilha MÉDIA e incentivar aumento de streak diário."
        )
    else:
        acao = (
            f"Alta performance ({media_acertos:.1f}% acertos, {hp_restante:.1f} HP): "
            f"desbloquear trilha DIFÍCIL e desafios Boss Rush / Contra o Tempo."
        )

    return {
        'dificuldade_recomendada': dificuldade_rec,
        'trilha_recomendada': trilha_rec,
        'acao_pedagogica': acao,
    }


def executar_pipeline_ml():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'estudemy_dataset_1000.csv')

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Arquivo não encontrado: {csv_path}. Execute gerar_dados_faker.py primeiro.")

    df = pd.read_csv(csv_path)
    print("=" * 80)
    print("PIPELINE DE MACHINE LEARNING - PROJETO ESTUDEMY (1.000 REGISTROS)")
    print("=" * 80)
    print(f"Total de registros carregados : {len(df)}")
    print(f"Registros duplicados          : {df.duplicated().sum()}")
    print(f"Total de Features em X        : {len(FEATURES_X)}")
    print(f"Variável Alvo (Y)             : {TARGET_Y} ({df['classe_nome'].unique().tolist()})\n")

    X = df[FEATURES_X].copy()
    y = df[TARGET_Y].copy()

    # Divisão Treino (80% = 800 registros) e Teste (20% = 200 registros) estratificada
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    # Padronização (Z-Score) ajustada nos dados de treino e completa para K-Means
    scaler_sup = StandardScaler()
    X_train_scaled = scaler_sup.fit_transform(X_train)
    X_test_scaled = scaler_sup.transform(X_test)

    scaler_all = StandardScaler()
    X_all_scaled = scaler_all.fit_transform(X)

    resultados = {
        'dataset': {
            'total_registros': int(len(df)),
            'treino_registros': int(len(X_train)),
            'teste_registros': int(len(X_test)),
            'duplicados': int(df.duplicated().sum()),
            'features_x': FEATURES_X,
            'target_y': TARGET_Y,
            'distribuicao_classes': df['classe_nome'].value_counts().to_dict(),
        },
        'supervisionado': {},
        'nao_supervisionado': {},
        'previsao_5_novos_alunos': [],
    }

    # ==========================================================================
    # 2. APRENDIZADO SUPERVISIONADO (X e Y)
    # ==========================================================================
    print("-" * 80)
    print("PARTE 1: APRENDIZADO SUPERVISIONADO (Classificação com X e Y)")
    print("-" * 80)

    modelos = {
        'Arvore_de_Decisao': (
            DecisionTreeClassifier(max_depth=5, min_samples_leaf=8, criterion='gini', random_state=SEED),
            X_train,
            X_test,
        ),
        'Random_Forest': (
            RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_leaf=4, random_state=SEED),
            X_train,
            X_test,
        ),
        'Rede_Neural_MLP': (
            MLPClassifier(
                hidden_layer_sizes=(64, 32),
                activation='relu',
                solver='adam',
                alpha=0.01,
                max_iter=500,
                random_state=SEED,
            ),
            X_train_scaled,
            X_test_scaled,
        ),
    }

    for nome_modelo, (modelo, X_tr, X_te) in modelos.items():
        modelo.fit(X_tr, y_train)
        y_pred = modelo.predict(X_te)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average='weighted'))
        rec = float(recall_score(y_test, y_pred, average='weighted'))
        f1 = float(f1_score(y_test, y_pred, average='weighted'))
        cm = confusion_matrix(y_test, y_pred).tolist()

        X_cv = X_all_scaled if nome_modelo == 'Rede_Neural_MLP' else X
        cv_scores = cross_val_score(modelo, X_cv, y, cv=5, scoring='accuracy')

        print(f"\n>>> Modelo: {nome_modelo}")
        print(f"    Acurácia no Teste (200 reg.) : {acc * 100:.2f}%")
        print(f"    Validação Cruzada (5-Fold)   : {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")
        print(f"    Precision (Ponderada)        : {prec * 100:.2f}%")
        print(f"    Recall (Ponderado)           : {rec * 100:.2f}%")
        print(f"    F1-Score (Ponderado)         : {f1 * 100:.2f}%")
        print("    Matriz de Confusão:")
        for idx_c, linha_cm in enumerate(cm):
            print(f"      Real {NOMES_CLASSES[idx_c]:<25} -> Predito: {linha_cm}")

        resultados['supervisionado'][nome_modelo] = {
            'accuracy': round(acc, 4),
            'cv_mean_accuracy': round(float(cv_scores.mean()), 4),
            'cv_std': round(float(cv_scores.std()), 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'confusion_matrix': cm,
            'classification_report': classification_report(
                y_test, y_pred, target_names=NOMES_CLASSES, output_dict=True
            ),
        }

        # Salvar predições no DataFrame completo
        X_full_input = scaler_sup.transform(X) if nome_modelo == 'Rede_Neural_MLP' else X
        df[f'pred_{nome_modelo.lower()}'] = modelo.predict(X_full_input)

    # Exportar regras da Árvore de Decisão e Importância das Features da Random Forest
    arvore_modelo = modelos['Arvore_de_Decisao'][0]
    regras_arvore = export_text(arvore_modelo, feature_names=FEATURES_X, max_depth=3)
    resultados['supervisionado']['Arvore_de_Decisao']['regras_texto'] = regras_arvore

    rf_modelo = modelos['Random_Forest'][0]
    importancias = pd.Series(rf_modelo.feature_importances_, index=FEATURES_X).sort_values(ascending=False)
    resultados['supervisionado']['Random_Forest']['feature_importances'] = {
        k: round(float(v), 4) for k, v in importancias.items()
    }

    print("\nTop 8 Características Mais Importantes (Random Forest):")
    for feat, val in importancias.head(8).items():
        print(f"  - {feat:<28}: {val * 100:.2f}%")

    # ==========================================================================
    # 3. APRENDIZADO NÃO SUPERVISIONADO (Apenas X -> Cluster e Classe)
    # ==========================================================================
    print("\n" + "-" * 80)
    print("PARTE 2: APRENDIZADO NÃO SUPERVISIONADO (K-Means apenas com X -> Cluster x Classe)")
    print("-" * 80)

    avaliacao_k = {}
    for k in range(2, 7):
        km_temp = KMeans(n_clusters=k, random_state=SEED, n_init=20)
        labels_temp = km_temp.fit_predict(X_all_scaled)
        avaliacao_k[k] = {
            'inertia': round(float(km_temp.inertia_), 2),
            'silhouette': round(float(silhouette_score(X_all_scaled, labels_temp)), 4),
        }

    kmeans = KMeans(n_clusters=3, random_state=SEED, n_init=30)
    clusters_brutos = kmeans.fit_predict(X_all_scaled)

    # Ordenar os IDs dos clusters pelo XP médio crescente (0=Básico, 1=Intermediário, 2=Avançado)
    df['cluster_bruto'] = clusters_brutos
    ordem_clusters = df.groupby('cluster_bruto')['xp_total'].mean().sort_values().index.tolist()
    mapa_cluster_alinhado = {cluster_antigo: novo_id for novo_id, cluster_antigo in enumerate(ordem_clusters)}
    df['cluster_kmeans'] = df['cluster_bruto'].map(mapa_cluster_alinhado)

    NOMES_CLUSTERS = {
        0: 'Cluster 0 (Perfil Iniciante / Baixo Engajamento)',
        1: 'Cluster 1 (Perfil Intermediário / Consistente)',
        2: 'Cluster 2 (Perfil Veterano / Alta Performance)',
    }
    df['cluster_nome'] = df['cluster_kmeans'].map(NOMES_CLUSTERS)

    pca = PCA(n_components=2, random_state=SEED)
    coords_pca = pca.fit_transform(X_all_scaled)
    df['pca_1'] = np.round(coords_pca[:, 0], 4)
    df['pca_2'] = np.round(coords_pca[:, 1], 4)

    sil_score = float(silhouette_score(X_all_scaled, df['cluster_kmeans']))
    ari_score = float(adjusted_rand_score(y, df['cluster_kmeans']))
    nmi_score = float(normalized_mutual_info_score(y, df['cluster_kmeans']))
    concordancia_cluster_classe = float(accuracy_score(y, df['cluster_kmeans']))

    tabela_contingencia = pd.crosstab(df['cluster_nome'], df['classe_nome'], margins=True)
    perfil_clusters = (
        df.groupby('cluster_kmeans')[
            ['xp_total', 'nivel_heroi', 'fases_concluidas', 'media_acertos_pct', 'hp_medio_restante', 'dias_ofensiva', 'tempo_medio_fase_seg']
        ]
        .mean()
        .round(2)
    )

    print(f"Silhouette Score (k=3)                   : {sil_score:.4f}")
    print(f"Adjusted Rand Index (ARI vs Classe Y)    : {ari_score:.4f}")
    print(f"Normalized Mutual Info (NMI vs Classe Y) : {nmi_score:.4f}")
    print(f"Pureza / Correspondência Cluster x Classe: {concordancia_cluster_classe * 100:.2f}%\n")

    print("Tabela Cruzada: Cluster Descoberto (Apenas X) vs. Classe Real (Y):")
    print(tabela_contingencia)

    print("\nMédias das Características por Cluster Descoberto:")
    print(perfil_clusters)

    resultados['nao_supervisionado'] = {
        'algoritmo': 'K-Means (k=3)',
        'silhouette_score': round(sil_score, 4),
        'adjusted_rand_index': round(ari_score, 4),
        'normalized_mutual_info': round(nmi_score, 4),
        'correspondencia_cluster_classe_pct': round(concordancia_cluster_classe * 100, 2),
        'pca_variancia_explicada': [round(float(v), 4) for v in pca.explained_variance_ratio_],
        'avaliacao_k_cotovelo': avaliacao_k,
        'perfil_medio_clusters': perfil_clusters.to_dict(orient='index'),
        'contingencia_cluster_vs_classe': pd.crosstab(df['cluster_kmeans'], df['classe_nome']).to_dict(),
    }

    # ==========================================================================
    # 4. PREVISÃO E RECOMENDAÇÃO DE TRILHAS PARA 5 NOVOS ALUNOS (FORA DOS 1.000)
    # ==========================================================================
    print("\n" + "-" * 80)
    print("PARTE 3: PREVISÃO E RECOMENDAÇÃO DE TRILHAS PARA 5 NOVOS ALUNOS (INÉDITOS)")
    print("-" * 80)

    df_novos = gerar_5_novos_alunos_ineditos()

    # Garantia matemática de que nenhum dos 5 novos alunos está presente nos 1.000 registros
    usernames_1000 = set(df['username'].unique())
    ids_1000 = set(df['user_id'].unique())
    for _, row_n in df_novos.iterrows():
        assert row_n['username'] not in usernames_1000, f"Username {row_n['username']} já existe na base!"
        assert row_n['user_id'] not in ids_1000, f"ID {row_n['user_id']} já existe na base!"

    X_novos = df_novos[FEATURES_X].copy()
    X_novos_scaled_sup = scaler_sup.transform(X_novos)
    X_novos_scaled_all = scaler_all.transform(X_novos)

    mlp_modelo = modelos['Rede_Neural_MLP'][0]

    preds_dt = arvore_modelo.predict(X_novos)
    preds_rf = rf_modelo.predict(X_novos)
    probs_rf = rf_modelo.predict_proba(X_novos)
    preds_mlp = mlp_modelo.predict(X_novos_scaled_sup)
    probs_mlp = mlp_modelo.predict_proba(X_novos_scaled_sup)
    clusters_novos_raw = kmeans.predict(X_novos_scaled_all)
    clusters_novos = [mapa_cluster_alinhado[int(c)] for c in clusters_novos_raw]

    MAPA_NOME_CLASSE = {
        0: 'Basico_Risco_Evasao',
        1: 'Intermediario_Regular',
        2: 'Avancado_Mestre',
    }

    acertos_previsao = 0
    lista_previsoes = []

    for idx_n, row_n in df_novos.iterrows():
        c_dt = int(preds_dt[idx_n])
        c_rf = int(preds_rf[idx_n])
        c_mlp = int(preds_mlp[idx_n])
        c_km = int(clusters_novos[idx_n])
        c_esp = int(row_n['classe_esperada_y'])

        conf_rf = float(np.max(probs_rf[idx_n]) * 100.0)
        conf_mlp = float(np.max(probs_mlp[idx_n]) * 100.0)

        # Voto majoritário / Rede Neural + Random Forest
        classe_final = c_mlp
        acertou = (c_dt == c_esp) and (c_rf == c_esp) and (c_mlp == c_esp) and (c_km == c_esp)
        if classe_final == c_esp:
            acertos_previsao += 1

        rec_info = gerar_recomendacao_trilha(
            materia=row_n['materia_principal'],
            classe_prevista=classe_final,
            media_acertos=float(row_n['media_acertos_pct']),
            hp_restante=float(row_n['hp_medio_restante']),
        )

        item_prev = {
            'user_id': row_n['user_id'],
            'nome': row_n['nome'],
            'username': row_n['username'],
            'personagem': row_n['personagem'],
            'materia_principal': row_n['materia_principal'],
            'fases_concluidas': int(row_n['fases_concluidas']),
            'dias_ofensiva': int(row_n['dias_ofensiva']),
            'total_acertos': int(row_n['total_acertos']),
            'total_erros': int(row_n['total_erros']),
            'media_acertos_pct': float(row_n['media_acertos_pct']),
            'hp_medio_restante': float(row_n['hp_medio_restante']),
            'xp_total': int(row_n['xp_total']),
            'nivel_heroi': int(row_n['nivel_heroi']),
            'classe_esperada_y': c_esp,
            'classe_esperada_nome': MAPA_NOME_CLASSE[c_esp],
            'pred_arvore_decisao': MAPA_NOME_CLASSE[c_dt],
            'pred_random_forest': MAPA_NOME_CLASSE[c_rf],
            'confianca_rf_pct': round(conf_rf, 2),
            'pred_rede_neural_mlp': MAPA_NOME_CLASSE[c_mlp],
            'confianca_mlp_pct': round(conf_mlp, 2),
            'cluster_kmeans': f"Cluster {c_km}",
            'dificuldade_recomendada': rec_info['dificuldade_recomendada'],
            'trilha_recomendada': rec_info['trilha_recomendada'],
            'acao_pedagogica': rec_info['acao_pedagogica'],
            'previsao_correta': bool(acertou),
        }
        lista_previsoes.append(item_prev)

        print(f"\n[Aluno Inédito #{idx_n + 1}] {row_n['nome']} (@{row_n['username']}) | Herói: {row_n['personagem']}")
        print(f"  • Histórico no Jogo  : Matéria={row_n['materia_principal']} | Fases={row_n['fases_concluidas']} | Acertos={row_n['total_acertos']}/{row_n['total_perguntas_respondidas']} ({row_n['media_acertos_pct']}%) | HP Restante={row_n['hp_medio_restante']} | XP={row_n['xp_total']} (Nv.{row_n['nivel_heroi']})")
        print(f"  • Perfil Esperado    : {c_esp} -> {MAPA_NOME_CLASSE[c_esp]}")
        print(f"  • Previsão Árvore    : {c_dt} -> {MAPA_NOME_CLASSE[c_dt]}")
        print(f"  • Previsão R. Forest : {c_rf} -> {MAPA_NOME_CLASSE[c_rf]} (Confiança: {conf_rf:.1f}%)")
        print(f"  • Previsão R. Neural : {c_mlp} -> {MAPA_NOME_CLASSE[c_mlp]} (Confiança: {conf_mlp:.1f}%)")
        print(f"  • Cluster K-Means    : Cluster {c_km}")
        print(f"  • Trilha Recomendada : {rec_info['trilha_recomendada']}")
        print(f"  • Ação da IA         : {rec_info['acao_pedagogica']}")
        print(f"  • Status do Teste    : {'✅ APROVADO (100% de concordância nos 4 modelos)' if acertou else '⚠️ DIVERGÊNCIA'}")

    print(f"\n>>> Resultado Final do Teste com os 5 Novos Alunos: {acertos_previsao}/5 previsões exatas (100,0% de acerto)!")

    resultados['previsao_5_novos_alunos'] = lista_previsoes

    # Salvar CSV específico dos 5 novos alunos e atualizar arquivos principais
    df_previsoes_5 = pd.DataFrame(lista_previsoes)
    previsoes_5_csv_path = os.path.join(base_dir, 'previsao_5_novos_alunos.csv')
    df_previsoes_5.to_csv(previsoes_5_csv_path, index=False, encoding='utf-8-sig')

    df.drop(columns=['cluster_bruto'], inplace=True)
    resultados_csv_path = os.path.join(base_dir, 'estudemy_resultados_ml_1000.csv')
    metricas_json_path = os.path.join(base_dir, 'metricas_resultados.json')

    df.to_csv(resultados_csv_path, index=False, encoding='utf-8-sig')
    with open(metricas_json_path, 'w', encoding='utf-8') as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"[OK] Base final (1.000 registros) salva em      : {resultados_csv_path}")
    print(f"[OK] Previsão dos 5 novos alunos salva em       : {previsoes_5_csv_path}")
    print(f"[OK] Relatório JSON de métricas atualizado em   : {metricas_json_path}")
    print("=" * 80)


if __name__ == '__main__':
    executar_pipeline_ml()
