---
name: estudio-shorts
description: Planeja e produz shorts/reels de motion design da marca herton hemann, do pauta ao vídeo final e ao pacote de postagem. Use quando pedirem shorts, reels, a semana de conteúdo, um vídeo de motion a partir de uma ideia, ou pra produzir em lote.
---

Tu é o diretor. Quem decide o que dizer é tu; o que se resolve com regra é `tools/estudio.mjs`. Caminhos a partir da raiz do repo.

## Fluxo

1. **Lê `estudio/estrategia.json`** (público, pilares, voz, o que nunca inventar) e `estudio/memoria.json` se existir (o que já funcionou). Nada de número, depoimento ou caso inventado: se faltar prova real, o short não usa prova.
2. **Pauta:** `node tools/estudio.mjs pauta` dá os slots da semana (pilar, funil, horário). Se o Herton deu um tema, ele vence.
3. **Roteiro** em `estudio/producoes/<id>/roteiro.json` (modelo: `estudio/producoes/o-cara-lotado/`). Regras:
   - abre com cena ou pergunta que a pessoa já viveu, nunca com conceito abstrato; texto na tela em até 0,5 s;
   - 15 a 35 s, 3 a 5 beats, uma palavra em brasa por tela, minúsculas, "tu", observa e não manda;
   - o vídeo nunca pede segue/salva/comenta: o pedido vive em `legenda.comentarioFixado` (funil: o short leva ao vídeo longo);
   - tipos de beat: `pergunta`, `contraste`, `tese`, `palavra`, `virada`, `lista`, `marca`, `fecho`.
4. **Dirige:** `node tools/estudio.mjs dirigir estudio/producoes/<id>/roteiro.json` escolhe animação e tempo, valida contra o motor e escreve `plano.json`. Erro para; aviso é decisão tua.
5. **Monta:** `node tools/estudio.mjs montar estudio/producoes/<id>` renderiza (motor + câmera + som sintetizado + loudnorm) e entrega `final.mp4` e `capa.jpg`. Demora alguns minutos; roda em segundo plano.
6. **Confere olhando**: extrai 4 frames (`ffmpeg -ss … -frames:v 1`) e vê o texto, a brasa, a zona segura (12% topo, 20% base). Não entrega sem olhar.
7. **Entrega** o mp4, a capa e a legenda. Postagem: ver `docs/ESTUDIO.md` (o sandbox não alcança Instagram/Postiz; publica o PC, o GitHub Actions ou o n8n).

## Limites reais
Gerador de imagem, voz e publicação precisam de internet que o sandbox da nuvem não tem. Imagens entram por `estudio/acervo/` (geradas no ChatGPT/Open Generative AI do PC). Sem acervo, o fundo é o Fundo Vivo do motor, que já é da marca.
