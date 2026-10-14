/*
 * Marcas. Os templates nunca usam cor "solta": usam papéis (accent, paper,
 * panel...). Trocar de marca = trocar este bloco. Pra criar a marca de um
 * cliente, copia um preset, troca cores/fontes/assinatura e pronto.
 *
 * Papéis de cor:
 *   dark        fundo escuro principal
 *   paper       fundo claro (papel)
 *   ink         texto sobre fundo escuro
 *   inkOnPaper  texto/títulos sobre o papel
 *   body        texto corrido sobre o papel
 *   accent      cor de destaque (a "brasa")
 *   accent2     destaque secundário
 *   panel       caixas atrás de texto sobre vídeo
 *   muted       texto apagado / secundário
 */
(function (root) {
  'use strict';
  var TC = root.TC;

  var FONTS = {
    display: "'TC Display', 'Anton', Impact, 'Arial Narrow', sans-serif",
    sans: "'TC Sans', 'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    mono: "'TC Mono', 'Space Mono', 'Courier New', monospace"
  };

  TC.brands = {
    'novo-mkt': {
      name: 'Novo MKT — Herton',
      colors: {
        dark: '#141112',
        paper: '#EFE8DC',
        ink: '#F4EDE2',
        inkOnPaper: '#A43D14',
        body: '#2A1E1A',
        accent: '#E2582B',
        accent2: '#E8A03C',
        panel: '#3B2838',
        muted: '#A39A93'
      },
      fonts: FONTS,
      icon: 'bolt',
      badge: 'flame',
      sign: {
        marca: 'NOVO MKT',
        pre: 'HERTON DO',
        nome: 'HERTON DO NOVO MKT',
        cargo: 'ESTRATEGISTA QUE O MERCADO DIGITAL ELIMINOU',
        slogan: 'O NOVO MKT É SER REAL.',
        tese: 'A CLAREZA VEM ANTES DO MARKETING.',
        handle: '@seuperfil'
      }
    },

    'universe': {
      name: 'universe — estúdio',
      colors: {
        dark: '#17112A',
        paper: '#F1EDF9',
        ink: '#FFFFFF',
        inkOnPaper: '#5B3FB8',
        body: '#1E1638',
        accent: '#8D6BE2',
        accent2: '#C7B5F7',
        panel: '#1B1430',
        muted: '#A99FC4'
      },
      fonts: FONTS,
      icon: 'hex',
      badge: 'hex',
      sign: {
        marca: 'universe',
        pre: 'ESTÚDIO',
        nome: 'UNIVERSE',
        cargo: 'AUDIOVISUAL COMO POSICIONAMENTO',
        slogan: 'COMUNICAÇÃO COM SIGNIFICADO.',
        tese: 'SE NÃO FAZ SENTIDO NO DIAGNÓSTICO, NÃO FAZ SENTIDO NO VÍDEO.',
        handle: '@universe'
      }
    }
  };

  TC.defaultBrand = 'novo-mkt';
})(typeof window !== 'undefined' ? window : this);
