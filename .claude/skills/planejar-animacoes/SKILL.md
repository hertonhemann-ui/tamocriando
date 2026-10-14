---
name: planejar-animacoes
description: Lê a transcrição de um vídeo (SRT, VTT ou texto com tempos) e monta o plano de animações do Tamo Criando Motion, com o tempo e o texto de cada animação, e propõe animações novas quando o banco não cobre o trecho. Use quando pedirem plano de animações, onde usar cada animação, legendar um vídeo com o banco, analisar uma transcrição ou sugerir animações novas.
---

Transforma a transcrição de um vídeo em um **plano** (`plano.json`) que o painel do Premiere lê e insere nos tempos certos. Os caminhos abaixo são a partir da raiz do repositório.

A decisão (qual animação, onde, com que texto) é tua. As ferramentas só cuidam do que se checa sem opinião: ler a transcrição, validar e desenhar o storyboard.

## Fluxo

1. **Ler a transcrição**
   ```bash
   node tools/plano.mjs ler <transcricao.srt> --out /tmp/transcricao.json
   ```
   Aceita SRT, VTT e texto com linhas `00:12 fala`. Texto corrido sem tempos precisa de `--duracao <segundos>` (os tempos viram estimativa). O JSON traz `frases` com o início de cada palavra.
2. **Pergunta o que faltar**, só se mudar o plano: formato (9:16 padrão), estilo (Reels de rosto, aula, depoimento) e onde ficam os cortes do vídeo (pra encaixar as passagens). Sem os cortes, passagem entra no fim de frases e o `porque` avisa.
3. **Segue `tools/plano-instrucoes.md`**: é o roteiro completo (passos, regras de tempo, formato do JSON). Lê também:
   - `plugin/tamocriando-motion/engine/sinais.json`: pra cada animação, os sinais na fala que pedem ela e quando evitar;
   - `node tools/plano.mjs prompt /tmp/transcricao.json --out /tmp/prompt.md`: gera o catálogo atual (campos, opções, durações) já junto com a transcrição. Usa esse arquivo como fonte dos campos, nunca a memória.
4. **Escreve `plano.json`** (formato em `docs/exemplos/plano-exemplo.json`).
5. **Valida e corrige até zerar os erros**:
   ```bash
   node tools/plano.mjs validar plano.json --transcricao /tmp/transcricao.json
   ```
   Erros param o plano (id ou opção inexistente, animação curta demais, duas telas cheias juntas). Avisos são decisão tua: corrige ou explica no `porque`.
6. **Storyboard** pra mostrar:
   ```bash
   node tools/plano.mjs storyboard plano.json --transcricao /tmp/transcricao.json --out storyboard.html
   ```
   Publica como Artifact quando a pessoa for ver ou mandar pra alguém.
7. **Entrega**: o `plano.json` e um resumo curto (quantas animações, as propostas novas, o que ficou de fora e por quê). Diz que no painel do Premiere é *Plano › colar o JSON › Inserir as marcadas*.

## O que importa

- **Como o outro entende** manda em tudo: se a animação só enfeita, não entra. Prefira menos animações com respiro.
- **Sinais, não palavras.** "E se...?" pede Pergunta; "não é X, é Y" pede Cinza × Brasa. Ninguém precisa dizer o nome da animação.
- **Texto das animações vem da fala**, em minúsculas, observando e não mandando; nunca explica o símbolo da cinza e da brasa; uma palavra em brasa por tela.
- **Legenda**: preenche `tempos` (segundos desde o início da animação, um por palavra). Calcula a partir de `frases[].palavras[].t` menos o `t` da animação.
- **Passagens**: `t` = corte − `dur` × `cut` (o meio da animação cai no corte).
- **Lacunas viram `novas`**, não animação forçada. Cada uma diz o que mostra, em qual animação se baseia, que campos teria e a prioridade. Quem pediu o plano escolhe quais viram animação de verdade; aí é um template novo em `plugin/tamocriando-motion/engine/templates/` (veja o README, "Criar uma animação nova") e uma linha em `engine/sinais.json`.
- **Número sempre com fonte no rótulo**; **final sem pedido** (Assinatura); **no máximo 2 animações ao mesmo tempo**.

## Quando o catálogo mudar

Se um template novo entrar ou um campo mudar, `engine/sinais.json` precisa de uma entrada pra ele (o smoke test cobra) e `node tools/plano.mjs prompt ...` já reflete o catálogo novo sozinho.
