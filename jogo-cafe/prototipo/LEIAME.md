# Protótipo dos 5 dias (v4)

Link jogável: https://claude.ai/artifact/SSGaFWTBBeJBKVcKaKTJtr

## Como o código está organizado

O jogo é um arquivo único (`index.html`), mas ele é **montado** a partir de partes em `src/`:

```
./build.sh        # junta src/* (ordem alfabética) em index.html
```

Edite sempre os arquivos de `src/` e rode `./build.sh`. Os números mostram a ordem:

| Faixa | Conteúdo |
|---|---|
| `00` | CSS, HTML e abertura do script |
| `10`–`16` | ícones, som, dados (receitas, móveis, estilos), estado, metas, eventos, ações |
| `20`–`25` | sprites, efeitos, **isométrico**, **sala estática**, rua, **cena do café** |
| `30`–`32` | expediente: clientes e mesas, atores e tarefas, laço |
| `40`–`45` | painel de trabalho, mapa, modais, menu e salvamento, fluxo do dia, **loja de móveis** |
| `50` | laço principal |

Para depurar no navegador, abra o `index.html` com `#debug` na URL e use `__cafe("S.caixa")` no console.

## Direção de arte (v4.1)

Referências: Stardew Valley (mundo com textura e cores quentes), Sea of Stars (sombras de borda dura, contorno colorido) e uma cena de interior escuro (luz quente sobre ambiente azulado, grão de filme, bagunça nos cantos).

| Técnica | Onde está |
|---|---|
| Sombras projetadas de verdade: cada objeto e pessoa vira um polígono deslocado para longe da luz, desenhado num canvas à parte e aplicado uma vez só (sem escurecer duas vezes) | `22-iso.js` (`comSombras`, `sombraVolume`), usado em `23-sala.js` e `25-cena.js` |
| Chão e parede com ruído determinístico, veios de madeira e rejunte | `23-sala.js` |
| Correção de cor por multiplicação (quente de dia, azulada no fim) e luzes aditivas por cima | `25-cena.js` (`corGrade`) |
| Grão de filme animado e vinheta | `25-cena.js` (`grao`) |
| Contorno colorido, ciclo de caminhada e braços que balançam | `20-pixel.js` |
| Rua em vista de cima com telhados, sombras à direita, cobblestone, fumaça, aves e sombra de nuvens | `24-rua.js` |
| Bagunça: sacos de café, pisca-pisca, capacho e um gato que dá ânimo se tu clicar | `23-sala.js`, `25-cena.js` |

## O que mudou na v4

**Visual 2.5D.** O café agora é desenhado em projeção isométrica 2:1 (tile 32×16), com profundidade de verdade:
- caixas com três faces sombreadas (luz vem do alto à esquerda), sombras no chão deslocadas para longe da luz;
- ordenação por profundidade: quem está atrás do balcão aparece escondido por ele, quem está na frente aparece sobre ele;
- janelas projetam luz no chão, lâmpadas pendentes brilham, o céu da janela muda ao longo do expediente, vinheta nas bordas;
- polígonos desenhados linha a linha, sem suavização, pra manter o pixel nítido.

**Personagem que anda (vibe Overcooked).**
- Cada tarefa leva o personagem fisicamente até o lugar: moedor, forno, balcão, mesa.
- Dá pra clicar nos objetos da cena (moedor, forno, mesa, cliente) ou nos botões do painel. Os dois fazem a mesma coisa.
- Tu pode **enfileirar** até 5 tarefas; ele faz na ordem. Cada uma na fila tem um × pra cancelar.
- O ponto perfeito só começa quando ele chega na estação.
- Depois de entregar, o balcão e a cozinha têm um corredor: quem vai à mesa passa pela abertura do lado direito.

**Mesas e clientes sentados.**
- Cliente de balcão: chega, pede na hora, espera de pé, paga ao receber. O pedido só aparece **depois que ele chega** (antes dava pra entregar com ele ainda entrando).
- Cliente de mesa: chega, senta, **tu anota o pedido**, prepara, **serve na mesa**, ele come, paga, e a mesa fica **suja**. Ninguém senta numa mesa suja até alguém limpar.
- Quem senta pede mais (1 a 3 itens), espera mais e deixa mais gorjeta. Mas custa três idas ao salão.
- As mesas abrem no dia 2. Dia 1 continua só com balcão, pra aprender.

**Móveis & Cia (Dona Nair)**, aberta na noite do dia 2:
- 6 posições de mesa. Cada uma tem **mesa** e **cadeira**, escolhidas separadamente.
- 7 modelos de mesa e 7 de cadeira, cada um com atributos: **Conforto** (clientes esperam mais e dão gorjeta), **Aconchego** (ficam mais e às vezes pedem sobremesa), **Charme** (rende mais fama) e **Giro** (comem rápido e liberam a mesa).
- Decoração: pintura da parede, piso, quadro e planta.
- Trocar uma peça devolve 50% do valor da antiga.

**Estilo do café (a marca).** Toda peça tem um estilo (Rústico, Moderno, Vintage ou Verde). Quando um estilo domina (pelo menos 50% e 4 peças), o café ganha uma identidade com bônus:

| Estilo | Efeito |
|---|---|
| Rústico | Clientes esperam 15% mais; mesas dão R$ 1 a mais de gorjeta |
| Moderno | 10% mais clientes; quem senta come 15% mais rápido |
| Vintage | Fama por cliente sobe 30% |
| Verde | Clientes esperam 10% mais; tu dorme com +6 de ânimo |
| Eclético | Sem identidade: só 5% mais clientes curiosos |

O estilo aparece na ficha ao lado, no epílogo e na fala da Dona Nair. Equipamentos também contam: moedor elétrico e máquina de dois grupos puxam pro Moderno; o coador artesanal puxa pro Rústico.

**Outras coisas.**
- Coador artesanal (R$ 45 no Fornecedor) libera o **Café coado**: mais lento, mas artesanal e rende fama extra.
- A Bia ganhou um quarto papel: **salão** (anota, serve e limpa as mesas). Ela agora também anda pelo café.
- Metas novas quando há mesas: "servir clientes sentados" e "limpar mesas".
- A Dona Lúcia adota uma poltrona se tiver uma.

## Atalhos

`Q` espresso · `W` cappuccino · `E` mocha · `T` coado · `1`–`4` etapa de mão no preparo · `espaço` acertar o ponto · `F` assar · `Z X C V B` agir sobre os cartões · `Esc` menu

## Referências usadas

| Fonte | Ideia | Onde entrou |
|---|---|---|
| Guias de renderização isométrica | Projeção 2:1 e ordenação por profundidade com sprites em pé | Cena do café, balcão em segmentos para ordenar com clientes |
| Análise de jogos de atendimento (Treanor e Nelson) | O núcleo é entregar o serviço antes do contador de espera acabar | Pedido, espera, entrega e limpeza como ciclo |
| Análises do Overcooked | Mover o personagem custa tempo, e isso faz o layout importar | Personagem que anda, fila de tarefas, corredor atrás do balcão |
| Two Point Hospital | Itens decorativos mudam atributos da sala | Atributos das peças e estilo do café |

## Como testar

1. O tutorial deixou claro que o personagem anda e que dá pra clicar nas coisas?
2. Tu enfileirou tarefas? Deu pra planejar?
3. Valeu a pena ter cliente sentado? Em que momento virou bagunça?
4. Qual estilo tu escolheu? Por quê?
5. Dava vontade de jogar mais um dia?
