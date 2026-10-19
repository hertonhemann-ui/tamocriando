# Pendências que são tuas

Lista do que eu (Claude) não posso decidir ou executar daqui. Responde no próprio arquivo, ou numa linha no chat com o número.

## Decisões

1. **Duração dos shorts.** A estratégia diz 15 a 35 s. Os 5 roteiros do motor 3D têm de 71 a 86 s. Fiz as duas versões de cada um (`<id>/final.mp4` longo e `<id>-30s/final.mp4` corte). Qual vai pro ar?
   - a) só o corte de 30 s (segue a estratégia)
   - b) o longo no Reels/TikTok e o corte no Shorts
   - c) muda a regra da estratégia pra aceitar até 90 s
2. **Legendas.** Escrevi a legenda e o comentário fixado de cada roteiro (`roteiro.json › legenda`), no teu tom e sem pedir nada no vídeo. Confere se tem frase que não é tua.
3. **Ordem e horário.** Sugestão da semana (4 por semana, como na estratégia):
   | dia | horário | short |
   |---|---|---|
   | seg | 12:15 | o cara que entrega menos e tá lotado |
   | qua | 19:30 | o contrato que tu assinou sem ler |
   | sex | 21:00 | o preço |
   | dom | 12:15 | o cliente emprestado |
   | próx. seg | 19:30 | quem ensina a vender |
   Os dois últimos são de funil "meio" (falam com quem já te conhece), por isso vêm depois.
4. **Canal "comandante imaterial".** Está como "confirmar" na estratégia. Qual é o nicho? Sem isso não monto a estratégia dele.
5. **Pasta `D:\CLADIO\operacao`.** Continua inacessível daqui (é o disco do teu PC). Pra eu trabalhar nela: sobe pro GitHub, joga no Google Drive, ou roda o Claude Code no PC dentro dela.

## Coisas que só rodam no teu PC

- **Postar.** Cada pasta com `final.mp4` tem `postagem.json` e `postar.sh` (Postiz, sai como rascunho). Antes: `postiz auth:status` e trocar `ID_DO_CANAL` pelo id do teu canal.
- **Imagens** (ChatGPT / Open Generative AI) entram em `estudio/acervo/`. Sem acervo, o fundo é o do próprio motor.
- **Voz** (ElevenLabs): `node tools/estudio-extra.mjs voz` precisa de `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID`. Nunca foi testado contra o serviço real.
- **Aprender com os números**: depois das primeiras postagens, exporta `estudio/desempenho.csv` (id, pilar, views, retencao, envios, salvos) e roda `node tools/estudio-extra.mjs aprender estudio/desempenho.csv`.
