// Converte os roteiros compactos em roteiro.json. Formato por linha: ato|tema|cena|impacto|destaque|texto
import fs from 'node:fs';
const R = {
'o-contrato': ['o contrato que tu assinou sem ler', `gancho|tinta|contrato|1|esforça|te disseram que quem se esforça chega lá.
gancho|tinta||0|esforçou|tu te esforçou.
gancho|tinta||1|chegou|tu não chegou.
inferno|tinta||0|esforço|e não foi por falta de esforço.
inferno|tinta||0||deixa eu ver se eu acerto.
inferno|tinta|olho|0|bom|tu é bom no que faz. bom de verdade.
inferno|tinta|multidao|0|voltam|teus clientes voltam, indicam, agradecem.
inferno|tinta|diplomas|0|estudou|tu estudou. faculdade, curso, outro curso.
inferno|tinta|agenda|0|buraco|e mesmo assim a agenda tem buraco.
inferno|tinta||0||aí tu olha pro lado.
inferno|tinta|fila|0|menos|tem aquele cara que entrega menos que tu.
inferno|tinta|fila|1|lotado|e ele tá lotado.
inferno|tinta||0|mais|tu faz o que te ensinaram: mais um curso, mais um post.
inferno|tinta||0|muda|e nada muda.
virada|papel|contrato|1|contrato|lá atrás tu assinou um contrato.
virada|papel||0|assinou|ninguém te mostrou, mas tu assinou.
virada|papel|contrato|0|esforça|a cláusula mais forte: se esforça que dá certo.
virada|papel||0|cumpriu|tu cumpriu a tua parte.
virada|papel||0|nunca|o problema é que o outro lado nunca assinou.
pagamento|tinta||0|existe|o mercado não sabe que esse contrato existe.
pagamento|tinta||0|falta|teu valor não tá em falta.
pagamento|tinta||1|ilegível.|tá ilegível.
purgatorio|papel||0|controle|e legibilidade tá no teu controle.
fecho|tinta|chama|0|construir|e o esforço começa a construir alguma coisa.`],
'o-cara-lotado': ['o cara que entrega menos e tá lotado', `gancho|tinta|fila|1|lotado|por que o cara que entrega menos que tu tá lotado?
gancho|tinta||0|melhor|ele não é melhor.
gancho|tinta||1|ler|ele é só mais fácil de ler.
inferno|tinta|diplomas|0|melhor|tu passa anos ficando melhor.
inferno|tinta||0|capricho|mais técnica, mais curso, mais capricho.
inferno|tinta||0|comparação|só que melhor é uma comparação.
inferno|tinta|regua|0|quem|melhor do que quem? melhor pra quem?
inferno|tinta|regua|0|régua|tu compete numa régua que o cliente nem enxerga.
virada|papel||1|melhor|o cliente não escolhe quem é melhor.
virada|papel|olho|0|ler|ele escolhe quem ele consegue ler.
virada|papel|camiseta|0|camiseta|pensa numa camiseta de time.
virada|papel||0|estádio|dentro do estádio ela faz sentido.
virada|papel|multidao|0|ninguém|no meio da rua ninguém dá bola.
virada|papel||0|mesma|a camiseta é a mesma.
virada|papel||1|lendo|mudou quem tá lendo.
pagamento|tinta||0|melhor|o cara lotado não é melhor que tu.
pagamento|tinta||1|legível.|ele só é legível.
pagamento|tinta||0|aí|tua técnica já tá aí.
pagamento|tinta||0|tradução|o que falta é tradução.
purgatorio|papel||0|depende|e traduzir não depende do mercado.
purgatorio|papel|lupa|0|cliente|começa pela palavra que o teu cliente usa.
purgatorio|papel||0|tuas|não pelas tuas.
fecho|tinta|chama|0|lido|valor tu já tem. agora ele precisa ser lido.`],
'o-preco': ['o preço fala antes de ti', `gancho|tinta|prato|1|caro|por que tu paga caro num restaurante?
gancho|tinta||0|comida|e não é pela comida.
gancho|tinta||0|arroz|o arroz é arroz em qualquer lugar.
inferno|tinta|etiqueta|0|barato|agora pensa em quem cobra barato.
inferno|tinta||0|triste|cobrou barato e ficou triste.
inferno|tinta||0|agenda|achou que o preço baixo ia encher a agenda.
inferno|tinta|multidao|0|regateia|encheu de gente que regateia.
inferno|tinta|etiqueta|1|falou|e o preço baixo falou antes de tu.
virada|papel|etiqueta|1|lê|preço é a primeira coisa que o cliente lê.
virada|papel|diplomas|0|diploma|antes do teu diploma.
virada|papel||0|cuidado|antes do teu cuidado.
virada|papel||0|boca|antes de tu abrir a boca.
pagamento|tinta|prato|1|comida|o restaurante não vende comida.
pagamento|tinta||0|sentir|vende o que dá pra sentir antes.
pagamento|tinta||0|também|tu também vende isso.
pagamento|tinta|olho|0|mostra|só que tu entrega e não mostra.
purgatorio|papel||0|gritar|mostrar não é gritar.
purgatorio|papel|porta|0|muda|é deixar claro o que muda na vida dele.
purgatorio|papel||0|pergunta|quando fica claro, o preço deixa de ser a pergunta.
purgatorio|papel||0|consequência|vira consequência.
fecho|tinta|chama|0|lido|preço é o que sobra de um valor bem lido.`],
'o-cliente-emprestado': ['o cliente que não é teu', `gancho|tinta|porta|1|teu|de quem é o teu cliente?
gancho|tinta||0|indicação|se a agenda vive de plataforma, convênio ou indicação...
gancho|tinta||1|teu|o cliente não é teu.
inferno|tinta||0|emprestado|é emprestado.
inferno|tinta||0|bem|tu atende bem.
inferno|tinta||0|gosta|ele gosta de ti.
inferno|tinta|fila|0|some|e some quando a plataforma muda a regra.
inferno|tinta||0|para|ou quando a indicação para.
inferno|tinta|agenda|1|zero|e tu volta pro zero.
inferno|tinta||0|cansa|cansa, né?
virada|papel||1|reputação|tu construiu a reputação de outro.
virada|papel|etiqueta|0|plataforma|o nome que aparece é o da plataforma.
pagamento|tinta|olho|1|reconhece|cliente teu é o que te reconhece.
pagamento|tinta||0|página|antes de abrir qualquer página.
pagamento|tinta|lupa|0|problema|pelo jeito que tu fala o problema dele.
pagamento|tinta|porta|0|desligar|isso ninguém consegue desligar.
purgatorio|papel||0|pequeno|começa pequeno.
purgatorio|papel|contrato|0|palavras|escreve o problema do teu cliente com as palavras dele.
purgatorio|papel||0|tuas|não com as tuas.
purgatorio|papel||0|semana|e diz isso em voz alta, toda semana.
fecho|tinta|chama|0|emprestada|aos poucos a agenda deixa de ser emprestada.`],
'quem-ensina-a-vender': ['tu desconfia de quem ensina a vender', `gancho|tinta|lupa|1|desconfia|tu desconfia de quem ensina a vender?
gancho|tinta||0|certo|tá certo em desconfiar.
gancho|tinta||0|também|eu também desconfio.
inferno|tinta||0|mentoria|tem mentoria que só vende mentoria.
inferno|tinta||0|etapas|empacota em trocentas etapas.
inferno|tinta||1|prometer|promete o que ninguém pode prometer.
inferno|tinta||0|pagou|e tu já pagou por isso uma vez.
inferno|tinta||0|colega|ou viu um colega pagar.
inferno|tinta||0|tudo|aí fecha o olho pra tudo.
virada|papel||1|continua|só que o problema continua lá.
virada|papel|agenda|0|buraco|agenda com buraco.
virada|papel|fila|0|indicação|cliente que só chega por indicação.
pagamento|tinta||1|inteligência|desconfiar é inteligência.
pagamento|tinta||0|parar|o erro é parar de procurar.
pagamento|tinta||0|venda|porque o problema não é de venda.
pagamento|tinta|olho|1|leitura.|é de leitura.
purgatorio|papel||0|método|antes de qualquer método, uma pergunta.
purgatorio|papel|porta|0|escolher|o que muda na vida dele se não te escolher?
purgatorio|papel||0|método|se tu não sabe responder, método nenhum ajuda.
purgatorio|papel||0|começar|se sabe, tu já tem por onde começar.
fecho|tinta|chama|0|teu|desconfia. e começa pelo que é teu.`]
};
for (const [id, [titulo, corpo]] of Object.entries(R)) {
  const falas = corpo.split('\n').map((l) => { const [ato, tema, cena, imp, dest, ...t] = l.split('|'); return { ato, tema, ...(cena ? { cena } : {}), ...(imp === '1' ? { impacto: true } : {}), destaque: dest, texto: t.join('|') }; });
  fs.mkdirSync(`estudio/producoes/${id}`, { recursive: true });
  fs.writeFileSync(`estudio/producoes/${id}/roteiro.json`, JSON.stringify({ versao: 2, id, titulo, bpm: 92, falas }, null, 1));
}
