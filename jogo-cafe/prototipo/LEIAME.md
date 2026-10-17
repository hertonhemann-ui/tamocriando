# Protótipo dos 5 dias (v2)

Arquivo único (`index.html`), roda no navegador. Link jogável: https://claude.ai/artifact/SSGaFWTBBeJBKVcKaKTJtr

## O que mudou da v1 para a v2

| Problema na v1 | Como ficou |
|---|---|
| Andar e carregar item era chato | Bancada com **espaços de preparo**. Tu escolhe a receita e segue as etapas pelos botões |
| Um pedido por vez, sem tempo | Começa com **2 espaços em paralelo**. Melhorias: 3º e 4º espaço, máquina de 2 grupos, moedor elétrico |
| Item errado não tinha onde ficar | **Bandeja** (4 lugares, melhoria para 7). O que está nela vai para quem pedir. **×** joga fora |
| Não dava pra ver em que etapa estava | Cada preparo mostra as **etapas** (Moer → Extrair → Vaporizar) e qual é a próxima |
| Sem tutorial | **Dona Cida**, a antiga dona, ensina no dia 1, passo a passo, com o tempo parado |
| Muita decisão logo de cara | Dia 1 só aprende. **Fornecedor e melhorias** no dia 2, **preços** no dia 3 |
| Pouco contexto para decidir | Quadro "Hoje" com previsão de clientes e ingredientes; eventos com **contexto** e com **quem é afetado** em cada escolha |
| Visual genérico | Pixel art estilo Punch Club: barras de Energia e Ânimo, rua do bairro como mapa, ações mostrando o que sobe e desce |

## Como funciona

- **Manhã (6h–9h)** e **noite (18h–22h)**: tu toca nos lugares da rua (Casa, Fornecedor, Café, Praça, Bar, Grão Nobre). Cada ação gasta horas e mexe em barras, habilidades ou pessoas.
- **Expediente**: pedidos no topo, bancada no meio, bandeja embaixo. Moer e vaporizar ocupam **tuas mãos**; extrair e assar rodam sozinhos. A máquina só extrai um café por vez, até comprar a de dois grupos.
- **Energia** cai trabalhando e volta dormindo. Abaixo de 30, tuas mãos ficam lentas.
- **Ânimo** cai com fila grande e cliente irritado, sobe com descanso, amigos e clientes satisfeitos. Quase zerado, tu esgota na manhã seguinte.
- **Bia** (se contratada) cuida de uma função: forno, moedor ou balcão.

Atalhos no teclado: `Q` espresso, `W` cappuccino, `1`–`4` etapa de mão no preparo, `F` assar, `Z X C V B` entregar, `P` pausar.

## Cadeias de consequência que dá pra provocar

- Recusar a Bia no dia 1 → no dia 3 ela aparece no Grão Nobre e o rival puxa parte da tua fila.
- Contratar e nunca aliviar a Bia → ela pede ajuda → pedir pra aguentar pode levar ela pro Rafa.
- Preço alto com a Dona Lúcia → ela reclama → manter o preço derruba a relação → ela some.
- Caminhar com a Dona Lúcia → ela conta da padaria que fechou → oferece trazer o grupo de crochê.
- Sumir das noites com o Caio → ele avisa que o Rafa chamou pra tocar → promessa quebrada = show no rival.
- Pedir leite ao Rafa → ele cobra o favor quando propõe comprar teu pão de queijo.
- Trabalhar sem cuidar do ânimo → esgotamento → perde a manhã.

## Como testar

Peça pra outra pessoa jogar sem explicação. Depois pergunte:

1. O tutorial deixou claro o que fazer? Em que passo travou?
2. Em que momento tu quis abrir o café de novo?
3. Comprou alguma melhoria? Sentiu diferença?
4. Abriu mão de dinheiro por descanso ou por alguém?
5. Me conta tua semana.

## Ajustes rápidos (topo do `<script>`)

| Constante | Valor | Efeito |
|---|---|---|
| `DAY_LEN` | 180 | Duração do expediente em segundos |
| `RECEITAS` | — | Etapas e tempos de cada bebida |
| `MELHORIAS` | — | Preço e efeito de cada melhoria |
| `ALUGUEL` / `SAL` | 40 / 35 e 20 | Custos fixos |
| `previsao()` | 18 × demanda | Clientes por dia (dia 1 tem 55%) |
