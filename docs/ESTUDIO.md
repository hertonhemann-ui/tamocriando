# Estúdio de shorts

Uma linha de produção: **estratégia → pauta → roteiro → direção → montagem → conferência → postagem → aprendizado**.

## Por que é assim

- **O short é a porta, o vídeo longo é a sala.** Teus estudos (Norte dos Formatos) mostram que o canal vive de YouTube: porta C acha gente nova, ensaio A acompanha, sala B fecha. Então o short não pede nada: leva ao vídeo longo pela legenda. Isso também respeita a regra da marca (final sem pedido).
- **Código decide o que se checa; o Claude decide o que se diz.** Tempo de leitura, colisão de animações, ordem, som e formato são regra. Ângulo, cena e frase são julgamento, e seguem tua voz real (Roteiros Brasa: "tu", cena antes de conceito).
- **Nunca inventa prova.** `estrategia.json › regras.nuncaInventar`. Pra psicólogo, advogado e nutri, depoimento e promessa são risco de ética, então o pilar "prova" só entra com dado real em `provas`.
- **Autonomia em degraus** (`autonomia.modo`): `rascunho` → `aprovar` → `auto`. Conta pessoal pública é a única coisa irreversível aqui, então começa em rascunho.

## O que roda onde (verificado)

| Etapa | Onde | Estado |
|---|---|---|
| pauta, direção, validação, render, som, mp4 | nuvem ou PC | funciona (`tools/estudio.mjs`) |
| imagens (ChatGPT, Open Generative AI) | **PC** | sessão no PC aberta; parou no limite de uso até 4h (Brasília) |
| voz (ElevenLabs API, Piper) | PC ou Actions | não implementado ainda |
| postar (Instagram, TikTok, YouTube) | PC, Actions ou n8n | não implementado ainda; o sandbox não alcança Meta/Postiz |
| aprender (métricas → memória) | Actions ou n8n | não implementado ainda |

O sandbox da nuvem só alcança GitHub, npm e PyPI. Canva devolve só miniatura (112×199) e o Higgsfield está com 0 crédito.

## Ferramentas externas

- **OpenMontage** (AGPLv3): fábrica de vídeo pra agentes, com Piper TTS grátis, música livre e legenda palavra a palavra. Usar como ferramenta instalada no PC, **sem copiar código pra este repo** (a licença contaminaria). Candidata a fornecer voz e legenda.
- **Open Generative AI** (MIT): app desktop que gera por API da MuAPI ou local (sd.cpp com SD1.5/SDXL). Fornece imagens grátis do PC.
- **REA** (`rea-agents` no npm, MIT, sem script de instalação): serve pra *investigar* software teu ou autorizado, não pra produzir vídeo. Bancada de desenvolvimento, não etapa da linha. Rodar `npx rea-agents@latest doctor` é decisão tua: o sistema bloqueou eu executar pacote de terceiro aqui.
- **Postiz** (CLI): agenda em Instagram, TikTok e YouTube e devolve analytics. Melhor caminho de postagem.
