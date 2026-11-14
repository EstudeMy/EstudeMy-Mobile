/**
 * narrativeScript - Enredo principal, falas e roteiros de cutscenes do universo EstudeMy
 */

import { CutsceneSequence } from '../types';

export const INTRO_CUTSCENE: CutsceneSequence = {
  id: 'intro_prologue',
  title: 'Prólogo: O Despertar dos Guardiões',
  chapterBanner: 'CAPÍTULO I: A NÉVOA DO ESQUECIMENTO',
  locationName: 'Templo Central de Sophia',
  bgMusicTrack: 'peaceful_camp',
  lines: [
    {
      id: 'p1',
      speaker: 'Voz Ancestral',
      avatar: 'system',
      side: 'left',
      text: 'Por séculos, o Reino de Sophia prosperou alimentado pela chama do conhecimento, da lógica e da ciência.',
      emotion: 'neutral',
      sfxVoice: 'system',
    },
    {
      id: 'p2',
      speaker: 'Voz Ancestral',
      avatar: 'system',
      side: 'left',
      text: 'Porém, uma anomalia conhecida como a "Névoa do Esquecimento" corrompeu os grandes arquivos e distorceu a mente dos guardiões.',
      emotion: 'injured',
      sfxVoice: 'system',
    },
    {
      id: 'p3',
      speaker: 'Hero',
      avatar: 'hero',
      side: 'left',
      text: 'Eu sinto a distorção... Conceitos inteiros estão desaparecendo das mentes dos estudantes e das trilhas!',
      emotion: 'determined',
      sfxVoice: 'male_hero',
    },
    {
      id: 'p4',
      speaker: 'Hero',
      avatar: 'hero',
      side: 'left',
      text: 'Não permitirei que o saber seja apagado. Recuperarei cada lição, responderei a cada enigma e restaurarei o reino!',
      emotion: 'triumphant',
      sfxVoice: 'male_hero',
    },
  ],
  onCompleteAction: 'start_combat',
};

export const BOSS_ENCOUNTER_CUTSCENES: Record<string, CutsceneSequence> = {
  spectre: {
    id: 'boss_spectre_intro',
    title: 'Encontro com o Fantasma do Código',
    chapterBanner: 'GUARDIÃO CORROMPIDO: SPECTRE',
    locationName: 'Pátio Abandonado do Castelo',
    bgMusicTrack: 'boss_clash',
    lines: [
      {
        id: 'sp1',
        speaker: 'Spectre',
        avatar: 'spectre',
        side: 'right',
        text: 'Você ousa penetrar nos corredores da memória corrompida? Seus algoritmos não têm poder aqui!',
        emotion: 'angry',
        sfxVoice: 'boss_whisper',
      },
      {
        id: 'sp2',
        speaker: 'Hero',
        avatar: 'hero',
        side: 'left',
        text: 'A verdade dos dados sempre prevalece sobre a falha! Prepare-se para ser depurado!',
        emotion: 'determined',
        sfxVoice: 'male_hero',
      },
    ],
    onCompleteAction: 'boss_battle',
  },

  cavaleiro_decaido: {
    id: 'boss_cavaleiro_intro',
    title: 'O Duelo da Honra Quebrada',
    chapterBanner: 'CHAMPION DECAÍDO',
    locationName: 'Salão das Armaduras Esquecidas',
    bgMusicTrack: 'boss_clash',
    lines: [
      {
        id: 'cd1',
        speaker: 'Cavaleiro Decaído',
        avatar: 'cavaleiro_decaido',
        side: 'right',
        text: 'Nenhum estudante jamais superou a barreira das minhas provas de ferro... Renda-se!',
        emotion: 'angry',
        sfxVoice: 'boss_deep',
      },
      {
        id: 'cd2',
        speaker: 'Hero',
        avatar: 'hero',
        side: 'left',
        text: 'Sua armadura é dura, mas a persistência e o estudo consistente rompem qualquer obstáculo!',
        emotion: 'triumphant',
        sfxVoice: 'male_hero',
      },
    ],
    onCompleteAction: 'boss_battle',
  },

  mago_corrompido: {
    id: 'boss_mago_intro',
    title: 'A Ilusão do Paradoxo',
    chapterBanner: 'ALQUIMISTA DO CAOS',
    locationName: 'Observatório das Estrelas Negras',
    bgMusicTrack: 'boss_clash',
    lines: [
      {
        id: 'mc1',
        speaker: 'Mago Corrompido',
        avatar: 'mago_corrompido',
        side: 'right',
        text: 'Fórmulas complexas, teoremas sem fim... A mente humana é frágil demais para compreender tudo!',
        emotion: 'triumphant',
        sfxVoice: 'boss_whisper',
      },
      {
        id: 'mc2',
        speaker: 'Hero',
        avatar: 'hero',
        side: 'left',
        text: 'Com paciência e método, qualquer complexidade se torna aprendizado cristalino!',
        emotion: 'determined',
        sfxVoice: 'male_hero',
      },
    ],
    onCompleteAction: 'boss_battle',
  },

  chefe_final: {
    id: 'boss_final_intro',
    title: 'O Julgamento do Esquecimento',
    chapterBanner: 'CONFRONTO FINAL: O ARQUIVISTA DO VAZIO',
    locationName: 'Nécleo Cósmico do Vazio',
    bgMusicTrack: 'final_showdown',
    lines: [
      {
        id: 'cf1',
        speaker: 'Arquivista do Vazio',
        avatar: 'final_boss',
        side: 'right',
        text: 'Impressionante ter chegado até o limiar da realidade... Mas aqui, o esquecimento é absoluto.',
        emotion: 'angry',
        sfxVoice: 'boss_deep',
      },
      {
        id: 'cf2',
        speaker: 'Arquivista do Vazio',
        avatar: 'final_boss',
        side: 'right',
        text: 'Minhas 3 Formas Primordiais esmagarão cada centelha de conhecimento que você acumulou!',
        emotion: 'angry',
        sfxVoice: 'boss_deep',
      },
      {
        id: 'cf3',
        speaker: 'Hero',
        avatar: 'hero',
        side: 'left',
        text: 'O conhecimento compartilhado nunca morre. Eu luto por todos os alunos do EstudeMy!',
        emotion: 'triumphant',
        sfxVoice: 'male_hero',
      },
    ],
    onCompleteAction: 'boss_battle',
  },
};
