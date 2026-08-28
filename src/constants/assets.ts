import { ImageSourcePropType } from 'react-native';

export const CHARACTER_IMAGES: Record<string, ImageSourcePropType> = {
  Samurai: require('../../assets/img/samurai.png'),
  Guerreiro: require('../../assets/img/guerreiro.png'),
  Mago: require('../../assets/img/mago.png'),
  default: require('../../assets/img/personagem.png'),
};

export const SUBJECT_IMAGES: Record<string, ImageSourcePropType> = {
  matematica: require('../../assets/img/mate.png'),
  matemática: require('../../assets/img/mate.png'),
  portugues: require('../../assets/img/port.png'),
  português: require('../../assets/img/port.png'),
  historia: require('../../assets/img/hist.png'),
  história: require('../../assets/img/hist.png'),
  geografia: require('../../assets/img/geo.png'),
  ciencias: require('../../assets/img/cienc.png'),
  ciências: require('../../assets/img/cienc.png'),
  'banco de dados': require('../../assets/img/bd.png'),
  programacao: require('../../assets/img/bd.png'),
  programação: require('../../assets/img/bd.png'),
  computacao: require('../../assets/img/bd.png'),
  computação: require('../../assets/img/bd.png'),
  default: require('../../assets/img/semImg.png'),
};

export const BACKGROUND_IMAGES = {
  loginDark: require('../../assets/img/backgrounds/background_login_darkmode.jpg'),
  loginLight: require('../../assets/img/backgrounds/background_login_lightmode.png'),
  landingDark: require('../../assets/img/backgrounds/backgroun_lp_darkmode.jpg'),
  landingLight: require('../../assets/img/backgrounds/background_lp_ligthmode.png'),
  pagesDark: require('../../assets/img/backgrounds/background_pages_darkmode.jpg'),
  pagesLight: require('../../assets/img/backgrounds/background_pages_lightmode.png'),
};

export const FASE_BACKGROUNDS: Record<string, ImageSourcePropType> = {
  castelo: require('../../assets/img/fases/castelo.jpg'),
  deserto: require('../../assets/img/fases/deserto.jpg'),
  montanha: require('../../assets/img/fases/montanha.jpg'),
  vila: require('../../assets/img/fases/vila.jpg'),
};

export const EXTRA_IMAGES = {
  trofeu: require('../../assets/img/trofeu.png'),
  coin: require('../../assets/img/coin-pixel.png'),
  consultai: require('../../assets/img/ConsultAi.png'),
  cavaleiroInimigo: require('../../assets/img/cavaleiro_inimigo.png'),
  semImg: require('../../assets/img/semImg.png'),
};

export function getSubjectImage(materia?: string | null): ImageSourcePropType {
  if (!materia) return SUBJECT_IMAGES.default;
  const key = materia.toLowerCase().trim();
  return SUBJECT_IMAGES[key] || SUBJECT_IMAGES.default;
}

export function getCharacterImage(charName?: string | null): ImageSourcePropType {
  if (!charName) return CHARACTER_IMAGES.default;
  return CHARACTER_IMAGES[charName] || CHARACTER_IMAGES.default;
}

export function getTrackImage(trilha?: { imagem?: string; image?: string; materia?: string } | null): ImageSourcePropType {
  if (!trilha) return FASE_BACKGROUNDS.montanha;
  
  const imgPath = trilha.imagem || trilha.image;
  if (imgPath) {
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return { uri: imgPath };
    }
    const lower = imgPath.toLowerCase();
    if (lower.includes('montanha')) return FASE_BACKGROUNDS.montanha;
    if (lower.includes('castelo')) return FASE_BACKGROUNDS.castelo;
    if (lower.includes('deserto')) return FASE_BACKGROUNDS.deserto;
    if (lower.includes('vila')) return FASE_BACKGROUNDS.vila;
    if (lower.includes('bd')) return SUBJECT_IMAGES['banco de dados'];
    if (lower.includes('cienc')) return SUBJECT_IMAGES.ciencias;
    if (lower.includes('geo')) return SUBJECT_IMAGES.geografia;
    if (lower.includes('hist')) return SUBJECT_IMAGES.historia;
    if (lower.includes('mate')) return SUBJECT_IMAGES.matematica;
    if (lower.includes('port')) return SUBJECT_IMAGES.portugues;
  }

  // Fallback inteligente caso imagem venha vazia
  if (trilha.materia) {
    const mat = trilha.materia.toLowerCase();
    if (mat.includes('mat')) return FASE_BACKGROUNDS.montanha;
    if (mat.includes('port')) return FASE_BACKGROUNDS.montanha;
    if (mat.includes('prog') || mat.includes('comp') || mat.includes('dados')) return FASE_BACKGROUNDS.castelo;
    if (mat.includes('geo') || mat.includes('hist')) return FASE_BACKGROUNDS.deserto;
    if (mat.includes('cien')) return FASE_BACKGROUNDS.vila;
  }

  return FASE_BACKGROUNDS.montanha;
}


