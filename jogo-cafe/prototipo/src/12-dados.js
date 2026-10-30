/* ================= DADOS ================= */
const DAY_LEN = 180, GRACE = 25, DIAS = 5, PARCELA = 400;
const NOME_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const RECEITAS = {
  espresso: { nome: 'Espresso', usa: { grao: 1 }, passos: [{ id: 'moer', nome: 'Moer', tipo: 'mao', t: 1.3 }, { id: 'extrair', nome: 'Extrair', tipo: 'maq', t: 3 }] },
  cappuccino: { nome: 'Cappuccino', usa: { grao: 1, leite: 1 }, passos: [{ id: 'moer', nome: 'Moer', tipo: 'mao', t: 1.3 }, { id: 'extrair', nome: 'Extrair', tipo: 'maq', t: 3 }, { id: 'vaporizar', nome: 'Vaporizar', tipo: 'mao', t: 1.6 }] },
  coado: { nome: 'Café coado', usa: { grao: 1 }, passos: [{ id: 'moer', nome: 'Moer', tipo: 'mao', t: 1.3 }, { id: 'coar', nome: 'Coar', tipo: 'mao', t: 2.4 }] },
  mocha: { nome: 'Mocha', usa: { grao: 1, leite: 1 }, passos: [{ id: 'moer', nome: 'Moer', tipo: 'mao', t: 1.3 }, { id: 'extrair', nome: 'Extrair', tipo: 'maq', t: 3 }, { id: 'choco', nome: 'Chocolate', tipo: 'mao', t: 1.1 }, { id: 'vaporizar', nome: 'Vaporizar', tipo: 'mao', t: 1.6 }] },
};
const PRECO_BASE = { espresso: 6, cappuccino: 9, mocha: 12, coado: 8, pao: 5 };
const NOME_ITEM = { espresso: 'Espresso', cappuccino: 'Cappuccino', mocha: 'Mocha', coado: 'Café coado', pao: 'Pão de queijo' };
const STEP_EST = { moer: 'moedor', vaporizar: 'vapor', choco: 'vapor', coar: 'coador' };
const PRECO_MULT = { baixo: 0.8, normal: 1, alto: 1.25 };
const DEMANDA_PRECO = { baixo: 1.2, normal: 1, alto: 0.8 };
const PAC_PRECO = { baixo: 1.1, normal: 1, alto: 0.85 };
const ALUGUEL = 40, SAL = { integral: 35, meio: 20 }, FORNO_T = 8;
const PACOTES = {
  grao: { nome: 'Grão de café', qtd: 20, preco: 24, un: 'doses', ico: 'grao' },
  leite: { nome: 'Leite', qtd: 10, preco: 14, un: 'doses', ico: 'leite' },
  massa: { nome: 'Massa de pão de queijo', qtd: 12, preco: 9, un: 'unid.', ico: 'massa' },
};
const MELHORIAS = [
  { id: 'slot3', nome: 'Terceiro espaço de preparo', preco: 90, desc: 'Mais um pedido em andamento ao mesmo tempo.', req: s => s.up.slots === 2, ef: s => { s.up.slots = 3; } },
  { id: 'slot4', nome: 'Quarto espaço de preparo', preco: 150, desc: 'Quatro pedidos em paralelo.', req: s => s.up.slots === 3, ef: s => { s.up.slots = 4; } },
  { id: 'maq2', nome: 'Máquina de dois grupos', preco: 140, desc: 'Extrai dois cafés ao mesmo tempo. Hoje a máquina é o gargalo. Visual moderno.', estilo: 'moderno', tem: s => s.up.maquina > 1, req: s => s.up.maquina === 1, ef: s => { s.up.maquina = 2; } },
  { id: 'moedor', nome: 'Moedor elétrico', preco: 70, desc: 'Moer leva metade do tempo. Visual moderno.', estilo: 'moderno', tem: s => s.up.moedor, req: s => !s.up.moedor, ef: s => { s.up.moedor = true; } },
  { id: 'coador', nome: 'Coador artesanal', preco: 45, desc: 'Libera o Café coado: mais lento, mas artesanal. Quem senta pede mais. Visual rústico.', estilo: 'rustico', tem: s => s.up.coador, req: s => !s.up.coador, ef: s => { s.up.coador = true; } },
  { id: 'bandeja', nome: 'Bandeja grande', preco: 35, desc: 'Bandeja de 4 para 7 lugares.', req: s => s.up.bandeja === 4, ef: s => { s.up.bandeja = 7; } },
  { id: 'forno', nome: 'Forno grande', preco: 80, desc: 'Assa 8 pães de cada vez.', req: s => s.up.forno === 4, ef: s => { s.up.forno = 8; } },
];
const PERKS = {
  coz1: [{ id: 'pulso', nome: 'Pulso firme', desc: 'A faixa do ponto perfeito fica 50% maior.' }, { id: 'maoRapida', nome: 'Mão rápida', desc: 'Etapas de mão 20% mais rápidas.' }],
  coz2: [{ id: 'fornoBom', nome: 'Olho no forno', desc: 'O forno assa 30% mais rápido.' }, { id: 'caprichoso', nome: 'Caprichoso', desc: 'Cada item perfeito rende R$ 2 de bônus em vez de R$ 1.' }],
  at1: [{ id: 'papo', nome: 'Papo bom', desc: 'Clientes esperam 15% mais.' }, { id: 'sorriso', nome: 'Sorriso', desc: 'Toda gorjeta ganha R$ 1 a mais.' }],
  at2: [{ id: 'escudo', nome: 'Freguesia fiel', desc: 'O primeiro cliente irritado do dia não quebra o combo.' }, { id: 'bocaBoca', nome: 'Boca a boca', desc: 'Cada cliente satisfeito rende 50% mais fama.' }],
};
const TRACOS = {
  apressado: { nome: 'apressado', desc: 'espera pouco, paga R$ 2 a mais' },
  exigente: { nome: 'exigente', desc: 'só aceita bebida perfeita' },
  generoso: { nome: 'generoso', desc: 'gorjeta em dobro' },
};
const NOMES = ['Seu Jair', 'Marina', 'Tonho', 'Rita', 'Juca', 'Paula', 'Beto', 'Dani', 'Lu', 'Seu Zé', 'Carla', 'Nando', 'Tati', 'Gui', 'Neide', 'Raul', 'Bruna', 'Seu Lino', 'Mel', 'Edu', 'Kátia', 'Vini', 'Duda', 'Sônia', 'Léo', 'Ivone', 'Josi', 'Seu Abel'];
const PERS = {
  voce: { nome: 'Tu', pele: '#e0a878', cabelo: '#3a2416', roupa: '#ffcc4d', estilo: 'curto' },
  cida: { nome: 'Dona Cida', pele: '#d9a07a', cabelo: '#ece8f4', roupa: '#c0392b', estilo: 'coque' },
  bia: { nome: 'Bia', pele: '#c98a5e', cabelo: '#5a2e18', roupa: '#2f8f6f', estilo: 'rabo' },
  lucia: { nome: 'Dona Lúcia', pele: '#efc6a6', cabelo: '#c3b0de', roupa: '#8e5ca8', estilo: 'curto', oculos: true },
  caio: { nome: 'Caio', pele: '#8d5a3b', cabelo: '#1c1c1c', roupa: '#3d6fd1', estilo: 'bone' },
  rafa: { nome: 'Rafa', pele: '#e6b48f', cabelo: '#141414', roupa: '#1f5f4a', estilo: 'topete' },
  blog: { nome: 'Blogueira', pele: '#f1c9a5', cabelo: '#d2483a', roupa: '#2a2a2a', estilo: 'longo' },
  nair: { nome: 'Dona Nair', pele: '#c58a62', cabelo: '#2a1a14', roupa: '#d0527a', estilo: 'longo' },
  dimas: { nome: 'Seu Dimas', pele: '#b07850', cabelo: '#888888', roupa: '#7a5a3a', estilo: 'careca' },
};
const LOCAIS = {
  casa: { nome: 'Casa', x: 28, desc: 'Teu quarto alugado em cima da farmácia. Cama, fogão de duas bocas e silêncio.' },
  fornecedor: { nome: 'Fornecedor', x: 76, desc: 'Seu Dimas vende grão, leite, massa e umas peças usadas para café.' },
  moveis: { nome: 'Móveis', x: 123, desc: 'Móveis & Cia, da Dona Nair. Mesas, cadeiras e tinta de parede. Cada peça diz alguma coisa sobre o teu café.' },
  cafe: { nome: 'Café', x: 183, desc: 'O Café Cantinho. Balcão, salão e cheiro de grão torrado.' },
  praca: { nome: 'Praça', x: 244, desc: 'Bancos, pombos e a Dona Lúcia fazendo a caminhada dela.' },
  bar: { nome: 'Bar', x: 295, desc: 'Bar do Seu Jorge. Cerveja gelada, sinuca torta e o Caio quase toda noite.' },
  grao: { nome: 'Grão Nobre', x: 351, desc: 'O café do Rafa. Maior, mais rápido e sempre cheio de estudantes.' },
};

