# Como montar o plano de animações

Tu recebe a transcrição de um vídeo e devolve um **plano**: uma lista de animações com o momento exato em que cada uma entra, o que escrever nela e por quê. O plano não se limita ao banco: quando a fala pede uma animação que não existe, tu descreve ela como proposta nova.

A regra que manda em tudo: **é sempre como o outro entende.** Cada animação existe pra ajudar quem assiste a entender e levar embora. Se ela só enfeita, não entra.

## Passo a passo

1. **Lê a transcrição inteira antes de escolher qualquer coisa.** Descobre o assunto, o tom e o ritmo do vídeo (Reels de rosto, aula, depoimento).
2. **Marca os momentos de quem assiste**, na ordem em que acontecem: reconhecimento, alívio, indignação, esperança, identidade, determinação. Nem todo vídeo tem os seis. Anota em `cenas` onde cada um começa e termina.
3. **Procura sinais, não palavras.** Cada animação do catálogo tem `sinais` (o que na fala pede ela) e `evita` (quando não usar). Uma pergunta retórica pede Pergunta mesmo que ninguém diga "pergunta". Um "não é X, é Y" pede Cinza × Brasa.
4. **Escolhe a menor quantidade que resolve.** Vídeo de 60 s comporta até 8 animações chamativas, e tem que sobrar respiro. Legenda e passagens não contam nesse limite, mas passagem só entra onde existe corte de verdade.
5. **Preenche os campos com a fala**, não com texto inventado:
   - texto principal em minúsculas (maiúsculas só em rótulos pequenos);
   - frases que observam, não que mandam ("disciplina forçada é o que sobra quando a devoção foi embora", nunca "tu precisa ter devoção");
   - nunca explica o símbolo da cinza e da brasa: ele aparece no material, não no texto;
   - uma só palavra em brasa por tela.
6. **Acerta o tempo.**
   - `t` = começo da fala que a animação acompanha, menos 0,1 s (a animação chega junto da voz);
   - `dur` = o maior entre a duração mínima da animação e o tempo de leitura (0,3 s por palavra + 1 s); pergunta ganha 1,5 s extras de respiro;
   - Legenda: preenche `tempos` com o início de cada palavra (vem da transcrição);
   - passagens: `t` = tempo do corte − `dur` × `cut` (o meio da passagem cai no corte). Se não souber onde estão os cortes, usa o fim de uma frase e avisa em `porque`.
7. **Evita colisões.** No máximo 2 animações ao mesmo tempo. Duas animações de texto no centro ao mesmo tempo, nunca. Fechamento: só Assinatura, sem pedido de seguir/salvar/comentar.
8. **Descobre o que falta.** Se um trecho pede algo que o banco não tem (ex.: um termômetro de morno a quente quando a pessoa diz "de 0 a 10"), não força uma animação errada: descreve em `novas` com o que ela mostra, qual campo ela teria e em qual animação existente se baseia. Quem decide se vira animação de verdade é quem pediu o plano.
9. **Explica cada escolha em uma linha** (`porque`) e diz qual sinal da fala motivou (`sinal`). Se estiver em dúvida entre duas, coloca a segunda em `alternativas`.

## Formato de saída

Devolve só um JSON, sem texto em volta:

```json
{
  "versao": 1,
  "video": { "titulo": "...", "duracao": 62.4, "formato": "9:16", "estilo": "reels", "cortes": [12.3, 31.0] },
  "cenas": [ { "t": 0, "fim": 8, "momento": "reconhecimento", "resumo": "..." } ],
  "cues": [
    {
      "id": "c01",
      "t": 0.3,
      "dur": 4.5,
      "animacao": "palavra-acesa",
      "params": { "linha1": "o morno", "destaque": "não marca", "linha2": "ninguém." },
      "fala": "o morno não marca ninguém",
      "sinal": "frase de efeito curta",
      "porque": "é a tese do vídeo em cinco palavras",
      "confianca": 0.85,
      "alternativas": ["tese"]
    }
  ],
  "novas": [
    {
      "id": "n01",
      "t": 23.1,
      "dur": 3,
      "nome": "Termômetro",
      "fala": "de 0 a 10, quão morno tu tá?",
      "porque": "a fala pede uma escala; nenhuma animação do banco mostra posição numa escala",
      "descricao": "uma barra vertical de cinza a brasa, com um marcador que sobe até o ponto dito",
      "baseEm": "numero",
      "campos": ["valor (0 a 10)", "rótulo"],
      "prioridade": "alta"
    }
  ]
}
```

Só usa ids de `animacao` que existem no catálogo. Campos de `params` têm que existir na animação e respeitar as opções dos campos de seleção.
