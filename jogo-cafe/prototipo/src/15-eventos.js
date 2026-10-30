/* ================= EVENTOS ================= */
const EV = [
  { id: 'bia_emprego', quando: 'pos', forcado: true, peso: 'pesado', quem: 'bia', cond: s => s.dia === 1,
    texto: s => ({ titulo: 'Alguém bate no vidro', corpo: [`Tu vira a placa. Hoje foram ${s.ultimo.atendidos} atendidos e ${s.ultimo.irritados} foram embora sem atendimento. Uma moça que passou a tarde olhando a fila bate no vidro.`], falas: [['bia', 'Sou a Bia. Trabalhei dois anos numa padaria. A Dona Cida disse que tu ia ficar sozinho aqui. Precisa de ajuda?']], contexto: 'Com a Bia, uma tarefa fica automática: forno, moer ou entregar. Ela custa todo dia que trabalhar. Lembra da parcela de R$ 400 na sexta. Caixa hoje: ' + brl(s.caixa) + '.' }),
    escolhas: () => [
      { t: 'Contratar em tempo integral', sub: 'Ela fica o expediente todo.', tags: 'Caixa −R$ 35/dia · uma tarefa automática', ef: s => { s.bia.contratada = true; s.bia.regime = 'integral'; lembra('bia_contratada', 'tu contratou a Bia'); diario('Contratei a Bia em tempo integral.'); return 'A Bia começa amanhã. No Café, de manhã, tu escolhe o que ela faz.'; } },
      { t: 'Contratar meio período', sub: 'Só na primeira metade do expediente.', tags: 'Caixa −R$ 20/dia', ef: s => { s.bia.contratada = true; s.bia.regime = 'meio'; lembra('bia_contratada', 'tu contratou a Bia'); diario('Contratei a Bia em meio período.'); return '"Meio período já ajuda. Se precisar de mais, me fala."'; } },
      { t: 'Agora não dá', sub: 'O caixa ainda está apertado.', tags: 'Bia · isso pode voltar', ef: s => { lembra('bia_recusada', 'tu disse à Bia que não dava pra contratar'); agendar(3, 'bia_no_rival'); diario('Disse para a Bia que não dava pra contratar ninguém.'); return 'Ela agradece, meio sem graça, e some na esquina.'; } },
    ] },
  { id: 'mocha', quando: 'manha', forcado: true, peso: 'leve', quem: 'cida', cond: s => s.dia === 3,
    texto: () => ({ titulo: 'O caderno da Dona Cida', corpo: ['Embaixo do balcão, um caderno de capa dura com a letra da Dona Cida. Na primeira página: "MOCHA DA CIDA — o mais pedido de 1998".'], falas: [['cida', 'Achou meu caderno? Usa sem dó. Moer, extrair, chocolate e leite. Dá trabalho, mas o pessoal paga bem.']], contexto: 'Nova receita: Mocha, R$ 12. Quatro etapas, três delas de mão.' }),
    escolhas: () => [{ t: 'Colocar o Mocha no cardápio', tags: 'Nova receita · pedidos mais caros', ef: s => { s.flags.mocha = true; diario('Achei o caderno da Dona Cida e coloquei o Mocha no cardápio.'); return 'O quadro de giz ganha uma linha nova. Alguém já pergunta "tem mocha?".'; } }] },
  { id: 'bia_no_rival', quando: 'manha', forcado: true, peso: 'pesado', quem: 'bia', cond: () => temAgenda('bia_no_rival'),
    texto: () => ({ titulo: 'Avental de outra cor', corpo: ['Passando pela esquina, tu vê a Bia de avental verde no Grão Nobre, despachando uma fila.'], falas: [['bia', 'Oi! O Rafa precisava de gente. Tu tinha dito que não dava, né? Sem ressentimento.']], contexto: 'O Grão Nobre ficou mais forte: parte dos teus clientes vai para lá.' }),
    escolhas: () => [
      { t: 'Desejar boa sorte', tags: 'Rival mais forte', ef: s => { tiraAgenda('bia_no_rival'); s.rafa.forca += 2; diario('A Bia agora trabalha no Grão Nobre. O café do Rafa ficou mais rápido.', 'bia_recusada'); return 'O Grão Nobre ganhou braço. Tu vai sentir isso na fila.'; } },
      { t: 'Perguntar quanto o Rafa paga', tags: 'Rival mais forte · informação', ef: s => { tiraAgenda('bia_no_rival'); s.rafa.forca += 2; diario('A Bia agora trabalha no Grão Nobre. O Rafa paga R$ 50 por dia.', 'bia_recusada'); return '"R$ 50 por dia e ele fecha às seis."'; } },
    ] },
  { id: 'bia_cansada', quando: 'pos', forcado: true, peso: 'pesado', quem: 'bia', cond: s => biaAtiva() && s.bia.estresse >= 60,
    texto: s => ({ titulo: 'A Bia no estoque', corpo: ['Depois de fechar, tu encontra a Bia sentada numa caixa de leite, olhando para o nada.'], falas: [['bia', 'Desculpa. Tá puxado. Eu fico na mesma função o dia inteiro e ainda saio tarde.']], contexto: `Cansaço da Bia: ${Math.round(s.bia.estresse)} de 100. Cansada, ela trabalha mais devagar.` }),
    escolhas: () => [
      { t: 'Dar folga amanhã', tags: 'Bia ↑ · amanhã sem ajuda', ef: s => { s.amanha.biaFolga = true; s.bia.estresse -= 40; s.bia.moral += 10; diario('Dei folga para a Bia amanhã.'); return 'Ela sorri de verdade pela primeira vez na semana.'; } },
      { t: 'Aumentar o salário dela', tags: 'Caixa −R$ 15/dia · Bia ↑', ef: s => { s.bia.aumento += 15; s.bia.moral += 15; s.bia.estresse -= 10; diario('Dei aumento de R$ 15 por dia para a Bia.'); return 'Ela agradece. O cansaço continua, mas agora tem motivo.'; } },
      { t: 'Pedir pra ela aguentar até sexta', tags: 'Bia ↓ · isso pode voltar', ef: s => { s.bia.moral -= 15; lembra('bia_aguenta', 'tu pediu para a Bia aguentar até sexta'); agendar(s.dia + 2, 'bia_demissao'); diario('Pedi para a Bia aguentar até sexta.'); return 'Ela diz que tudo bem. Não parece tudo bem.'; } },
    ] },
  { id: 'bia_demissao', quando: 'manha', forcado: true, peso: 'pesado', quem: 'bia', cond: s => temAgenda('bia_demissao') && biaAtiva() && s.bia.estresse >= 45,
    texto: () => ({ titulo: 'A Bia chega sem avental', corpo: ['A Bia chega cedo, mas não amarra o avental.'], falas: [['bia', 'O Rafa me ofereceu um lugar no Grão Nobre. Menos horas. Eu aceitei. Desculpa.']] }),
    escolhas: () => [
      { t: 'Desejar boa sorte', tags: 'Sem a Bia · rival mais forte', ef: s => { tiraAgenda('bia_demissao'); s.bia.saiu = true; s.bia.foiRafa = true; s.rafa.forca += 2; diario('A Bia pediu demissão e foi para o Grão Nobre.', 'bia_aguenta'); return 'Tu volta a fazer tudo sozinho.'; } },
      { t: 'Oferecer o dobro para ela ficar', tags: 'Caixa ↓↓', req: s => ({ ok: s.caixa >= 120, motivo: 'Precisa de R$ 120 em caixa' }), ef: s => { tiraAgenda('bia_demissao'); s.bia.aumento += SAL[s.bia.regime]; s.bia.estresse -= 15; diario('Dobrei o salário da Bia para ela não ir para o Grão Nobre.', 'bia_aguenta'); return 'Ela fica. O caixa sente.'; } },
    ] },
  { id: 'leite', quando: 'manha', peso: 'pesado', min: 2, quem: 'voce', cond: s => s.dia <= 4 && s.dia !== 3,
    pre: s => { s.estoque.leite = 0; },
    texto: () => ({ titulo: 'A geladeira desligou', corpo: ['Caiu a luz de madrugada. Todo o leite estragou.'], contexto: 'Sem leite, não sai cappuccino nem mocha.' }),
    escolhas: () => [
      { t: 'Comprar no mercado, mais caro', sub: '10 doses por R$ 30.', tags: 'Caixa −R$ 30', req: s => ({ ok: s.caixa >= 30, motivo: 'Precisa de R$ 30' }), ef: s => { s.caixa -= 30; s.estoque.leite += 10; diario('Perdi o leite e comprei no mercado pelo dobro.'); return 'Resolvido. Margem menor hoje.'; } },
      { t: 'Só café puro hoje', sub: 'Quem pedir com leite leva espresso.', tags: 'Dona Lúcia ↓', ef: s => { s.mods.semLeite = true; diario('Fiquei sem leite e servi só café puro por um dia.'); return 'Mais simples. A Dona Lúcia não vai gostar.'; } },
      { t: 'Pedir leite emprestado para o Rafa', tags: 'Rafa ↑ · ele vai lembrar', ef: s => { s.estoque.leite += 6; s.rafa.afin += 8; lembra('favor_rafa', 'o Rafa te emprestou leite'); diario('O Rafa me emprestou leite quando a geladeira pifou.'); return '"Tranquilo. Um dia tu me ajuda."'; } },
    ] },
  { id: 'chuva', quando: 'manha', peso: 'leve', min: 2, quem: 'voce', cond: () => true,
    texto: () => ({ titulo: 'Chuva forte', corpo: ['Chove desde cedo. Pouca gente na rua, mas quem entra para se abrigar não tem pressa.'], contexto: 'Hoje: 25% menos clientes, 30% mais paciência.' }),
    escolhas: () => [{ t: 'Abrir assim mesmo', ef: s => { s.mods.chuva = true; return 'Dia calmo à vista.'; } }] },
  { id: 'elogio', quando: 'pos', peso: 'leve', min: 2, quem: 'voce', cond: s => s.tensao >= 2,
    texto: () => ({ titulo: 'Um bilhete no balcão', corpo: ['Um senhor deixou um guardanapo dobrado ao lado da xícara: "Melhor espresso do bairro. Volto amanhã."'] }),
    escolhas: () => [{ t: 'Colar o bilhete na parede', tags: 'Ânimo ↑ · Fama ↑', ef: s => { s.rep += 2; s.animo += 10; diario('Alguém deixou um bilhete dizendo que é o melhor espresso do bairro.'); return 'Às vezes é isso que segura a semana.'; } }] },
  { id: 'lucia_preco', quando: 'pos', peso: 'pesado', quem: 'lucia', cond: s => s.flags.luciaPagouAlto && s.lucia.afin > 5,
    texto: () => ({ titulo: 'Dona Lúcia volta ao balcão', corpo: ['Ela já tinha ido embora. Volta, ajeita a bolsa e fala baixo.'], falas: [['lucia', 'Meu filho, onze reais no cappuccino? Eu venho aqui todo dia. Desde quando isso aqui era da Cida.']], contexto: 'A Dona Lúcia vem todo dia e conhece meio bairro.' }),
    escolhas: () => [
      { t: 'Manter o preço', tags: 'Dona Lúcia ↓↓ · ela vai lembrar', ef: s => { s.lucia.afin -= 12; lembra('lucia_preco', 'tu manteve o preço alto mesmo com a reclamação da Dona Lúcia'); diario('Mantive o preço alto. A Dona Lúcia saiu chateada.'); return 'Ela só diz "tá bom" do jeito que as pessoas dizem quando não está.'; } },
      { t: 'Preço antigo só para ela', tags: 'Dona Lúcia ↑', ef: s => { s.flags.luciaPrecoAntigo = true; s.lucia.afin += 8; diario('Dei à Dona Lúcia o preço antigo, só para ela.'); return 'Ela aperta tua mão. "Tu é dos bons."'; } },
      { t: 'Explicar as contas para ela', tags: 'Dona Lúcia ↑ · Fama ↑', req: s => ({ ok: s.lucia.afin >= 30 || s.padrao.social >= 1, motivo: 'Ela ainda não te conhece o bastante (caminhe com ela na praça)' }), ef: s => { s.lucia.afin += 3; s.rep += 3; diario('Expliquei as contas do café para a Dona Lúcia. Ela comentou com as amigas.'); return '"Vou falar pras meninas que tu é honesto."'; } },
    ] },
  { id: 'lucia_clube', quando: 'pos', peso: 'leve', min: 3, quem: 'lucia', cond: s => s.lucia.afin >= 45 && s.dia <= 4,
    texto: s => ({ titulo: 'O grupo de crochê', corpo: ['Dona Lúcia demora no balcão depois de pagar.'], falas: [['lucia', (s.flags.luciaContou ? 'Lembra da padaria que fechou? ' : 'A padaria onde a gente se encontrava fechou. ') + 'Posso trazer as meninas do crochê amanhã à tarde? São cinco.']], contexto: 'Cinco clientes juntas, pacientes. Pedem cappuccino e pão.' }),
    escolhas: () => [
      { t: 'Aceitar', tags: 'Dona Lúcia ↑ · pico de clientes amanhã', ef: s => { s.amanha.clube = true; s.lucia.afin += 5; diario('Aceitei receber o grupo de crochê da Dona Lúcia.'); return 'Amanhã, lá pelas três, chegam cinco senhoras. Pense em pré-assar pão.'; } },
      { t: 'Dizer que o café é pequeno demais', tags: 'Dona Lúcia ↓', ef: s => { s.lucia.afin -= 5; diario('Recusei o grupo de crochê da Dona Lúcia.'); return '"Entendo." Ela entende. Mas lembra.'; } },
    ] },
  { id: 'caio_show', quando: 'pos', peso: 'leve', min: 2, quem: 'caio', cond: s => s.caio.afin >= 55 && s.dia <= 4,
    texto: () => ({ titulo: 'Caio e o violão', corpo: ['O Caio aparece no fim do expediente com o violão nas costas.'], falas: [['caio', 'E se eu tocar aqui na sexta? Tu não me paga nada, só me dá café. Eu chamo a galera.']], contexto: 'Sexta teria 40% mais clientes. Dia da parcela.' }),
    escolhas: () => [
      { t: 'Topar o show de sexta', tags: 'Caio ↑ · sexta lotada', ef: s => { s.flags.showCaio = true; s.caio.afin += 8; diario('Combinei com o Caio um show no café na sexta.'); return '"Fechado! Vai lotar, tu vai ver."'; } },
      { t: 'Recusar', tags: 'Caio ↓', ef: s => { s.caio.afin -= 6; diario('Recusei o show do Caio.'); return '"Beleza. Outra hora."'; } },
    ] },
  { id: 'caio_sumindo', quando: 'manha', peso: 'pesado', min: 3, quem: 'caio', cond: s => s.caio.semVer >= 2 && !s.flags.showCaio,
    texto: s => ({ titulo: 'Mensagem do Caio', corpo: [`Faz ${s.caio.semVer} noites que tu não aparece no bar. Chega uma mensagem:`], falas: [['caio', 'Sumiu, hein. Ah, o Rafa me chamou pra tocar no Grão Nobre na sexta. Tô pensando.']] }),
    escolhas: () => [
      { t: 'Prometer aparecer hoje à noite', tags: 'Tu vai precisar cumprir', ef: s => { s.flags.promessaCaio = s.dia; lembra('promessa_caio', 'tu prometeu ao Caio que ia aparecer'); return '"Vou cobrar, hein."'; } },
      { t: 'Mandar um áudio pedindo desculpa', tags: 'Caio ↑ (pouco)', ef: s => { s.caio.afin += 3; return 'Ele responde com um joinha.'; } },
      { t: 'Deixar pra lá', tags: 'Caio ↓ · sexta mais fraca', ef: s => { s.flags.caioNoRafa = true; lembra('caio_largado', 'tu deixou a mensagem do Caio sem resposta'); diario('Deixei a mensagem do Caio sem resposta.'); return 'Silêncio do outro lado.'; } },
    ] },
  { id: 'rafa_proposta', quando: 'manha', peso: 'pesado', min: 3, quem: 'rafa', cond: s => !s.rafa.acordo && s.dia >= 4,
    texto: s => ({ titulo: 'Rafa, do Grão Nobre', corpo: ['O dono do café rival aparece antes de tu abrir, mãos no bolso.'], falas: [['rafa', 'Vou direto: teu pão de queijo é melhor que o meu. Me fornece 8 por dia que eu te pago R$ 40.' + (s.mem.favor_rafa ? ' E tu me deve aquela do leite.' : '')]], contexto: 'Cada entrega custa 8 massas e 1 hora da tua manhã. Ajuda na parcela de sexta.' }),
    escolhas: () => [
      { t: 'Aceitar', tags: 'Caixa +R$ 40/dia · −1h toda manhã · rival mais forte', ef: s => { s.rafa.acordo = 'pao'; s.rafa.valor = 40; s.rafa.afin += 10; s.rafa.forca += 1; lembra('acordo_rafa', 'tu aceitou fornecer pão para o Rafa'); diario('Fechei acordo: 8 pães por dia ao Grão Nobre por R$ 40.'); return 'Dinheiro garantido. E agora o teu pão atrai gente para o rival.'; } },
      { t: 'Recusar', tags: 'Rafa ↓', ef: s => { s.rafa.afin -= s.mem.favor_rafa ? 15 : 5; diario('Recusei fornecer pão para o Rafa.', s.mem.favor_rafa ? 'favor_rafa' : null); return s.mem.favor_rafa ? '"Depois daquela do leite? Tá certo."' : '"Pensa com carinho."'; } },
      { t: 'Contraproposta: R$ 60', tags: 'Exige Gestão 1', req: s => ({ ok: s.hab.gestao >= 1, motivo: 'Precisa de Gestão nível 1 (estude em casa à noite)' }), ef: s => { if (s.rafa.afin >= 0) { s.rafa.acordo = 'pao'; s.rafa.valor = 60; s.rafa.forca += 1; lembra('acordo_rafa', 'tu fechou com o Rafa a R$ 60'); diario('Negociei com o Rafa: 8 pães por dia a R$ 60.'); return '"Tu aprende rápido."'; } s.rafa.afin -= 5; diario('Tentei negociar com o Rafa e ele recusou.'); return '"Com a nossa história? Não."'; } },
    ] },
  { id: 'critico', quando: 'pos', peso: 'pesado', min: 3, quem: 'blog', cond: s => s.rep >= 45 && s.dia <= 4,
    texto: () => ({ titulo: 'Uma cliente pede o dono', corpo: ['Ela fotografa a xícara antes de beber.'], falas: [['blog', 'Escrevo o "Comendo pela Cidade". Volto amanhã. Não vou dizer a hora.']], contexto: 'Ela é exigente: só aceita bebida perfeita. Bem atendida, a fama sobe muito.' }),
    escolhas: () => [
      { t: 'Agradecer e se preparar', tags: 'Fama ↑↑ ou ↓↓ amanhã', ef: s => { s.amanha.critico = true; diario('Uma blogueira de comida avisou que volta amanhã.'); return 'Ela vai pedir espresso e pão. Capriche no ponto.'; } },
      { t: 'Pedir para ela vir num dia mais calmo', tags: 'Fama ↓ (pouco)', ef: s => { s.rep -= 1; diario('Pedi para a blogueira vir outro dia.'); return '"Não funciona assim." Ela não volta.'; } },
    ] },
  { id: 'esgotamento', quando: 'manha', forcado: true, peso: 'pesado', quem: 'voce', cond: s => s.animo <= 15,
    pre: s => { s.horas = 0; lembra('esgotou', 'tu passou do limite e esgotou'); },
    texto: () => ({ titulo: 'O corpo cobrou', corpo: ['O despertador toca e tu não consegue levantar. A manhã inteira vai embora.'], contexto: 'Ânimo quase zerado. Tu perdeu as horas da manhã.' }),
    escolhas: () => [
      { t: 'Abrir o café mesmo assim', tags: 'Ânimo ↑ (pouco)', ef: s => { s.animo += 20; diario('Esgotei. Perdi a manhã e abri no limite.'); return 'Tu abre. Devagar.'; } },
      { t: 'Ligar para o Caio', tags: 'Ânimo ↑↑ · Caio ↑', req: s => ({ ok: s.caio.afin >= 50, motivo: 'A amizade com o Caio precisa estar próxima' }), ef: s => { s.animo += 40; s.caio.afin += 5; s.estoque.grao += 10; diario('Esgotei. O Caio veio, fez as compras e ficou comigo.', 'esgotou'); return 'Ele chega com pão, grão e nenhuma pergunta.'; } },
      { t: 'Abrir só à tarde', tags: 'Ânimo ↑↑ · metade do dia', ef: s => { s.animo += 45; s.mods.meioDia = true; diario('Esgotei e abri só à tarde.'); return 'Metade do dia, metade da fila.'; } },
    ] },
];
function diretor(quando) {
  const ok = e => e.quando === quando && !S.vistos[e.id] && S.dia >= (e.min || 1) && e.cond(S);
  const forc = EV.filter(e => e.forcado && ok(e)), opc = EV.filter(e => !e.forcado && ok(e));
  const out = forc.slice(0, 2);
  if (out.length < 2 && opc.length && Math.random() < 0.8) {
    let pool = opc;
    if (S.tensao >= 3) { const l = opc.filter(e => e.peso === 'leve'); if (l.length) pool = l; }
    else if (S.tensao <= 0) { const p = opc.filter(e => e.peso === 'pesado'); if (p.length) pool = p; }
    out.push(pick(pool));
  }
  out.forEach(e => { S.tensao = Math.max(0, S.tensao + (e.peso === 'pesado' ? 2 : -1)); });
  return out.map(e => e.id);
}

