# Render na placa de vídeo

O motor de cena roda dentro de um navegador (WebGL). Na nuvem não tem placa de vídeo, então ele usa o SwiftShader, que desenha na CPU: cerca de 1 a 2 quadros por segundo. No PC, com a GPU, o mesmo código fica dezenas de vezes mais rápido.

## Como rodar no PC (Windows)

1. Clona ou atualiza o repositório na branch `claude/lucid-johnson-gnmotx`.
2. Coloca as imagens do acervo em `estudio/acervo/` (as 12 do ChatGPT).
3. Duplo clique em `install/render-gpu.bat`.

O script instala o que falta, faz um teste de 4 segundos e mostra a linha `placa:`. Se aparecer o nome da tua placa (NVIDIA, AMD, Intel), a GPU está sendo usada. Se aparecer `SwiftShader`, não está: atualiza o driver de vídeo ou troca `--gpu` por `--chrome` (usa o Google Chrome instalado).

Com placa NVIDIA, o script usa também o codificador de vídeo da placa (`h264_nvenc`).

## Por que abre uma janela

Navegador sem janela (headless) costuma cair no render por software mesmo com GPU. Com janela (`--gpu`), o Chromium usa a placa como em qualquer site. A janela pode ficar minimizada; o render não depende dela estar visível.

## Comandos soltos

```bat
node tools\estudio\produzir.mjs estudio\producoes\o-contrato\roteiro.json --gpu --scale 1 --nvenc
node tools\estudio\produzir.mjs estudio\producoes\o-contrato\roteiro.json --ate 4 --gpu     (prévia de 4 s)
```
