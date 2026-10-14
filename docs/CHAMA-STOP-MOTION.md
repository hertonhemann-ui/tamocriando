# Chama em stop motion

A ideia: a chama não é um desenho só que se deforma. Cada quadro é um desenho **diferente**, como se alguém tivesse recortado uma chama em papel de novo a cada foto e passado a 8 por segundo. É o que dá o movimento de fogo de verdade.

## O que já funciona (sem tu fazer nada)

As animações **Acender**, **Assinatura** e **Nome** têm o campo **Chama** com duas opções:

- **stop motion** (padrão): 8 poses geradas por código, cada uma com a língua central e 2 ou 3 laterais em alturas, larguras e inclinações próprias, mais um miolo mais claro. Elas tocam numa ordem que nunca repete a vizinha e a chama ainda treme alguns pixels e gira um pouco a cada quadro, como papel mexendo na mesa.
- **suave**: o desenho da marca deformando devagar (o da V2).

Isso é o "stop motion de código". Fica bom, mas é o que um programa consegue inventar. Com desenhos de verdade fica melhor.

## Com quadros desenhados por IA ou à mão

O motor aceita uma sequência de imagens e passa a usar elas no lugar das poses de código, pintadas na cor da marca.

### 1. Gera os quadros no ChatGPT

Peça **uma imagem só com todos os quadros numa grade** (os quadros saem mais parecidos entre si do que gerando um por vez). Cola isso:

```
Uma folha de animação de chama em stop motion, vista de frente, em grade de 4 colunas por 3 linhas
(12 quadros). Cada quadro é a MESMA chama recortada em papel preto sólido, mas em uma pose diferente:
a língua central muda de altura e de inclinação, as laterais aparecem e somem, a ponta pende ora pra
um lado, ora pro outro. Estilo recorte de papel feito à mão, bordas levemente irregulares, silhueta
chapada, sem degradê, sem contorno, sem fumaça, sem faísca, sem brasa embaixo, sem chão. Fundo branco
liso e uniforme. A base da chama fica na mesma altura em todos os quadros. Quadros do mesmo tamanho,
sem linhas de divisão entre eles, sem texto. Sequência pensada pra rodar em loop a 8 quadros por segundo,
então do quadro 12 pro quadro 1 o movimento tem que emendar.
```

Se a grade sair com 3 colunas ou 2 linhas, tudo bem: o importador pergunta o formato. Se ficar parecida demais (movimento quase imperceptível), pede "poses mais diferentes entre si, línguas laterais mais variadas". Se ficar parecendo desenho de logotipo, pede "irregular, recortado com tesoura".

### 2. Importa

Salva a imagem e roda:

```bash
node tools/importar-chama.mjs grade.png --grade 4x3 --previa chama-previa.png
node tools/build-gallery.mjs
```

Ou, se salvou os quadros um por arquivo numa pasta (`quadro-01.png`, `quadro-02.png`...):

```bash
node tools/importar-chama.mjs pasta-dos-quadros --previa chama-previa.png
```

O importador:

- tira o fundo liso (a cor dos cantos vira transparência; PNG que já tem transparência também serve);
- recorta cada chama, aplica a mesma escala em todas (a variação de altura entre os quadros fica) e alinha pela base;
- grava em `plugin/tamocriando-motion/engine/flame-frames.js` e abre uma prévia na cor da marca pra tu conferir.

Reinstala o plugin no Premiere (o instalador de novo) e as três animações passam a usar os teus quadros. Pra voltar às poses de código: `node tools/importar-chama.mjs --limpar`.

### Dá pra eu fazer isso por ti?

Se tu mandar a imagem gerada aqui no chat, eu rodo o importador, confiro a prévia e ajusto. Eu não consigo controlar o teu computador nem abrir o ChatGPT nele: esta sessão roda numa máquina na nuvem, sem acesso remoto ao teu PC. Gerar a imagem e arrastar pra cá é o trecho que fica contigo.

## Onde ajustar a velocidade

8 quadros por segundo é o padrão de stop motion (13 ou 12 já parece fluido demais). Mudar: `STOP_FPS` em `plugin/tamocriando-motion/engine/core.js`.
