# Referências e engenharia reversa

O que foi pesquisado pra texto, transições e câmera, o que cada técnica faz por baixo e como virou animação aqui. A pesquisa achou mais tutorial de ferramenta do que análise de estilo; onde a fonte não cobriu, a receita está marcada como **deduzida** (feita a partir de como o efeito se comporta, sem tutorial por trás).

## Texto

### Entradas de texto (templates Legenda, Destaque e Manchete)

| Efeito no banco | Como se faz em editor | O que acontece por baixo | Fonte |
|---|---|---|---|
| **foco** (desfocado → nítido) | Animador de texto no After Effects com Blur + Opacidade, e o Range Selector com *Offset* animado. Shape *Ramp Up* faz a nitidez varrer o texto; ordem aleatória muda quem foca primeiro. | O desfoque cai de ~28% do tamanho da fonte a zero, a opacidade sobe mais rápido (1,5×) e a escala assenta de 106% a 100%. A pessoa lê "alguém puxou o foco da lente". | [Photofocus](https://photofocus.com/software/tutorials-software/how-to-create-blur-reveal-in-after-effects/) |
| **tracking** | Animar o espaçamento entre letras (Tracking) de aberto pra normal junto com opacidade. **Deduzida.** | Espaçamento começa em 28% do tamanho e fecha; leve desfoque no começo. | — |
| **subida** (máscara) | Texto sobe de dentro de uma máscara de linha. **Deduzida** a partir do vocabulário de *reveals* usado nos cursos. | O texto é cortado pela caixa da linha e sobe 95% do tamanho até assentar. | [Skillshare](https://www.skillshare.com/classes/Kinetic-Typography-Crash-Course-Create-Motion-Graphic-Text/228166134) |
| **pop** | Escala de ~70% a 100% com *Easy Ease*, com estouro rápido na saída. | 72% → 100% com a curva "faísca" (passa de 1 e volta). É o padrão das legendas virais. | [Kapwing](https://www.kapwing.com/explore/hormozi-style-captions-template), [Filmora](https://filmora.wondershare.com/answers/best-ai-subtitle-tool-per-word-highlight-animation.html) |
| **obturador** | Movimento rápido com *motion blur* ligado (shutter). Nenhuma fonte explicou ângulo ou fase pra texto. | A palavra entra deslizando de longe e deixa 7 cópias de rastro com opacidade decrescente. Com o desfoque de movimento da câmera ligado, o rastro real se soma. | [Tutsplus](https://photography.tutsplus.com/how-to-animate-text-in-after-effects-kinetic-typography--ytc-97c) (suavizar com Easy Ease no editor de gráfico) |
| **cinema** | Fade lento com desfoque e subida pequena. **Deduzida.** | Opacidade em curva suave, desfoque de 14%, subida de 16% e tracking de 10% que fecha. | — |

Regra de andamento que apareceu e que o banco segue: afastar-se da curva padrão e usar entrada rápida e saída lenta ("fast-in, slow-out"), que é a curva **suave** de entrada e **apagar** de saída.

### Legenda de Reels viral

Descrição dos vendedores de ferramentas (então vale como descrição, não como medição): uma palavra por vez, caixa alta, palavra-chave destacada em cor, cada palavra com *pop* ou mudança de cor no instante em que é dita, com sombra e contorno pra ler sobre qualquer imagem.

O que o banco mantém e o que troca:

- **Mantém:** palavra a palavra ou em grupos curtos, o tempo da voz, o *pop* na palavra atual, sombra pra ler.
- **Troca:** caixa alta por minúsculas (o teu padrão), amarelo por brasa, e a cor só em **uma** palavra por tela. Nos vídeos virais tudo disputa atenção; aqui o destaque só vale porque é raro.
- **Dado não confirmado:** uma página afirma 50 ms de precisão no tempo de cada palavra. É marketing, não teste. O plano usa os tempos da transcrição, que valem o que a transcrição valer, e o painel deixa ajustar o campo "tempos".

### Fontes: uma só ou um par

Orientação achada: contraste suficiente pra formar hierarquia e semelhança suficiente pra parecer da mesma família; serifa combina com movimento lento (fade, máscara) e sem serifa com movimento rápido (slide, escala); evitar movimento brincalhão em fonte serifada; o trecho destacado deve ser bem maior ou diferente em peso/estilo. Fontes: [Editframe](https://editframe.com/skills/brand-video-generator/typography-personalities), [Wave.video](https://blog.wave.video/blog/font-pairs/).

As combinações do banco (todas OFL, embutidas no plugin):

| Opção | Principal | Complemento | Quando |
|---|---|---|---|
| Anton | Anton | Inter | legenda forte, tese seca |
| Bebas Neue | Bebas Neue | Inter | manchete limpa |
| Instrument Serif | Instrument Serif | itálico dela mesma | frase calma, citação |
| Inter | Inter 800 | Inter 500 | texto neutro de apoio |
| **Bebas + Instrument itálico** | Bebas Neue | Instrument Serif itálico | o par mais editorial: palavra grande seca, complemento macio |
| Anton + Inter | Anton | Inter | padrão da marca |
| Instrument + Inter | Instrument Serif | Inter | título elegante com apoio limpo |
| DM Serif + Inter | DM Serif Display | Inter | clássico, peso |
| Inter + Caveat | Inter 800 | Caveat (manuscrito) | anotação, tom pessoal |

## Transições

Resultado da pesquisa e receita equivalente no banco. As passagens do banco são **overlays**: cobrem a tela no meio e descobrem o próximo clipe, então não conseguem borrar nem deslocar a imagem de verdade. Onde isso importa, abaixo tem a receita pra fazer a versão "em cima do vídeo" no Premiere.

| Técnica | Como é feita (achado) | No banco | Receita no Premiere pra versão real |
|---|---|---|---|
| **Whip pan** | Uma camada de ajuste com **Offset** (Distorcer) animado do centro pro lado oposto + **Directional Blur** em 90°, com o desfoque chaveado em volta do corte. Variante: **Push** + Directional Blur. | **Varrida**: cortina de tinta com borda suave e linhas de velocidade. O meio é tela cheia. | Camada de ajuste sobre o corte; Offset de 0 a ±100% do quadro em ~8 frames; Directional Blur 90° de 0 a 60 e volta; os dois picos no corte. Fontes: [tutvid](https://tutvid.com/premiere-pro/whip-pan-blurring-transition-effect-premiere-pro/), [No Film School](https://nofilmschool.com/2018/04/watch-how-pull-stylish-whip-pan-transition-adobe-premiere-pro). |
| **Light leak** | Clipe de vazamento de luz com modo de mistura **Screen** (tira o preto); alinhar o clarão mais forte ao momento do corte. | **Clarão**: manchas de luz quente que crescem e estouram. Sem amarelo: a luz vai de brasa a pêssego. | Clipe de light leak por cima do corte, Screen, o pico de brilho no frame do corte. Fonte: [tutvid](https://tutvid.com/premiere-pro/create-light-leak-transition-premiere-pro/). |
| **Glitch** | Clipe de glitch como **Track Matte Key** sobre o corte: o glitch revela um clipe através do outro. | **Não implementada**: depende de mostrar os dois clipes, e o banco só produz overlay. Entra como proposta (ver planos). | Glitch em cima do corte, Track Matte Key no clipe de baixo. Fonte: [Epidemic Sound](https://epidemicsound.com/blog/5-adobe-premiere-pro-transition-effects/). |
| **Papel rasgado** | **Deduzida.** Folha que cobre com borda irregular. | **Rasgo**: campo de ruído de baixa amplitude pra borda, fibras claras no limite, sombra projetada. | — |
| **Fatias** (stagger de faixas) | **Deduzida.** Barras que fecham com atraso crescente. | **Fatias**: n faixas, atraso de 0 a 50%, só a primeira com borda em brasa. | — |
| **Queima e Sopro** | Originais do banco (símbolo da cinza à brasa). | **Queima**, **Sopro**. | — |

**Não achei** tutorial de luma fade, zoom e displacement transition; a pesquisa só retornou pacotes prontos (Motion Array). Os que fizerem falta entram como proposta, sem receita inventada.

## Câmera

| Controle | O que é | Como está feito |
|---|---|---|
| **Turbulência** | Equivalente ao *Turbulent Displace* do After Effects: deslocar os pixels por um campo de ruído que evolui no tempo. | Ruído de valor com 3 oitavas no shader, deslocamento até 3,5% do quadro, tempo quantizado em 12 por segundo pra tremer como stop motion (suave não é o efeito pedido). Tamanho do ruído fixo em escala média. |
| **Desfoque de borda** | Olho de lente: centro nítido, bordas saindo de foco. | 16 amostras em espiral (ângulo áureo) com raio que cresce com o quadrado da distância ao centro (a partir de 32% do raio): natural, sem anel. Em 55% já parece lente de cinema. |
| **Ruído** | Grão de filme que muda a cada quadro. | Duas camadas de ruído (uma na metade da escala, pro grão não ficar só fino), 24 variações por segundo, aplicado só onde existe imagem: overlay transparente continua limpo. |
| **Desfoque de movimento** | Obturador. | Média corrente de N instantes dentro de 180° (N = 3 na prévia e 6 no render). *Bug achado e corrigido:* somar com `lighter` a 1/N arredondava o glow fraco pra cima e desenhava um anel em volta do texto. |
| **Aberração e lente** | Separar R/B nas bordas e distorção de barril. | Shader; a aberração só aparece onde há movimento (máscara de diferença entre dois instantes). |

Atalhos prontos: **padrão** (como era), **cinema** (borda 55 + grão 22 + aberração leve), **tremido** (turbulência 35), **sujo** (tudo um pouco), **limpo** (nada).