/* Estilos do café: o que cada peça diz sobre a marca */
const ESTILOS = {
  rustico: { nome: 'Rústico', frase: 'Cara de casa de vó', efeito: 'Clientes esperam 15% mais e deixam R$ 1 a mais nas mesas.' },
  moderno: { nome: 'Moderno', frase: 'Prático e rápido', efeito: '10% mais clientes e quem senta come 15% mais rápido.' },
  vintage: { nome: 'Vintage', frase: 'Retrô cheio de charme', efeito: 'Cada cliente satisfeito rende 30% mais fama.' },
  verde: { nome: 'Refúgio verde', frase: 'Respira fundo aqui', efeito: 'Clientes esperam 10% mais e tu dorme com +6 de ânimo.' },
};
const ATR_NOME = { conforto: 'Conforto', aconchego: 'Aconchego', charme: 'Charme', giro: 'Giro' };
const ATR_DESC = {
  conforto: 'Clientes na mesa esperam mais e dão mais gorjeta.',
  aconchego: 'Ficam mais tempo e às vezes pedem sobremesa.',
  charme: 'Cada cliente servido rende mais fama.',
  giro: 'Comem mais rápido e liberam a mesa logo.',
};
const MESAS = {
  ferro: { nome: 'Mesinha de ferro', preco: 0, lugares: 2, estilo: null, attr: { giro: 1 }, desc: 'A que veio com o café. Serve.' },
  redonda: { nome: 'Mesa redonda de madeira', preco: 60, lugares: 2, estilo: 'rustico', attr: { aconchego: 2, charme: 1 }, desc: 'Madeira maciça, canto para conversa.' },
  comprida: { nome: 'Mesa comprida compartilhada', preco: 110, lugares: 4, estilo: 'rustico', attr: { aconchego: 1, giro: 1 }, desc: 'Quatro lugares, gente que não se conhece dividindo a mesa.' },
  alta: { nome: 'Bancada alta', preco: 90, lugares: 2, estilo: 'moderno', attr: { giro: 3 }, desc: 'Ninguém fica muito. Rodando rápido.' },
  vidro: { nome: 'Mesa de vidro e metal', preco: 130, lugares: 2, estilo: 'moderno', attr: { charme: 3, giro: 1 }, desc: 'Bonita pra foto. Pouco aconchego.' },
  retro: { nome: 'Mesa retrô de fórmica', preco: 100, lugares: 4, estilo: 'vintage', attr: { charme: 2, aconchego: 1 }, desc: 'Quatro lugares, cantos arredondados, cara de lanchonete antiga.' },
  vaso: { nome: 'Mesa com samambaia', preco: 85, lugares: 2, estilo: 'verde', attr: { aconchego: 1, charme: 1, conforto: 1 }, desc: 'Um vaso no meio muda o clima da mesa.' },
};
const CADEIRAS = {
  plastico: { nome: 'Cadeira de plástico', preco: 0, estilo: null, attr: {}, tipo: 'cadeira', cor: ['#e8e0d0', '#d8d0c0'] },
  madeira: { nome: 'Cadeira de madeira', preco: 30, estilo: 'rustico', attr: { conforto: 1, aconchego: 1 }, tipo: 'cadeira', cor: ['#a8723e', '#8a5a30'] },
  banco: { nome: 'Banquinho de metal', preco: 25, estilo: 'moderno', attr: { giro: 2 }, tipo: 'banco', cor: ['#6a7088', '#4a5068'] },
  vime: { nome: 'Cadeira de vime', preco: 45, estilo: 'verde', attr: { conforto: 2, aconchego: 1, giro: -1 }, tipo: 'cadeira', cor: ['#d8b86a', '#b8943e'] },
  poltrona: { nome: 'Poltrona estofada', preco: 70, estilo: 'rustico', attr: { conforto: 3, aconchego: 2, giro: -1 }, tipo: 'poltrona', cor: ['#a8384a', '#862838'] },
  bancoretro: { nome: 'Banqueta estofada retrô', preco: 55, estilo: 'vintage', attr: { charme: 2, conforto: 1 }, tipo: 'banco', cor: ['#3ab0a8', '#2a8a84'] },
  sofa: { nome: 'Sofazinho', preco: 80, estilo: 'vintage', attr: { aconchego: 3, conforto: 2, giro: -2 }, tipo: 'poltrona', cor: ['#e08a9a', '#c06a7c'] },
};
const DECOR = {
  parede: { nome: 'Pintura da parede', opc: {
    padrao: { nome: 'Lilás escuro (original)', preco: 0, estilo: null, attr: {}, d: '#6e4a5e', e: '#5a3b4e', f: '#4a2a42', tr: '#8a6078' },
    tijolo: { nome: 'Tijolo aparente', preco: 50, estilo: 'rustico', attr: { aconchego: 1, charme: 1 }, d: '#a8553a', e: '#8e4630', f: '#5a3a22', tr: '#c9a06a', tijolo: true },
    salvia: { nome: 'Verde-sálvia', preco: 40, estilo: 'verde', attr: { conforto: 1, aconchego: 1 }, d: '#86ad8f', e: '#6f9778', f: '#4a6a52', tr: '#d8e8d0' },
    petroleo: { nome: 'Azul petróleo', preco: 45, estilo: 'moderno', attr: { charme: 2 }, d: '#3a6b80', e: '#2f5a6c', f: '#1f3f4c', tr: '#8fb8c8' },
    rosa: { nome: 'Rosa antigo', preco: 45, estilo: 'vintage', attr: { charme: 2 }, d: '#dba0ae', e: '#c48a98', f: '#8a4a5a', tr: '#fff0e8' },
  } },
  piso: { nome: 'Piso do salão', opc: {
    padrao: { nome: 'Tábua corrida (original)', preco: 0, estilo: null, attr: {} },
    xadrez: { nome: 'Xadrez preto e branco', preco: 70, estilo: 'vintage', attr: { charme: 2 } },
    concreto: { nome: 'Concreto polido', preco: 60, estilo: 'moderno', attr: { charme: 1, giro: 1 } },
    ladrilho: { nome: 'Ladrilho verde', preco: 65, estilo: 'verde', attr: { conforto: 1, charme: 1 } },
  } },
  quadro: { nome: 'Quadro na parede', opc: {
    nenhum: { nome: 'Parede nua', preco: 0, estilo: null, attr: {} },
    cartaz: { nome: 'Cartaz retrô de café', preco: 25, estilo: 'vintage', attr: { charme: 1 } },
    abstrato: { nome: 'Quadro abstrato', preco: 40, estilo: 'moderno', attr: { charme: 2 } },
    botanico: { nome: 'Gravura botânica', preco: 35, estilo: 'verde', attr: { conforto: 1 } },
    familia: { nome: 'Retrato de família', preco: 30, estilo: 'rustico', attr: { aconchego: 1 } },
  } },
  planta: { nome: 'Planta do canto', opc: {
    nenhuma: { nome: 'Canto vazio', preco: 0, estilo: null, attr: {} },
    samambaia: { nome: 'Samambaia', preco: 30, estilo: 'verde', attr: { conforto: 1, aconchego: 1 } },
    monstera: { nome: 'Costela-de-adão grande', preco: 55, estilo: 'verde', attr: { charme: 2, conforto: 1 } },
    cacto: { nome: 'Cacto de design', preco: 20, estilo: 'moderno', attr: { charme: 1 } },
  } },
};
