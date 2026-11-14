#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
EstudeMy - Gerador de Base de Dados para Machine Learning (1.000 Registros Únicos)
================================================================================
Este script utiliza a biblioteca oficial Faker (pt_BR) e distribuições estatísticas
contínuas e discretas (NumPy) para simular fielmente a estrutura do banco de dados
MongoDB (`estudemy`) das coleções:
  - users (usuários/alunos e seus personagens RPG)
  - trilhas (matérias, níveis de dificuldade, disponibilidade)
  - fases (cenários e chefes/inimigos)
  - progresso & rankings (XP, nível, acertos, erros, pontuação, HP restante, etc.)

Garantias:
  - Exatamente 1.000 registros gerados.
  - 0% de registros duplicados (tanto em identificadores quanto no vetor de features X).
  - Alta variabilidade estatística com correlações realistas do domínio educacional.
================================================================================
"""

import os
import random
import hashlib
import unicodedata
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from faker import Faker

# Sementes para reprodutibilidade científica mantendo alta variabilidade
SEED = 2026
random.seed(SEED)
np.random.seed(SEED)
fake = Faker('pt_BR')
Faker.seed(SEED)

# ==============================================================================
# 1. DOMÍNIO DO BANCO DE DADOS ESTUDEMY (Extraído do código-fonte do projeto)
# ==============================================================================
PERSONAGENS = ['Samurai', 'Mago', 'Guerreiro']
PERSONAGENS_MAP = {'Samurai': 0, 'Mago': 1, 'Guerreiro': 2}

MATERIAS = [
    'Matemática', 'Português', 'Ciências', 'História', 'Geografia',
    'Banco de Dados', 'Programação', 'Inglês', 'Física', 'Química', 'Biologia'
]
MATERIAS_MAP = {m: idx for idx, m in enumerate(MATERIAS)}

DIFICULDADES = ['Facil', 'Medio', 'Dificil']
DIFICULDADES_MAP = {'Facil': 0, 'Medio': 1, 'Dificil': 2}

CENARIOS = ['Vila', 'Montanha', 'Deserto', 'Castelo']
CENARIOS_MAP = {'Vila': 0, 'Montanha': 1, 'Deserto': 2, 'Castelo': 3}

INIMIGOS = [
    {'id': 'spectre', 'nome': 'Spectre', 'hp_max': 100, 'cod': 0},
    {'id': 'arqueira', 'nome': 'Arqueira', 'hp_max': 150, 'cod': 1},
    {'id': 'magoCorrompido', 'nome': 'Mago Corrompido', 'hp_max': 200, 'cod': 2},
    {'id': 'cavaleiroDecaido', 'nome': 'Cavaleiro Decaído', 'hp_max': 250, 'cod': 3},
]

IDIOMAS = ['Português', 'Inglês', 'Espanhol']
TEMAS = ['dark', 'light']

CLASSES_ALVO = {
    0: 'Basico_Risco_Evasao',     # Precisa de reforço / trilhas fáceis / risco de abandono
    1: 'Intermediario_Regular',   # Evolução constante / trilhas médias
    2: 'Avancado_Mestre'          # Alto domínio / trilhas difíceis / topo do ranking
}


def remover_acentos(texto: str) -> str:
    nfkd = unicodedata.normalize('NFKD', texto)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


def gerar_object_id_unico(idx: int) -> str:
    """Gera um ObjectId hexadecimal de 24 caracteres único no padrão do MongoDB."""
    timestamp_hex = f"{int(datetime.now().timestamp()) - random.randint(1000, 9999999):08x}"
    random_hex = hashlib.sha256(f"estudemy_{idx}_{fake.uuid4()}".encode()).hexdigest()[:16]
    return timestamp_hex + random_hex


def gerar_username_unico(nome: str, usados: set) -> str:
    """Gera um @username único no formato aceito pelo CompletarPerfilScreen."""
    nome_sem_acento = remover_acentos(nome.lower())
    partes = [
        ''.join(c for c in p if c in 'abcdefghijklmnopqrstuvwxyz0123456789')
        for p in nome_sem_acento.split() if len(p) > 2
    ]
    base = f"{partes[0]}_{partes[-1]}" if len(partes) >= 2 else remover_acentos(fake.user_name())
    base = base[:14]
    candidato = f"{base}_{random.randint(10, 999)}"
    while candidato in usados:
        candidato = f"{base}_{random.randint(100, 9999)}"
    usados.add(candidato)
    return candidato


def gerar_1000_registros() -> pd.DataFrame:
    """
    Gera 1.000 registros únicos representando a visão analítica consolidada do
    banco de dados EstudeMy (users + trilhas + secoes + fases + progresso + rankings).
    """
    registros = []
    usernames_usados = set()
    assinaturas_features = set()

    # Distribuição balanceada e realista entre as 3 classes (Y):
    # 330 Básico/Risco (0), 350 Intermediário/Regular (1), 320 Avançado/Mestre (2)
    distribuicao_classes = ([0] * 330) + ([1] * 350) + ([2] * 320)
    random.shuffle(distribuicao_classes)

    for i in range(1000):
        classe_y = distribuicao_classes[i]

        # 1. Dados do Usuário (Coleção `users` gerada diretamente pelo Faker.unique)
        user_id = gerar_object_id_unico(i)
        nome = fake.unique.name()
        username = gerar_username_unico(nome, usernames_usados)
        email = fake.unique.email()

        idade = fake.random_int(min=14, max=45)
        idioma = str(np.random.choice(IDIOMAS, p=[0.78, 0.14, 0.08]))
        tema = str(np.random.choice(TEMAS, p=[0.68, 0.32]))

        # Escolha de personagem com leve preferência mas variada em todas as classes
        if classe_y == 0:
            personagem = str(np.random.choice(PERSONAGENS, p=[0.45, 0.25, 0.30]))
            dificuldade = str(np.random.choice(DIFICULDADES, p=[0.65, 0.28, 0.07]))
        elif classe_y == 1:
            personagem = str(np.random.choice(PERSONAGENS, p=[0.35, 0.30, 0.35]))
            dificuldade = str(np.random.choice(DIFICULDADES, p=[0.25, 0.55, 0.20]))
        else:
            personagem = str(np.random.choice(PERSONAGENS, p=[0.30, 0.42, 0.28]))
            dificuldade = str(np.random.choice(DIFICULDADES, p=[0.10, 0.30, 0.60]))

        materia = fake.random_element(elements=MATERIAS)

        # 2. Geração de Features de Estudo, Jogo e Progresso com garantia de unicidade
        while True:
            if classe_y == 0:  # Básico / Risco de Evasão
                trilhas_iniciadas = int(np.clip(np.random.normal(2.2, 1.2), 1, 6))
                fases_concluidas = int(np.clip(np.random.gamma(shape=2.2, scale=3.2), 1, 18))
                dias_ofensiva = int(np.clip(np.random.exponential(scale=3.0), 0, 14))
                taxa_acerto_base = np.clip(np.random.normal(0.38, 0.11), 0.12, 0.58)
                tempo_medio_fase_seg = round(float(np.clip(np.random.normal(245, 55), 95, 420)), 2)
                hp_medio_restante = round(float(np.clip(np.random.normal(28.0, 14.0), 0.0, 62.0)), 2)
                inimigo_idx = int(np.random.choice([0, 1, 2, 3], p=[0.60, 0.28, 0.09, 0.03]))

            elif classe_y == 1:  # Intermediário / Regular
                trilhas_iniciadas = int(np.clip(np.random.normal(4.8, 1.6), 2, 10))
                fases_concluidas = int(np.clip(np.random.normal(24.0, 7.5), 10, 44))
                dias_ofensiva = int(np.clip(np.random.normal(16.0, 6.5), 4, 38))
                taxa_acerto_base = np.clip(np.random.normal(0.66, 0.08), 0.48, 0.82)
                tempo_medio_fase_seg = round(float(np.clip(np.random.normal(165, 38), 75, 280)), 2)
                hp_medio_restante = round(float(np.clip(np.random.normal(61.0, 12.0), 32.0, 86.0)), 2)
                inimigo_idx = int(np.random.choice([0, 1, 2, 3], p=[0.20, 0.45, 0.25, 0.10]))

            else:  # Avançado / Mestre
                trilhas_iniciadas = int(np.clip(np.random.normal(8.2, 2.2), 4, 15))
                fases_concluidas = int(np.clip(np.random.normal(48.0, 11.0), 28, 85))
                dias_ofensiva = int(np.clip(np.random.normal(42.0, 15.0), 18, 95))
                taxa_acerto_base = np.clip(np.random.normal(0.87, 0.06), 0.74, 0.995)
                tempo_medio_fase_seg = round(float(np.clip(np.random.normal(108, 28), 45, 190)), 2)
                hp_medio_restante = round(float(np.clip(np.random.normal(84.5, 8.5), 60.0, 100.0)), 2)
                inimigo_idx = int(np.random.choice([0, 1, 2, 3], p=[0.05, 0.15, 0.40, 0.40]))

            # Cada fase tem entre 5 e 10 perguntas
            perguntas_por_fase = np.random.uniform(5.2, 9.8)
            total_perguntas = max(5, int(round(fases_concluidas * perguntas_por_fase)))
            total_acertos = int(np.clip(round(total_perguntas * taxa_acerto_base), 1, total_perguntas))
            total_erros = total_perguntas - total_acertos
            media_acertos_pct = round((total_acertos / total_perguntas) * 100.0, 2)

            # Pontuação média por fase e XP Total (seguindo a lógica do EstudeMy: nivel = floor(xp/100) + 1)
            fator_dificuldade = 1.0 + (DIFICULDADES_MAP[dificuldade] * 0.25)
            pontuacao_media = round(
                float((media_acertos_pct * 8.5 + hp_medio_restante * 1.5) * fator_dificuldade + np.random.normal(0, 18)),
                2
            )
            pontuacao_media = max(50.0, pontuacao_media)

            xp_total = int(
                max(
                    15,
                    round(
                        fases_concluidas * (pontuacao_media * 0.11)
                        + (dias_ofensiva * 14)
                        + np.random.randint(-40, 85)
                    )
                )
            )
            nivel_heroi = (xp_total // 100) + 1

            inimigo_info = INIMIGOS[inimigo_idx]
            cenario = CENARIOS[inimigo_idx]

            # Assinatura de features X para garantir que NENHUMA linha de X seja repetida
            assinatura = (
                xp_total, nivel_heroi, trilhas_iniciadas, fases_concluidas,
                total_acertos, total_erros, media_acertos_pct, pontuacao_media,
                hp_medio_restante, tempo_medio_fase_seg, dias_ofensiva,
                PERSONAGENS_MAP[personagem], MATERIAS_MAP[materia], DIFICULDADES_MAP[dificuldade]
            )
            if assinatura not in assinaturas_features:
                assinaturas_features.add(assinatura)
                break

        data_ultimo_acesso = fake.date_time_between(start_date='-30d', end_date='now').strftime('%Y-%m-%d %H:%M:%S')

        registros.append({
            # Metadados do Banco de Dados (Faker / MongoDB)
            'user_id': user_id,
            'nome': nome,
            'username': username,
            'email': email,
            'tipo_usuario': 'ALUNO',
            'idioma': idioma,
            'tema': tema,
            'ultimo_acesso': data_ultimo_acesso,

            # Variáveis Categóricas Legíveis (Domínio EstudeMy)
            'personagem': personagem,
            'materia_principal': materia,
            'dificuldade_trilha': dificuldade,
            'cenario_atual': cenario,
            'inimigo_atual': inimigo_info['nome'],

            # Características Numéricas e Codificadas para IA (Matriz X)
            'idade': idade,
            'personagem_cod': PERSONAGENS_MAP[personagem],
            'materia_cod': MATERIAS_MAP[materia],
            'dificuldade_cod': DIFICULDADES_MAP[dificuldade],
            'cenario_cod': CENARIOS_MAP[cenario],
            'inimigo_hp_max': inimigo_info['hp_max'],
            'trilhas_iniciadas': trilhas_iniciadas,
            'fases_concluidas': fases_concluidas,
            'dias_ofensiva': dias_ofensiva,
            'total_perguntas_respondidas': total_perguntas,
            'total_acertos': total_acertos,
            'total_erros': total_erros,
            'media_acertos_pct': media_acertos_pct,
            'pontuacao_media': pontuacao_media,
            'hp_medio_restante': hp_medio_restante,
            'tempo_medio_fase_seg': tempo_medio_fase_seg,
            'xp_total': xp_total,
            'nivel_heroi': nivel_heroi,

            # Variável Alvo / Classe (Vetor Y)
            'classe_y': classe_y,
            'classe_nome': CLASSES_ALVO[classe_y],
        })

    df = pd.DataFrame(registros)

    # Validação rigorosa de unicidade
    assert len(df) == 1000, f"Esperado 1000 registros, gerado {len(df)}"
    assert df['user_id'].nunique() == 1000, "IDs duplicados detectados!"
    assert df['nome'].nunique() == 1000, "Nomes duplicados detectados!"
    assert df['email'].nunique() == 1000, "E-mails duplicados detectados!"
    assert df['username'].nunique() == 1000, "Usernames duplicados detectados!"
    assert df.duplicated().sum() == 0, "Linhas duplicadas detectadas!"

    return df


if __name__ == '__main__':
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 75)
    print("GERANDO BASE DE DADOS ESTUDEMY COM FAKER (1.000 REGISTROS ÚNICOS)")
    print("=" * 75)

    df_estudemy = gerar_1000_registros()

    csv_path = os.path.join(output_dir, 'estudemy_dataset_1000.csv')
    json_path = os.path.join(output_dir, 'estudemy_dataset_1000.json')

    df_estudemy.to_csv(csv_path, index=False, encoding='utf-8-sig')
    df_estudemy.to_json(json_path, orient='records', force_ascii=False, indent=2)

    print(f"[OK] CSV salvo em : {csv_path}")
    print(f"[OK] JSON salvo em: {json_path}")
    print(f"[OK] Total de registros       : {len(df_estudemy)}")
    print(f"[OK] Nomes únicos             : {df_estudemy['nome'].nunique()}")
    print(f"[OK] Usernames únicos         : {df_estudemy['username'].nunique()}")
    print(f"[OK] E-mails únicos           : {df_estudemy['email'].nunique()}")
    print(f"[OK] Linhas duplicadas        : {df_estudemy.duplicated().sum()}")
    print(f"[OK] Vetores X únicos         : {len(df_estudemy.drop_duplicates(subset=['xp_total', 'media_acertos_pct', 'pontuacao_media', 'hp_medio_restante', 'tempo_medio_fase_seg']))}")
    print("\nDistribuição das Classes (Y):")
    print(df_estudemy['classe_nome'].value_counts())
    print("\nAmostra dos 5 primeiros registros:")
    print(df_estudemy[['username', 'personagem', 'materia_principal', 'xp_total', 'nivel_heroi', 'media_acertos_pct', 'classe_nome']].head())
