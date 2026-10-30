/* ================= ÍCONES PIXEL ================= */
const ICONES = {
  espresso: { p: { o: '#2a1a10', w: '#f6f1e6', s: '#c9bda6', c: '#c88a48', k: '#5a3218' }, m: ['', '   s  s', '    s', '  oooooooo', '  okkcckko', '  owwwwwwooo', '  owwwwwwo o', '  owwwwwwooo', '  oswwwwso', '   ossso', ' oooooooooo', '  oooooooo'] },
  cappuccino: { p: { o: '#2a1a10', w: '#f6f1e6', s: '#c9bda6', f: '#fff8ea', h: '#a8683a' }, m: ['  s  s', '   s', ' oooooooooo', ' offfhhfffo', ' offhhhhffoo', ' owwwwwwwwo o', ' owwwwwwwwo o', ' owwwwwwwwoo', ' oswwwwwwso', '  osssssso', 'oooooooooooo', ' oooooooooo'] },
  coado: { p: { o: '#2a1a10', w: '#f6f1e6', s: '#c9bda6', k: '#7a4a22', a: '#e8dcc0' }, m: ['   oooooo', '  oaaaaaao', '   oaaaao', ' oooooooooo', ' okkkkkkko', ' owwwwwwooo', ' owwwwwwo o', ' owwwwwwooo', ' oswwwwso', '  ossso', ' oooooooooo'] },
  mocha: { p: { o: '#2a1a10', w: '#f6f1e6', s: '#c9bda6', f: '#fff0dc', h: '#5a2c14', c: '#8a4a24' }, m: ['  h h', ' oooooooooo', ' ofhfhfhffo', ' offfhffffoo', ' occcccccco o', ' owwwwwwwwo o', ' owwwwwwwwoo', ' owwwwwwwwo', ' oswwwwwwso', '  osssssso', 'oooooooooooo', ' oooooooooo'] },
  pao: { p: { o: '#4a2a10', a: '#f4c25a', b: '#d99a32', c: '#ffe39a', d: '#b27222' }, m: ['', '', '   oooooo', '  oaacaaao', ' oaccaaaabo', ' oacaaaabbo', ' oaaaaabbdo', ' oaaaabbddo', '  obbbbddo', '   oooooo'] },
  grao: { p: { o: '#2a140a', a: '#7a4422', b: '#5a2e14', c: '#a8683a' }, m: ['', '    oooo', '   oacabo', '  oacabbbo', '  oaabbbbo', ' oaaabbbbo', ' oaabbbbbo', ' oaabbbbo', '  oabbbbo', '  obbbbo', '   oooo'] },
  leite: { p: { o: '#1e2a40', w: '#f4f8ff', s: '#c8d4ea', b: '#4a8ad8', c: '#2e64b0' }, m: ['    oooo', '   owwwwo', '  owwwwwwo', ' oooooooooo', ' owwwwwwwso', ' obbbbbbbco', ' obwwbwbbco', ' obbbbbbbco', ' owwwwwwwso', ' owwwwwwwso', ' oooooooooo'] },
  massa: { p: { o: '#5a4020', a: '#fff1c8', b: '#f0d890', c: '#d8b868' }, m: ['', '', '    oooo', '  ooaaaaoo', ' oaaaaaabbo', ' oaaaaabbbo', 'oaaaaabbbbco', 'oaaabbbbbcco', ' obbbbbccco', '  oooooooo'] },
  moeda: { p: { o: '#5a3a00', a: '#ffd84a', b: '#e8a820', c: '#fff4a8' }, m: ['', '   oooooo', '  oaaaaaao', ' oaccaaaabo', ' oacaoobabo', ' oaaaobaabo', ' oaaaobaabo', ' oaaoooabbo', ' oaaaaaabbo', '  obbbbbbo', '   oooooo'] },
  estrela: { p: { o: '#5a3a00', a: '#ffd84a', c: '#fff4a8', b: '#e8a820' }, m: ['', '     oo', '     oco', '    ocao', 'ooooocaaoooo', 'occaaaaaaabo', ' oaaaaaaabo', '  oaaaaabo', '  oaaoobbo', ' oaao  oabo', ' ooo    ooo'] },
  fogo: { p: { o: '#5a1000', a: '#ff5e3a', b: '#ffa64d', c: '#ffe08a' }, m: ['     o', '    oao', '   oaao  o', '   oaaao oo', '  oaabaaoao', '  oabbbaaao', ' oabbcbbaao', ' oabcccbbao', ' oabcccbao', '  oabcbao', '   oooo'] },
  relogio: { p: { o: '#1a1530', a: '#f6f1e6', b: '#c9bda6', r: '#ff6e6e' }, m: ['', '   oooooo', '  oaaaaaao', ' oaaaoaaabo', ' oaaaoaaabo', ' oaaaoooabo', ' oaaaaaaabo', ' oaaaaaaabo', '  obbbbbbo', '   oooooo'] },
  raio: { p: { o: '#5a3a00', a: '#ffd84a', c: '#fff4a8' }, m: ['      oooo', '     ocao', '    ocao', '   ocaoooo', '  ocaaaaao', ' ooooocao', '     oao', '    oao', '   oao', '   oo'] },
  coracao: { p: { o: '#5a0a2a', a: '#ff93c9', c: '#ffd0e6', b: '#e05a9a' }, m: ['', ' ooo  ooo', 'oacao oaao', 'occaaoaaabo', 'oaaaaaaaabo', 'oaaaaaaaabo', ' oaaaaaabo', '  oaaaabo', '   oaabo', '    oo'] },
};
const icoCache = {};
function icone(n) {
  if (icoCache[n]) return icoCache[n];
  const c = document.createElement('canvas'); c.width = 12; c.height = 12;
  desenhaIcone(c.getContext('2d'), n, 0, 0);
  return (icoCache[n] = c.toDataURL());
}
function desenhaIcone(g, n, x, y) {
  const I = ICONES[n]; if (!I) return;
  I.m.forEach((linha, j) => { for (let i = 0; i < linha.length; i++) { const col = I.p[linha[i]]; if (col) { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); } } });
}
const img = (n, cls = '') => `<img class="ico ${cls}" src="${icone(n)}" alt="">`;

