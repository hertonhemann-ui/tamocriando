/*
 * Marca: brasa, papel e tinta.
 *
 *   brasa  #C8502A  aquilo em que tu acredita (só onde algo precisa marcar)
 *   papel  #EFE9DF  aquilo que tu pensa
 *   tinta  #1A1714  aquilo que tu sustenta
 *   cinza  #9B968E  aquilo que deixa respirar
 *
 * glow, hot e crust não são cores da identidade: são a luz e a casca da
 * própria brasa (o brilho do carvão aceso e a crosta escura em volta).
 */
(function (root) {
  'use strict';
  var TC = root.TC;

  TC.brands = {
    herton: {
      name: 'herton hemann',
      colors: {
        ember: '#C8502A',
        paper: '#EFE9DF',
        ink: '#1A1714',
        ash: '#9B968E',
        glow: '#E06A3E',
        hot: '#F2A27C',
        crust: '#2E2420',
        paperShade: '#E2D9CB'
      },
      fonts: {
        display: "'TC Display', 'Anton', Impact, 'Arial Narrow', sans-serif",
        sans: "'TC Sans', 'Inter', 'Helvetica Neue', Arial, sans-serif"
      },
      sign: {
        nome: 'herton hemann',
        primeiro: 'herton',
        sobrenome: 'hemann',
        cargo: 'estrategista que elimina o cinza e acende a devoção.',
        destaqueCargo: 'acende a devoção.',
        handle: ''
      }
    }
  };

  TC.defaultBrand = 'herton';
})(typeof window !== 'undefined' ? window : this);
