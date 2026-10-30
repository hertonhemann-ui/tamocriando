/* ================= TUTORIAL ================= */
const TUT = [
  { fala: 'Olha o primeiro cliente: o Seu Jair, que vem aqui desde o meu tempo. Ele quer um <b>espresso</b>. Toca em <b>Espresso</b> no Preparo 1.', entra: () => spawn({ tipo: 'tut', nome: 'Seu Jair', ped: ['espresso'], modo: 'balcao' }, true), alvo: '[data-ac="iniciar"][data-i="0"][data-rec="espresso"]', ok: () => R.slots[0].rec === 'espresso' || R.bandeja.some(b => b) },
  { fala: 'Agora <b>Moer</b>. Toca uma vez e <b>o personagem anda até o moedor</b>. Quando chegar, aparece uma barra com uma faixa verde: toca de novo <b>quando o cursor passar pela faixa</b>. Isso é o <b>ponto perfeito</b>, e vale gorjeta. (Dá pra clicar direto no moedor da cena também.)', alvo: '[data-ac="mao"][data-i="0"]', ok: () => !R.slots[0].rec || R.slots[0].passo >= 1 },
  { fala: 'A máquina extrai sozinha. Olha as etapas no cartão: <b>Moer</b> já foi, agora <b>Extrair</b>. Tuas mãos ficam livres.', alvo: '[data-slot="0"]', ok: () => R.bandeja.some(b => b) || R.stats.atendidos >= 1 },
  { fala: 'Foi pra <b>bandeja</b>. Viu a estrela? Saiu no ponto. Agora toca no <b>pedido do Seu Jair</b> (ou nele, na cena) pra servir. Tu anda até o balcão e entrega.', alvo: '.ticket[data-id]', ok: () => R.stats.atendidos >= 1 },
  { fala: 'A Marina quer <b>cappuccino</b>: espresso com <b>leite vaporizado</b>. Mesmo começo, uma etapa de mão a mais. Tenta acertar o ponto nas duas.', entra: () => spawn({ tipo: 'tut', nome: 'Marina', ped: ['cappuccino'], modo: 'balcao' }, true), alvo: '[data-ac="iniciar"][data-rec="cappuccino"]', ok: () => R.stats.atendidos >= 2 },
  { fala: 'O Tonho quer <b>pão de queijo</b>. Sai do <b>forno</b>, 4 de uma vez. Toca em <b>Assar</b>, espera e entrega.', entra: () => spawn({ tipo: 'tut', nome: 'Tonho', ped: ['pao'], modo: 'balcao' }, true), alvo: '[data-ac="assar"]', ok: () => R.stats.atendidos >= 3 },
  { fala: 'Cada cliente atendido rápido aumenta o <b>combo</b>. Combo alto multiplica as gorjetas: x1,25 no 3, x1,5 no 6, x2 no 10. Se alguém for embora irritado, zera. E olha ali em cima: <b>três metas do dia</b>, cada uma paga um bônus.', botao: 'Entendi' },
  { fala: 'Duas coisas pra amanhã. <b>Tu faz uma coisa de cada vez</b>, mas pode enfileirar tarefas: toca em várias e ele vai fazendo na ordem. E essas mesas do salão só abrem amanhã: quem senta consome mais, mas é preciso <b>anotar, servir e limpar</b>. A parcela do café é <b>R$ 400 na sexta</b>. Agora vou abrir a porta de verdade.', botao: 'Bora abrir' },
];
function tutEntra() { const p = TUT[R.tut]; if (p && p.entra) p.entra(); render(); }
function tutChecar() { const p = TUT[R.tut]; if (p && p.ok && p.ok()) { R.tut++; if (R.tut >= TUT.length) tutFim(); else tutEntra(); } }
function tutBotao() { sfx('clique'); R.tut++; if (R.tut >= TUT.length) tutFim(); else tutEntra(); }
function tutFim() { R.tut = -1; R.hold = false; R.cidaDica = true; agendarClientes(R.t); msg('A Dona Cida virou a placa: aberto!'); sfx('porta'); render(); }

