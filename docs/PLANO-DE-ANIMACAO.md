# Do vídeo ao plano de animações

A ideia: tu entrega a **transcrição** do vídeo e recebe um **plano**, uma lista de animações com o segundo em que cada uma entra, o texto que ela leva e o motivo. O plano entra no painel do Premiere e as animações vão pra timeline nos tempos certos.

O plano não se limita ao banco. Quando a fala pede uma coisa que não existe (um termômetro de zero a dez, por exemplo), ele descreve a animação nova e tu decide se vale criar.

Pensa num montador experiente lendo o roteiro com um marcador na mão: ele não procura palavras, procura *momentos* (a pergunta que prende, a crença que cai, o caminho que começa). É isso que o sistema faz.

## Como funciona

```
transcrição (.srt / .vtt / texto com tempos)
        │   node tools/plano.mjs ler
        ▼
transcrição normalizada (frases + início de cada palavra)
        │   Claude lê com as regras (tools/plano-instrucoes.md),
        │   os sinais (engine/sinais.json) e o catálogo atual
        ▼
plano.json  ───►  node tools/plano.mjs validar    (erros e avisos)
        │      ───►  node tools/plano.mjs storyboard  (quadro de cada animação + linha do tempo)
        ▼
painel do Premiere › Plano › Inserir as marcadas nos tempos do plano
```

Duas formas de usar:

1. **Com o Claude Code neste repositório:** manda a transcrição e pede "monta o plano". A skill `planejar-animacoes` faz o fluxo todo e te devolve o `plano.json` e o storyboard.
2. **Sem o Claude Code:** `node tools/plano.mjs prompt transcricao.srt --out prompt.md` gera o pedido completo (regras, catálogo, sinais, transcrição). Cola num chat com o Claude, salva a resposta (só o JSON) como `plano.json` e segue pro `validar`.

Um terceiro caminho, **automático**, ligaria a ferramenta direto na API do Claude pra gerar o plano com um comando só. Não está feito porque exige chave de API tua e eu não tenho como testar daqui. A estrutura já está pronta: seria só chamar a API com o conteúdo do `prompt.md`.

## O que o sistema entende

Cada animação do banco tem, em `engine/sinais.json`:

- **momento**: reconhecimento, alívio, indignação, esperança, identidade ou determinação;
- **sinais**: o que na fala pede essa animação (pergunta retórica, "não é X, é Y", estatística, enumeração, etc.);
- **evita**: quando não usar;
- **dica**: como preencher os campos.

Regras gerais que o validador cobra: tempo de leitura (0,3 s por palavra + 1 s), no máximo 8 animações chamativas por minuto, no máximo 2 ao mesmo tempo, uma palavra em brasa por tela, abrir Reels sem vinheta, fechar sem pedido, o meio das passagens caindo nos cortes.

## O formato do plano

Exemplo completo: [`docs/exemplos/plano-exemplo.json`](exemplos/plano-exemplo.json), feito a partir de [`transcricao-exemplo.srt`](exemplos/transcricao-exemplo.srt). Resumo:

```json
{
  "versao": 1,
  "video": { "titulo": "...", "duracao": 63.3, "formato": "9:16", "estilo": "reels", "cortes": [21.9, 31.9, 47.8] },
  "cenas": [ { "t": 0, "fim": 13, "momento": "reconhecimento", "resumo": "..." } ],
  "cues": [
    { "id": "c01", "t": 0.2, "dur": 4.7, "animacao": "pergunta",
      "params": { "pergunta": "quanto te custa não fazer o que tu ama?", "destaque": "te custa" },
      "fala": "...", "sinal": "pergunta retórica de abertura", "porque": "...", "confianca": 0.95, "alternativas": ["palavra-acesa"] }
  ],
  "novas": [
    { "id": "n01", "t": 22.2, "dur": 3.2, "nome": "Termômetro", "porque": "...", "descricao": "...", "baseEm": "numero", "campos": ["valor (0 a 10)"], "prioridade": "alta" }
  ]
}
```

- `t` é em segundos a partir do início do vídeo. No painel tu diz onde o vídeo começa na sequência (campo "Início do vídeo na sequência"), e tudo é somado.
- `params` usa os mesmos campos do painel. Campo inexistente ou opção inválida o validador acusa.
- `novas` não entram na timeline: são propostas.

## Validar e ver

```bash
node tools/plano.mjs validar plano.json --transcricao transcricao.json
node tools/plano.mjs storyboard plano.json --transcricao transcricao.json --out storyboard.html
```

O storyboard abre no navegador: linha do tempo com as animações por categoria, um card por animação (o quadro, a fala, o porquê, os avisos) e, no fim, as propostas novas. O exemplo pronto: [`docs/exemplos/plano-exemplo.storyboard.html`](exemplos/plano-exemplo.storyboard.html).

## No painel do Premiere

1. Abre a sequência do vídeo.
2. Painel › **Plano**. Abre o `plano.json` (ou cola o texto) e clica em **Ler plano**.
3. Cada animação aparece com tempo e fala. As que têm problema (id que não existe, opção inválida) ficam desmarcadas e com o motivo.
4. Preenche **Início do vídeo na sequência** (ou usa o playhead).
5. **Só pôr marcadores** cria um marcador por animação na sequência, com a fala e o porquê. Útil pra revisar antes de gastar render.
6. **Inserir as marcadas** renderiza cada uma (com os ajustes de câmera salvos pra ela) e coloca na primeira trilha livre, no tempo certo.

## Como uma proposta nova vira animação

1. O plano traz em `novas` o que a animação mostra, os campos e em qual animação se baseia.
2. Tu escolhe quais fazem sentido.
3. Pede pro Claude criar. Ele escreve o template em `engine/templates/`, acrescenta a entrada em `engine/sinais.json` e pronto: ela aparece no banco, no painel, na galeria e nos próximos planos.

Quanto mais planos tu faz, mais o banco cresce no que tu realmente usa.
