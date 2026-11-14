#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
EstudeMy - Gerador de Gráficos SVG de Alta Resolução e Relatório A4 Imprimível
================================================================================
Gera:
  1. ml/graficos/matrizes_confusao.svg
  2. ml/graficos/importancia_features.svg
  3. ml/graficos/clusters_pca_kmeans.svg
  4. ml/graficos/arvore_decisao.svg
  5. ml/graficos/metodo_cotovelo_kmeans.svg
  6. relatorio_machine_learning_imprimir.html (na raiz e em ml/)
================================================================================
"""

import os
import json
import pandas as pd
import numpy as np


def gerar_svg_matrizes_confusao(metricas: dict) -> str:
    """Gera SVG com as 3 Matrizes de Confusão lado a lado (Árvore, Random Forest e Rede Neural)."""
    modelos = [
        ("Árvore de Decisão", "Arvore_de_Decisao", "#4f46e5"),
        ("Random Forest", "Random_Forest", "#059669"),
        ("Rede Neural (MLP)", "Rede_Neural_MLP", "#7c3aed"),
    ]
    labels_curtos = ["C0: Básico", "C1: Interm.", "C2: Avançado"]

    largura = 880
    altura = 270
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="100%" height="100%" style="font-family: \'Plus Jakarta Sans\', Arial, sans-serif; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">'
    ]

    for idx, (titulo, chave, cor_base) in enumerate(modelos):
        dados_mod = metricas["supervisionado"][chave]
        cm = dados_mod["confusion_matrix"]
        acc = dados_mod["accuracy"] * 100
        f1 = dados_mod["f1_score"] * 100
        offset_x = 22 + idx * 290

        # Título do card
        svg.append(f'<g transform="translate({offset_x}, 16)">')
        svg.append(f'<rect x="0" y="0" width="266" height="238" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>')
        svg.append(f'<rect x="0" y="0" width="266" height="36" rx="8" fill="{cor_base}"/>')
        svg.append(f'<text x="133" y="16" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800">{titulo}</text>')
        svg.append(f'<text x="133" y="29" text-anchor="middle" fill="#e0e7ff" font-size="8.5" font-weight="600">Acurácia: {acc:.2f}% | F1: {f1:.2f}%</text>')

        # Cabeçalho das colunas (Predito)
        svg.append('<text x="155" y="52" text-anchor="middle" fill="#475569" font-size="8" font-weight="700">CLASSE PREDITA (Ŷ)</text>')
        for j, lbl in enumerate(labels_curtos):
            cx = 92 + j * 54
            svg.append(f'<text x="{cx}" y="66" text-anchor="middle" fill="#334155" font-size="7.5" font-weight="700">{lbl}</text>')

        # Linhas (Real)
        for i in range(3):
            cy = 74 + i * 48
            svg.append(f'<text x="60" y="{cy + 25}" text-anchor="end" fill="#334155" font-size="7.5" font-weight="700">{labels_curtos[i]}</text>')
            soma_linha = sum(cm[i])
            for j in range(3):
                val = cm[i][j]
                pct = (val / soma_linha) * 100 if soma_linha > 0 else 0
                bx = 65 + j * 54
                if i == j:
                    bg = cor_base if val > 0 else "#f1f5f9"
                    txt_col = "#ffffff"
                    sub_col = "#e2e8f0"
                    opacidade = "0.92"
                else:
                    bg = "#fee2e2" if val > 0 else "#ffffff"
                    txt_col = "#991b1b" if val > 0 else "#94a3b8"
                    sub_col = "#b91c1c" if val > 0 else "#cbd5e1"
                    opacidade = "1.0"

                svg.append(f'<rect x="{bx}" y="{cy}" width="50" height="43" rx="5" fill="{bg}" fill-opacity="{opacidade}" stroke="#cbd5e1" stroke-width="0.8"/>')
                svg.append(f'<text x="{bx + 25}" y="{cy + 20}" text-anchor="middle" fill="{txt_col}" font-size="12" font-weight="800">{val}</text>')
                svg.append(f'<text x="{bx + 25}" y="{cy + 34}" text-anchor="middle" fill="{sub_col}" font-size="7.5" font-weight="600">({pct:.0f}%)</text>')

        svg.append('</g>')

    svg.append('</svg>')
    return "\n".join(svg)


def gerar_svg_importancia_features(metricas: dict) -> str:
    """Gera gráfico de barras horizontais das Top 10 Features mais importantes (Random Forest)."""
    importances = metricas["supervisionado"]["Random_Forest"]["feature_importances"]
    top_items = list(importances.items())[:10]

    nomes_legiveis = {
        "xp_total": "xp_total (users.xpTotal)",
        "nivel_heroi": "nivel_heroi (Nível RPG)",
        "total_acertos": "total_acertos (progresso.acertos)",
        "media_acertos_pct": "media_acertos_pct (rankings %)",
        "pontuacao_media": "pontuacao_media (progresso.pontuacao)",
        "fases_concluidas": "fases_concluidas (total de fases)",
        "dias_ofensiva": "dias_ofensiva (streak diário)",
        "hp_medio_restante": "hp_medio_restante (vida restante)",
        "tempo_medio_fase_seg": "tempo_medio_fase_seg (segundos/fase)",
        "total_perguntas_respondidas": "total_perguntas_respondidas",
        "trilhas_iniciadas": "trilhas_iniciadas (cursos ativos)",
    }

    largura = 440
    altura = 265
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="100%" height="100%" style="font-family: \'Plus Jakarta Sans\', Arial, sans-serif; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">',
        '<text x="16" y="22" fill="#0f172a" font-size="10.5" font-weight="800">Importância das Características em X (Random Forest)</text>',
        '<text x="16" y="34" fill="#64748b" font-size="8">Peso percentual de cada atributo do banco na decisão da IA</text>',
    ]

    max_val = max(v for _, v in top_items)
    cores = ["#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#059669", "#10b981", "#0284c7", "#0ea5e9", "#64748b"]

    for i, (feat, val) in enumerate(top_items):
        y = 48 + i * 21
        bar_w = max(4, (val / max_val) * 195)
        pct = val * 100
        label = nomes_legiveis.get(feat, feat)
        cor = cores[i % len(cores)]

        svg.append(f'<text x="168" y="{y + 11}" text-anchor="end" fill="#1e293b" font-size="8" font-weight="700">{label}</text>')
        svg.append(f'<rect x="174" y="{y}" width="210" height="14" rx="3" fill="#f1f5f9"/>')
        svg.append(f'<rect x="174" y="{y}" width="{bar_w:.1f}" height="14" rx="3" fill="{cor}"/>')
        svg.append(f'<text x="{179 + bar_w:.1f}" y="{y + 10.5}" fill="#0f172a" font-size="8" font-weight="800">{pct:.2f}%</text>')

    svg.append("</svg>")
    return "\n".join(svg)


def gerar_svg_cotovelo_kmeans(metricas: dict) -> str:
    """Gera gráfico do Método do Cotovelo (Inércia) e Silhouette Score para K-Means."""
    aval = metricas["nao_supervisionado"]["avaliacao_k_cotovelo"]
    ks = sorted(int(k) for k in aval.keys())
    inertias = [aval[str(k)]["inertia"] for k in ks]
    silhouettes = [aval[str(k)]["silhouette"] for k in ks]

    largura = 420
    altura = 265
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="100%" height="100%" style="font-family: \'Plus Jakarta Sans\', Arial, sans-serif; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">',
        '<text x="16" y="22" fill="#0f172a" font-size="10.5" font-weight="800">Método do Cotovelo (Inércia) &amp; Validação de Clusters (k)</text>',
        '<text x="16" y="34" fill="#64748b" font-size="8">Queda acentuada da inércia em k=3 alinhada às 3 classes pedagógicas</text>',
    ]

    plot_x, plot_y, plot_w, plot_h = 52, 52, 335, 165
    svg.append(f'<rect x="{plot_x}" y="{plot_y}" width="{plot_w}" height="{plot_h}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>')

    min_in, max_in = min(inertias) * 0.95, max(inertias) * 1.03

    # Linhas de grade horizontais
    for g in range(5):
        gy = plot_y + (g / 4) * plot_h
        val_g = max_in - (g / 4) * (max_in - min_in)
        svg.append(f'<line x1="{plot_x}" y1="{gy:.1f}" x2="{plot_x + plot_w}" y2="{gy:.1f}" stroke="#e2e8f0" stroke-dasharray="3,3"/>')
        svg.append(f'<text x="{plot_x - 6}" y="{gy + 3:.1f}" text-anchor="end" fill="#64748b" font-size="7.5">{val_g:.0f}</text>')

    pontos = []
    for idx, k in enumerate(ks):
        px = plot_x + 30 + (idx / (len(ks) - 1)) * (plot_w - 60)
        py = plot_y + plot_h - ((inertias[idx] - min_in) / (max_in - min_in)) * (plot_h - 24) - 10
        pontos.append((px, py, k, inertias[idx], silhouettes[idx]))

    caminho = " ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in pontos)
    svg.append(f'<polyline fill="none" stroke="#4f46e5" stroke-width="2.5" points="{caminho}"/>')

    for px, py, k, iner, sil in pontos:
        if k == 3:
            svg.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="9" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>')
            svg.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="#d97706"/>')
            svg.append(f'<rect x="{px - 44:.1f}" y="{py - 32:.1f}" width="88" height="20" rx="4" fill="#fffbeb" stroke="#f59e0b"/>')
            svg.append(f'<text x="{px:.1f}" y="{py - 19:.1f}" text-anchor="middle" fill="#b45309" font-size="7.5" font-weight="800">k=3 Ideal ({iner:.0f})</text>')
        else:
            svg.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="#4f46e5" stroke="#ffffff" stroke-width="1.5"/>')
            svg.append(f'<text x="{px:.1f}" y="{py - 8:.1f}" text-anchor="middle" fill="#334155" font-size="7.5" font-weight="700">{iner:.0f}</text>')

        svg.append(f'<text x="{px:.1f}" y="{plot_y + plot_h + 15}" text-anchor="middle" fill="#1e293b" font-size="8.5" font-weight="800">k = {k}</text>')
        svg.append(f'<text x="{px:.1f}" y="{plot_y + plot_h + 27}" text-anchor="middle" fill="#64748b" font-size="7">Sil: {sil:.3f}</text>')

    svg.append("</svg>")
    return "\n".join(svg)


def gerar_svg_clusters_pca(df: pd.DataFrame, metricas: dict) -> str:
    """Gera gráfico de dispersão PCA 2D comparando Clusters K-Means (Não Supervisionado) vs. Classes Reais (Y)."""
    largura = 880
    altura = 310
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="100%" height="100%" style="font-family: \'Plus Jakarta Sans\', Arial, sans-serif; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">'
    ]

    cores_mapa = {
        0: ("#ef4444", "0: Básico / Risco"),
        1: ("#f59e0b", "1: Intermediário"),
        2: ("#10b981", "2: Avançado / Mestre"),
    }

    min_x, max_x = df["pca_1"].min() - 0.5, df["pca_1"].max() + 0.5
    min_y, max_y = df["pca_2"].min() - 0.5, df["pca_2"].max() + 0.5

    paineis = [
        ("A) Não Supervisionado: Clusters K-Means (Apenas X, sem ver Y)", "cluster_kmeans", 18),
        ("B) Supervisionado: Classes Reais Y do Banco EstudeMy", "classe_y", 452),
    ]

    for titulo, col_cor, offset_x in paineis:
        pw, ph = 408, 225
        py_top = 44
        svg.append(f'<g transform="translate({offset_x}, 0)">')
        svg.append(f'<text x="0" y="20" fill="#0f172a" font-size="10" font-weight="800">{titulo}</text>')
        svg.append(f'<text x="0" y="33" fill="#64748b" font-size="7.8">Projeção PCA 2D dos 1.000 alunos únicos (64,6% da variância total explicada)</text>')
        svg.append(f'<rect x="0" y="{py_top}" width="{pw}" height="{ph}" rx="6" fill="#0f172a" stroke="#334155"/>')

        # Eixos centrais zero
        zx = ((0 - min_x) / (max_x - min_x)) * pw
        zy = py_top + ph - ((0 - min_y) / (max_y - min_y)) * ph
        svg.append(f'<line x1="{zx:.1f}" y1="{py_top}" x2="{zx:.1f}" y2="{py_top + ph}" stroke="#334155" stroke-dasharray="3,3"/>')
        svg.append(f'<line x1="0" y1="{zy:.1f}" x2="{pw}" y2="{zy:.1f}" stroke="#334155" stroke-dasharray="3,3"/>')

        # Plotar os 1.000 registros únicos
        for _, row in df.iterrows():
            cx = ((row["pca_1"] - min_x) / (max_x - min_x)) * (pw - 24) + 12
            cy = py_top + ph - (((row["pca_2"] - min_y) / (max_y - min_y)) * (ph - 24) + 12)
            cor = cores_mapa[int(row[col_cor])][0]
            svg.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="2.3" fill="{cor}" fill-opacity="0.78"/>')

        # Centroides de cada grupo
        for g_id in [0, 1, 2]:
            sub = df[df[col_cor] == g_id]
            mx = ((sub["pca_1"].mean() - min_x) / (max_x - min_x)) * (pw - 24) + 12
            my = py_top + ph - (((sub["pca_2"].mean() - min_y) / (max_y - min_y)) * (ph - 24) + 12)
            cor = cores_mapa[g_id][0]
            svg.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="8" fill="#ffffff" stroke="{cor}" stroke-width="2.5"/>')
            svg.append(f'<text x="{mx:.1f}" y="{my + 3:.1f}" text-anchor="middle" fill="#0f172a" font-size="8" font-weight="900">C{g_id}</text>')

        # Legenda inferior
        for g_id, (cor, nome_leg) in cores_mapa.items():
            lx = 10 + g_id * 136
            svg.append(f'<circle cx="{lx}" cy="{py_top + ph + 18}" r="4.5" fill="{cor}"/>')
            svg.append(f'<text x="{lx + 9}" y="{py_top + ph + 21}" fill="#1e293b" font-size="8" font-weight="700">{nome_leg}</text>')

        svg.append("</g>")

    svg.append("</svg>")
    return "\n".join(svg)


def gerar_svg_arvore_decisao() -> str:
    """Gera fluxograma vetorial das regras principais aprendidas pela Árvore de Decisão."""
    largura = 880
    altura = 225
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="100%" height="100%" style="font-family: \'Plus Jakarta Sans\', Arial, sans-serif; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">',
        '<text x="18" y="20" fill="#0f172a" font-size="10.5" font-weight="800">Estrutura Visual das Regras da Árvore de Decisão (DecisionTreeClassifier)</text>',
        '<text x="18" y="33" fill="#64748b" font-size="8">Divisões de maior ganho de informação (Critério Gini) aprendidas sobre os 800 registros de treino</text>',
        # Arestas Nível 0 -> Nível 1
        '<line x1="440" y1="68" x2="210" y2="112" stroke="#64748b" stroke-width="1.8"/>',
        '<line x1="440" y1="68" x2="640" y2="112" stroke="#64748b" stroke-width="1.8"/>',
        '<text x="310" y="86" fill="#059669" font-size="8" font-weight="800">Verdadeiro (≤ 937.5)</text>',
        '<text x="560" y="86" fill="#dc2626" font-size="8" font-weight="800">Falso (&gt; 937.5)</text>',
        # Arestas Nível 1 -> Nível 2
        '<line x1="210" y1="138" x2="115" y2="178" stroke="#64748b" stroke-width="1.5"/>',
        '<line x1="210" y1="138" x2="305" y2="178" stroke="#64748b" stroke-width="1.5"/>',
        '<line x1="640" y1="138" x2="515" y2="178" stroke="#64748b" stroke-width="1.5"/>',
        '<line x1="640" y1="138" x2="765" y2="178" stroke="#64748b" stroke-width="1.5"/>',
        # Nó Raiz
        '<rect x="335" y="38" width="210" height="36" rx="6" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>',
        '<text x="440" y="53" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="800">xp_total ≤ 937.5 XP</text>',
        '<text x="440" y="66" text-anchor="middle" fill="#c7d2fe" font-size="7.5">gini = 0.666 | amostras = 800 | [264, 280, 256]</text>',
        # Nó Nível 1 Esquerda
        '<rect x="115" y="104" width="190" height="36" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>',
        '<text x="210" y="119" text-anchor="middle" fill="#991b1b" font-size="8.5" font-weight="800">fases_concluidas ≤ 12.5</text>',
        '<text x="210" y="132" text-anchor="middle" fill="#b91c1c" font-size="7.5">gini = 0.043 | amostras = 268</text>',
        # Nó Nível 1 Direita
        '<rect x="540" y="104" width="200" height="36" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>',
        '<text x="640" y="119" text-anchor="middle" fill="#1e40af" font-size="8.5" font-weight="800">xp_total ≤ 4.215,0 XP</text>',
        '<text x="640" y="132" text-anchor="middle" fill="#1d4ed8" font-size="7.5">gini = 0.499 | amostras = 532</text>',
        # Folhas Nível 2
        '<rect x="35" y="172" width="160" height="40" rx="6" fill="#dc2626"/>',
        '<text x="115" y="189" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="800">Classe 0: Básico / Risco</text>',
        '<text x="115" y="203" text-anchor="middle" fill="#fee2e2" font-size="7.5">Recomendação: Trilha Fácil</text>',
        '<rect x="225" y="172" width="160" height="40" rx="6" fill="#f59e0b"/>',
        '<text x="305" y="189" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="800">media_acertos_pct ≤ 54%</text>',
        '<text x="305" y="203" text-anchor="middle" fill="#fef3c7" font-size="7.5">Transição C0 / C1</text>',
        '<rect x="430" y="172" width="170" height="40" rx="6" fill="#d97706"/>',
        '<text x="515" y="189" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="800">Classe 1: Intermediário</text>',
        '<text x="515" y="203" text-anchor="middle" fill="#fef3c7" font-size="7.5">media_acertos ≤ 79% (Trilha Média)</text>',
        '<rect x="680" y="172" width="170" height="40" rx="6" fill="#059669"/>',
        '<text x="765" y="189" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="800">Classe 2: Avançado / Mestre</text>',
        '<text x="765" y="203" text-anchor="middle" fill="#d1fae5" font-size="7.5">hp_medio &gt; 65 (Trilha Difícil)</text>',
        '</svg>',
    ]
    return "\n".join(svg)


def gerar_relatorio_html(
    df: pd.DataFrame,
    metricas: dict,
    svg_cm: str,
    svg_feat: str,
    svg_cotovelo: str,
    svg_pca: str,
    svg_arvore: str,
) -> str:
    """Gera o relatório HTML A4 de 4 páginas pronto para impressão/PDF."""
    amostra_linhas = []
    for idx, row in df.head(12).iterrows():
        badge_cls = (
            "badge-low" if row["classe_y"] == 0 else ("badge-med" if row["classe_y"] == 1 else "badge-high")
        )
        amostra_linhas.append(
            f"""
            <tr>
              <td class="mono">{row['user_id'][:10]}...</td>
              <td><strong>{row['nome']}</strong></td>
              <td class="mono">@{row['username']}</td>
              <td>{row['personagem']}</td>
              <td>{row['materia_principal']}</td>
              <td class="center">{row['dificuldade_trilha']}</td>
              <td class="center">{row['fases_concluidas']}</td>
              <td class="center">{row['dias_ofensiva']}d</td>
              <td class="center"><strong>{row['media_acertos_pct']:.1f}%</strong></td>
              <td class="center">{row['hp_medio_restante']:.1f}</td>
              <td class="center mono"><strong>{row['xp_total']}</strong> (Nv.{row['nivel_heroi']})</td>
              <td class="center"><span class="pill {badge_cls}">{row['classe_nome']}</span></td>
              <td class="center mono">Cluster {row['cluster_kmeans']}</td>
            </tr>
            """
        )
    amostra_html = "\n".join(amostra_linhas)

    cont = metricas["nao_supervisionado"]["contingencia_cluster_vs_classe"]
    c0_b = cont["Basico_Risco_Evasao"]["0"]
    c0_i = cont["Intermediario_Regular"]["0"]
    c0_a = cont["Avancado_Mestre"]["0"]
    c1_b = cont["Basico_Risco_Evasao"]["1"]
    c1_i = cont["Intermediario_Regular"]["1"]
    c1_a = cont["Avancado_Mestre"]["1"]
    c2_b = cont["Basico_Risco_Evasao"]["2"]
    c2_i = cont["Intermediario_Regular"]["2"]
    c2_a = cont["Avancado_Mestre"]["2"]

    perf = metricas["nao_supervisionado"]["perfil_medio_clusters"]

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Machine Learning - EstudeMy (1.000 Registros Faker)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    :root {{
      --primary: #4338ca;
      --primary-dark: #1e1b4b;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-500: #64748b;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--slate-800);
      line-height: 1.35;
      font-size: 8.5pt;
      -webkit-font-smoothing: antialiased;
    }}

    .screen-toolbar {{
      position: sticky;
      top: 14px;
      z-index: 9999;
      max-width: 210mm;
      margin: 0 auto 18px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
    }}

    .toolbar-info h2 {{ font-size: 11pt; font-weight: 800; color: #f8fafc; }}
    .toolbar-info p {{ font-size: 8pt; color: #94a3b8; }}

    .btn-print {{
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: white;
      border: none;
      padding: 10px 18px;
      font-size: 9pt;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    @media screen {{
      body {{ background-color: #0b0f19; padding: 18px 10px 50px 10px; }}
      .print-page {{
        background: #ffffff;
        width: 210mm;
        height: 297mm;
        max-height: 297mm;
        padding: 12mm 13mm;
        margin: 0 auto 26px auto;
        border-radius: 6px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }}
    }}

    @media print {{
      @page {{ size: A4 portrait; margin: 10mm 11mm; }}
      body {{ background: transparent; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .screen-toolbar {{ display: none !important; }}
      .print-page {{
        width: 100%;
        height: 276mm;
        max-height: 276mm;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-after: always;
        break-after: page;
        overflow: hidden;
      }}
      .print-page:last-child {{ page-break-after: auto; break-after: auto; }}
    }}

    .page-content {{ flex: 1; display: flex; flex-direction: column; gap: 8px; }}

    .header-banner {{
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%);
      color: white;
      padding: 14px 18px;
      border-radius: 8px;
    }}
    .header-top {{
      display: flex;
      justify-content: space-between;
      font-size: 7.2pt;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      color: #c7d2fe;
    }}
    .header-banner h1 {{ font-size: 15pt; font-weight: 800; margin-bottom: 3px; }}
    .header-banner p {{ font-size: 8.2pt; color: #e0e7ff; }}

    .section-title {{
      font-size: 10.2pt;
      font-weight: 800;
      color: var(--slate-900);
      border-left: 4px solid var(--primary);
      padding-left: 8px;
      margin-top: 2px;
    }}

    .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }}
    .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }}

    .card {{
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      padding: 8px 10px;
    }}
    .card h3 {{ font-size: 8.5pt; font-weight: 800; color: var(--slate-900); margin-bottom: 4px; }}
    .card p, .card li {{ font-size: 7.5pt; color: var(--slate-700); line-height: 1.35; }}
    .card ul {{ padding-left: 14px; }}

    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 7.1pt;
      background: white;
      border: 1px solid var(--slate-200);
    }}
    th {{
      background: #1e293b;
      color: white;
      text-align: left;
      padding: 4.5px 5px;
      font-weight: 700;
      font-size: 6.8pt;
      text-transform: uppercase;
    }}
    td {{
      padding: 4px 5px;
      border-bottom: 1px solid var(--slate-200);
      color: var(--slate-800);
    }}
    tr:nth-child(even) td {{ background: #f8fafc; }}
    .center {{ text-align: center; }}
    .mono {{ font-family: 'JetBrains Mono', monospace; font-size: 6.8pt; }}

    .pill {{
      font-size: 6.5pt;
      font-weight: 800;
      padding: 1.5px 6px;
      border-radius: 99px;
      display: inline-block;
    }}
    .badge-low {{ background: #fee2e2; color: #991b1b; }}
    .badge-med {{ background: #fef3c7; color: #92400e; }}
    .badge-high {{ background: #dcfce7; color: #166534; }}

    .kpi-row {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }}
    .kpi-box {{
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }}
    .kpi-val {{ font-size: 12pt; font-weight: 800; color: #1e40af; font-family: 'JetBrains Mono', monospace; }}
    .kpi-lbl {{ font-size: 6.8pt; color: #475569; font-weight: 700; }}

    .footer {{
      border-top: 1px solid var(--slate-200);
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 6.8pt;
      color: var(--slate-500);
    }}
  </style>
</head>
<body>

  <div class="screen-toolbar">
    <div class="toolbar-info">
      <h2>Relatório de Machine Learning • Projeto EstudeMy (1.000 Registros Faker)</h2>
      <p>4 Páginas A4 calibradas com gráficos vetoriais de Árvore de Decisão, Random Forest, Rede Neural e K-Means</p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>
  </div>

  <!-- =========================================================================
       PÁGINA 1: ESTRUTURA DO BD, DEFINIÇÃO DE X E Y, CARACTERÍSTICAS E FAKER
       ========================================================================= -->
  <div class="print-page">
    <div class="page-content">
      <div class="header-banner">
        <div class="header-top">
          <span>FATEC Votorantim • Desenvolvimento de Software Multiplataforma (DSM)</span>
          <span>Disciplina: Machine Learning / IA</span>
        </div>
        <h1>Aplicação de Machine Learning na Plataforma EstudeMy</h1>
        <p>Modelagem da Estrutura do Banco de Dados MongoDB, Geração de 1.000 Registros Únicos via Faker (pt_BR), Classificação Supervisionada (Árvore de Decisão, Random Forest e Rede Neural) e Clusterização Não Supervisionada (K-Means).</p>
      </div>

      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-val">1.000</div><div class="kpi-lbl">Registros Únicos (0 Repetidos)</div></div>
        <div class="kpi-box"><div class="kpi-val">18 Features</div><div class="kpi-lbl">Dimensão da Matriz X</div></div>
        <div class="kpi-box"><div class="kpi-val">99,00%</div><div class="kpi-lbl">Acurácia Rede Neural (MLP)</div></div>
        <div class="kpi-box"><div class="kpi-val">98,30%</div><div class="kpi-lbl">Pureza K-Means (Cluster x Classe)</div></div>
      </div>

      <div class="section-title">1. Qual é a Estrutura do Banco de Dados do Projeto EstudeMy?</div>
      <div class="grid-2">
        <div class="card">
          <h3>🍃 Banco NoSQL MongoDB 7.0 (Base: estudemy)</h3>
          <p>O sistema armazena dados gamificados de estudo em <strong>5 coleções principais</strong>:</p>
          <ul>
            <li><strong>users:</strong> <code>_id</code>, <code>nome</code>, <code>username</code>, <code>email</code>, <code>personagem</code> (Samurai, Mago, Guerreiro), <code>xpTotal</code>, <code>idioma</code>, <code>tema</code>.</li>
            <li><strong>trilhas:</strong> <code>_id</code>, <code>titulo</code>, <code>materia</code> (11 disciplinas), <code>dificuldade</code> (Fácil, Médio, Difícil), <code>visualizacoes</code>.</li>
            <li><strong>secoes &amp; fases:</strong> <code>cenario</code> (Vila, Montanha, Deserto, Castelo), <code>personagem_selecionado</code> (Spectre 100HP, Arqueira 150HP, Mago Corrompido 200HP, Cavaleiro Decaído 250HP) e <code>perguntas</code>.</li>
            <li><strong>progresso &amp; rankings:</strong> <code>userId</code>, <code>trilhaId</code>, <code>faseId</code>, <code>pontuacao</code>, <code>acertos</code>, <code>erros</code>, <code>totalPerguntas</code>, <code>mediaAcertos</code>.</li>
          </ul>
        </div>
        <div class="card">
          <h3>🎯 2. No Projeto, o que é o X e o que é o Y?</h3>
          <ul>
            <li><strong>Matriz X (Variáveis Independentes / Entrada):</strong> Vetor de <strong>18 características</strong> consolidando perfil do jogador, engajamento nas trilhas e telemetria das batalhas/quizzes.</li>
            <li><strong>Vetor Y (Variável Alvo / Saída Supervisionada - <code>classe_y</code>):</strong> Classifica o nível de domínio pedagógico e risco do estudante em 3 classes:
              <br/>• <span class="pill badge-low">0: Basico_Risco_Evasao</span> (330 alunos — precisa de reforço / Trilha Fácil)
              <br/>• <span class="pill badge-med">1: Intermediario_Regular</span> (350 alunos — evolução constante / Trilha Média)
              <br/>• <span class="pill badge-high">2: Avancado_Mestre</span> (320 alunos — alta performance / Trilha Difícil)
            </li>
          </ul>
        </div>
      </div>

      <div class="section-title">3. Quais são as 18 Características (Features de X) informadas para a IA e geradas com Faker?</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Característica (X)</th>
            <th>Coleção MongoDB</th>
            <th>Tipo / Codificação</th>
            <th>Descrição no Domínio EstudeMy e Regra de Geração (Faker + NumPy)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="center">1</td><td class="mono">idade</td><td>users</td><td>Inteiro (14 a 45)</td><td>Idade gerada com <code>fake.random_int(min=14, max=45)</code></td></tr>
          <tr><td class="center">2</td><td class="mono">personagem_cod</td><td>users.personagem</td><td>Categórico (0, 1, 2)</td><td>Classe RPG escolhida: <code>0</code> = Samurai, <code>1</code> = Mago, <code>2</code> = Guerreiro</td></tr>
          <tr><td class="center">3</td><td class="mono">materia_cod</td><td>trilhas.materia</td><td>Categórico (0 a 10)</td><td>11 matérias reais do app (Matemática, Português, BD, Programação, Física, etc.)</td></tr>
          <tr><td class="center">4</td><td class="mono">dificuldade_cod</td><td>trilhas.dificuldade</td><td>Ordinal (0, 1, 2)</td><td>Dificuldade predominante: <code>0</code> = Fácil, <code>1</code> = Médio, <code>2</code> = Difícil</td></tr>
          <tr><td class="center">5</td><td class="mono">cenario_cod</td><td>fases.cenario</td><td>Ordinal (0, 1, 2, 3)</td><td>Mapa atual: <code>0</code> = Vila, <code>1</code> = Montanha, <code>2</code> = Deserto, <code>3</code> = Castelo</td></tr>
          <tr><td class="center">6</td><td class="mono">inimigo_hp_max</td><td>fases (Chefe)</td><td>Inteiro (100 a 250)</td><td>HP máximo do chefe enfrentado (Spectre=100, Arqueira=150, Mago=200, Cavaleiro=250)</td></tr>
          <tr><td class="center">7</td><td class="mono">trilhas_iniciadas</td><td>progresso</td><td>Inteiro (1 a 15)</td><td>Quantidade de trilhas iniciadas pelo estudante na plataforma</td></tr>
          <tr><td class="center">8</td><td class="mono">fases_concluidas</td><td>progresso</td><td>Inteiro (1 a 85)</td><td>Total de fases de quiz/batalha vencidas pelo aluno</td></tr>
          <tr><td class="center">9</td><td class="mono">dias_ofensiva</td><td>users (streak)</td><td>Inteiro (0 a 95)</td><td>Dias consecutivos de estudo ativo na plataforma</td></tr>
          <tr><td class="center">10</td><td class="mono">total_perguntas_respondidas</td><td>progresso</td><td>Inteiro (5 a 750+)</td><td>Total acumulado de questões de múltipla escolha respondidas</td></tr>
          <tr><td class="center">11</td><td class="mono">total_acertos</td><td>progresso.acertos</td><td>Inteiro</td><td>Quantidade de respostas corretas (causam dano ao inimigo na fase)</td></tr>
          <tr><td class="center">12</td><td class="mono">total_erros</td><td>progresso.erros</td><td>Inteiro</td><td>Quantidade de respostas incorretas (reduzem o HP do jogador)</td></tr>
          <tr><td class="center">13</td><td class="mono">media_acertos_pct</td><td>rankings.mediaAcertos</td><td>Contínuo (0 a 100%)</td><td>Taxa percentual de acerto acumulada nos quizzes</td></tr>
          <tr><td class="center">14</td><td class="mono">pontuacao_media</td><td>progresso.pontuacao</td><td>Contínuo (50 a 1350)</td><td>Pontuação média por fase ponderada por acertos, HP e dificuldade</td></tr>
          <tr><td class="center">15</td><td class="mono">hp_medio_restante</td><td>game.playerHP</td><td>Contínuo (0 a 100)</td><td>Vida média do herói ao concluir as batalhas</td></tr>
          <tr><td class="center">16</td><td class="mono">tempo_medio_fase_seg</td><td>Telemetria</td><td>Contínuo (45 a 420s)</td><td>Tempo médio gasto em segundos para concluir cada fase</td></tr>
          <tr><td class="center">17</td><td class="mono">xp_total</td><td>users.xpTotal</td><td>Inteiro (15 a 12000+)</td><td>Experiência total acumulada no Hall da Fama</td></tr>
          <tr><td class="center">18</td><td class="mono">nivel_heroi</td><td>users (Calculado)</td><td>Inteiro (1 a 120+)</td><td>Nível do personagem segundo a fórmula do app: <code>floor(xpTotal / 100) + 1</code></td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>EstudeMy • Projeto Integrador V (Machine Learning)</span>
      <span>Base gerada com Python Faker ('pt_BR') • 1.000 Registros Únicos</span>
      <span>Página 1 de 3</span>
    </div>
  </div>

  <!-- =========================================================================
       PÁGINA 2: APRENDIZADO SUPERVISIONADO (ÁRVORE, RANDOM FOREST E REDE NEURAL)
       ========================================================================= -->
  <div class="print-page">
    <div class="page-content">
      <div class="section-title">4. Aprendizado Supervisionado (X e Y): Árvore de Decisão, Random Forest e Rede Neural</div>
      <p style="font-size: 7.8pt; color: #475569;">Os 1.000 registros foram divididos em <strong>800 de treino (80%)</strong> e <strong>200 de teste (20%)</strong> de forma estratificada (<code>stratify=Y</code>), com padronização <code>StandardScaler</code> para a Rede Neural MLP (camadas ocultas <code>64x32</code>, ativação <code>ReLU</code>, otimizador <code>Adam</code>).</p>

      <table>
        <thead>
          <tr>
            <th>Algoritmo Supervisionado</th>
            <th>Configuração / Hiperparâmetros</th>
            <th class="center">Acurácia (Teste)</th>
            <th class="center">Validação Cruzada (5-Fold)</th>
            <th class="center">Precision</th>
            <th class="center">Recall</th>
            <th class="center">F1-Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Árvore de Decisão</strong> (<code>DecisionTreeClassifier</code>)</td>
            <td class="mono">criterion='gini', max_depth=5, min_samples_leaf=8</td>
            <td class="center"><strong>97,50%</strong></td>
            <td class="center">97,50% (±1,14%)</td>
            <td class="center">97,51%</td>
            <td class="center">97,50%</td>
            <td class="center">97,49%</td>
          </tr>
          <tr>
            <td><strong>2. Random Forest</strong> (<code>RandomForestClassifier</code>)</td>
            <td class="mono">n_estimators=150, max_depth=8, min_samples_leaf=4</td>
            <td class="center"><strong>98,50%</strong></td>
            <td class="center">98,70% (±0,81%)</td>
            <td class="center">98,51%</td>
            <td class="center">98,50%</td>
            <td class="center">98,50%</td>
          </tr>
          <tr>
            <td><strong>3. Rede Neural Artificial</strong> (<code>MLPClassifier</code>)</td>
            <td class="mono">hidden_layer_sizes=(64, 32), activation='relu', adam</td>
            <td class="center"><strong>99,00%</strong></td>
            <td class="center"><strong>99,80% (±0,24%)</strong></td>
            <td class="center"><strong>99,03%</strong></td>
            <td class="center"><strong>99,00%</strong></td>
            <td class="center"><strong>99,00%</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="width: 100%; height: 215px;">
        {svg_cm}
      </div>

      <div style="width: 100%; height: 190px;">
        {svg_arvore}
      </div>

      <div class="grid-2" style="height: 220px;">
        <div>{svg_feat}</div>
        <div>{svg_cotovelo}</div>
      </div>
    </div>

    <div class="footer">
      <span>EstudeMy • Projeto Integrador V (Machine Learning)</span>
      <span>Aprendizado Supervisionado: Árvore de Decisão, Random Forest e Rede Neural MLP</span>
      <span>Página 2 de 3</span>
    </div>
  </div>

  <!-- =========================================================================
       PÁGINA 3: APRENDIZADO NÃO SUPERVISIONADO (K-MEANS: X -> CLUSTER E CLASSE) + AMOSTRA FAKER
       ========================================================================= -->
  <div class="print-page">
    <div class="page-content">
      <div class="section-title">5. Aprendizado Não Supervisionado (Apenas X → Cluster K-Means vs. Classe Y)</div>
      <p style="font-size: 7.8pt; color: #475569;">No modelo não supervisionado, fornecemos <strong>exclusivamente a matriz X padronizada</strong> (sem os rótulos <code>classe_y</code>) ao algoritmo <strong>K-Means (<code>n_clusters=3</code>)</strong>. Em seguida, cruzamos os Clusters descobertos com as Classes reais para validar a estrutura natural dos dados:</p>

      <div style="width: 100%; height: 245px;">
        {svg_pca}
      </div>

      <div class="grid-2">
        <div>
          <table>
            <thead>
              <tr>
                <th>Cluster K-Means (Sem ver Y)</th>
                <th class="center">C0: Básico</th>
                <th class="center">C1: Interm.</th>
                <th class="center">C2: Avançado</th>
                <th class="center">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cluster 0 (Iniciante)</strong></td>
                <td class="center" style="background:#dcfce7;font-weight:800;">{c0_b}</td>
                <td class="center">{c0_i}</td>
                <td class="center">{c0_a}</td>
                <td class="center"><strong>{c0_b + c0_i + c0_a}</strong></td>
              </tr>
              <tr>
                <td><strong>Cluster 1 (Consistente)</strong></td>
                <td class="center">{c1_b}</td>
                <td class="center" style="background:#dcfce7;font-weight:800;">{c1_i}</td>
                <td class="center">{c1_a}</td>
                <td class="center"><strong>{c1_b + c1_i + c1_a}</strong></td>
              </tr>
              <tr>
                <td><strong>Cluster 2 (Veterano)</strong></td>
                <td class="center">{c2_b}</td>
                <td class="center">{c2_i}</td>
                <td class="center" style="background:#dcfce7;font-weight:800;">{c2_a}</td>
                <td class="center"><strong>{c2_b + c2_i + c2_a}</strong></td>
              </tr>
              <tr>
                <td><strong>Total por Classe (Y)</strong></td>
                <td class="center"><strong>330</strong></td>
                <td class="center"><strong>350</strong></td>
                <td class="center"><strong>320</strong></td>
                <td class="center"><strong>1.000</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <table>
            <thead>
              <tr>
                <th>Centroides Médios por Cluster</th>
                <th class="center">XP Médio</th>
                <th class="center">Nível</th>
                <th class="center">Fases</th>
                <th class="center">Acertos %</th>
                <th class="center">HP Rest.</th>
                <th class="center">Ofensiva</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cluster 0 (Iniciante)</strong></td>
                <td class="center mono">{perf['0']['xp_total']}</td>
                <td class="center">{perf['0']['nivel_heroi']}</td>
                <td class="center">{perf['0']['fases_concluidas']}</td>
                <td class="center">{perf['0']['media_acertos_pct']}%</td>
                <td class="center">{perf['0']['hp_medio_restante']}</td>
                <td class="center">{perf['0']['dias_ofensiva']}d</td>
              </tr>
              <tr>
                <td><strong>Cluster 1 (Interm.)</strong></td>
                <td class="center mono">{perf['1']['xp_total']}</td>
                <td class="center">{perf['1']['nivel_heroi']}</td>
                <td class="center">{perf['1']['fases_concluidas']}</td>
                <td class="center">{perf['1']['media_acertos_pct']}%</td>
                <td class="center">{perf['1']['hp_medio_restante']}</td>
                <td class="center">{perf['1']['dias_ofensiva']}d</td>
              </tr>
              <tr>
                <td><strong>Cluster 2 (Veterano)</strong></td>
                <td class="center mono">{perf['2']['xp_total']}</td>
                <td class="center">{perf['2']['nivel_heroi']}</td>
                <td class="center">{perf['2']['fases_concluidas']}</td>
                <td class="center">{perf['2']['media_acertos_pct']}%</td>
                <td class="center">{perf['2']['hp_medio_restante']}</td>
                <td class="center">{perf['2']['dias_ofensiva']}d</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 4px; font-size: 7.2pt; color: #334155; background: #f0fdf4; border: 1px solid #86efac; padding: 4px 8px; border-radius: 4px;">
            <strong>Métricas Não Supervisionadas:</strong> Correspondência Cluster × Classe = <strong>98,30%</strong> (983/1000) | <strong>ARI</strong> = <code>0.9491</code> | <strong>NMI</strong> = <code>0.9185</code> | <strong>Silhouette</strong> = <code>0.2665</code>
          </div>
        </div>
      </div>

      <div class="section-title">6. Amostra dos 1.000 Registros Únicos Gerados pelo Faker (`estudemy_resultados_ml_1000.csv`)</div>
      <table>
        <thead>
          <tr>
            <th>ObjectId (_id)</th>
            <th>Nome (Faker pt_BR)</th>
            <th>@username</th>
            <th>Herói</th>
            <th>Matéria</th>
            <th class="center">Dif.</th>
            <th class="center">Fases</th>
            <th class="center">Streak</th>
            <th class="center">Acerto %</th>
            <th class="center">HP</th>
            <th class="center">XP (Nível)</th>
            <th class="center">Classe Real (Y)</th>
            <th class="center">K-Means</th>
          </tr>
        </thead>
        <tbody>
          {amostra_html}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>EstudeMy • Projeto Integrador V (Machine Learning)</span>
      <span>Arquivos: ml/gerar_dados_faker.py • ml/treinar_modelos_ml.py • ml/estudemy_dataset_1000.csv</span>
      <span>Página 3 de 3</span>
    </div>
  </div>

</body>
</html>
"""


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(base_dir)
    graficos_dir = os.path.join(base_dir, "graficos")
    os.makedirs(graficos_dir, exist_ok=True)

    df = pd.read_csv(os.path.join(base_dir, "estudemy_resultados_ml_1000.csv"))
    with open(os.path.join(base_dir, "metricas_resultados.json"), "r", encoding="utf-8") as f:
        metricas = json.load(f)

    svg_cm = gerar_svg_matrizes_confusao(metricas)
    svg_feat = gerar_svg_importancia_features(metricas)
    svg_cotovelo = gerar_svg_cotovelo_kmeans(metricas)
    svg_pca = gerar_svg_clusters_pca(df, metricas)
    svg_arvore = gerar_svg_arvore_decisao()

    arquivos_svg = {
        "matrizes_confusao.svg": svg_cm,
        "importancia_features.svg": svg_feat,
        "metodo_cotovelo_kmeans.svg": svg_cotovelo,
        "clusters_pca_kmeans.svg": svg_pca,
        "arvore_decisao.svg": svg_arvore,
    }

    for nome_arq, conteudo in arquivos_svg.items():
        caminho = os.path.join(graficos_dir, nome_arq)
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(conteudo)
        print(f"[OK] Gráfico SVG salvo em: {caminho}")

    html_content = gerar_relatorio_html(
        df, metricas, svg_cm, svg_feat, svg_cotovelo, svg_pca, svg_arvore
    )

    html_root = os.path.join(root_dir, "relatorio_machine_learning_imprimir.html")
    html_ml = os.path.join(base_dir, "relatorio_machine_learning_imprimir.html")

    with open(html_root, "w", encoding="utf-8") as f:
        f.write(html_content)
    with open(html_ml, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[OK] Relatório HTML A4 salvo em: {html_root}")
    print(f"[OK] Cópia do Relatório HTML em: {html_ml}")


if __name__ == "__main__":
    main()

