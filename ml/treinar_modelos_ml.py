#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
EstudeMy - Pipeline Completo de Machine Learning (Supervisionado e Não Supervisionado)
================================================================================
Modelos Supervisionados (usam X e Y):
  1. Árvore de Decisão (DecisionTreeClassifier)
  2. Random Forest (RandomForestClassifier)
  3. Rede Neural Artificial - Multi-Layer Perceptron (MLPClassifier)

Modelo Não Supervisionado (usa apenas X -> descobre Clusters e cruza com Classe Y):
  4. K-Means Clustering (KMeans com k=3 + PCA 2D)
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

    # Padronização (Z-Score) para Rede Neural e K-Means
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_all_scaled = scaler.fit_transform(X)

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
        X_full_input = X_all_scaled if nome_modelo == 'Rede_Neural_MLP' else X
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

    # Avaliar inércia e Silhouette para k=2..6 (Método do Cotovelo)
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

    # Ordenar os IDs dos clusters pelo XP médio crescente (para alinhar semântica 0=Básico, 1=Intermediário, 2=Avançado)
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

    # Redução de dimensionalidade PCA (2 componentes) para visualização
    pca = PCA(n_components=2, random_state=SEED)
    coords_pca = pca.fit_transform(X_all_scaled)
    df['pca_1'] = np.round(coords_pca[:, 0], 4)
    df['pca_2'] = np.round(coords_pca[:, 1], 4)

    sil_score = float(silhouette_score(X_all_scaled, df['cluster_kmeans']))
    ari_score = float(adjusted_rand_score(y, df['cluster_kmeans']))
    nmi_score = float(normalized_mutual_info_score(y, df['cluster_kmeans']))
    concordancia_cluster_classe = float(accuracy_score(y, df['cluster_kmeans']))

    tabela_contingencia = pd.crosstab(
        df['cluster_nome'],
        df['classe_nome'],
        margins=True
    )

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

    # Remover coluna auxiliar temporária e salvar resultados completos
    df.drop(columns=['cluster_bruto'], inplace=True)
    resultados_csv_path = os.path.join(base_dir, 'estudemy_resultados_ml_1000.csv')
    metricas_json_path = os.path.join(base_dir, 'metricas_resultados.json')

    df.to_csv(resultados_csv_path, index=False, encoding='utf-8-sig')
    with open(metricas_json_path, 'w', encoding='utf-8') as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"[OK] Base final com predições e clusters salva em: {resultados_csv_path}")
    print(f"[OK] Relatório JSON de métricas salvo em         : {metricas_json_path}")
    print("=" * 80)


if __name__ == '__main__':
    executar_pipeline_ml()

