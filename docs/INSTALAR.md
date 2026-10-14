# Instalar o painel no Premiere Pro

Funciona no Premiere Pro 2020 em diante, Windows e Mac. Leva 2 minutos.

## Passo a passo

1. Baixa este repositório (no GitHub: **Code › Download ZIP**) e descompacta onde quiser.
2. Fecha o Premiere.
3. Roda o instalador da pasta `install/`:
   - **Windows:** dois cliques em `instalar-windows.bat`.
   - **Mac:** dois cliques em `instalar-mac.command`. Se o macOS bloquear, clica com o botão direito › Abrir, ou roda no Terminal: `bash install/instalar-mac.command`.
4. Abre o Premiere. O painel fica em **Janela › Extensões › Tamo Criando Motion**.

O instalador faz duas coisas: copia a pasta `plugin/tamocriando-motion` pra pasta de extensões do Adobe e libera extensões não assinadas (a chave `PlayerDebugMode`, padrão pra painéis feitos em casa).

### Instalar na mão (se preferir)

Copia `plugin/tamocriando-motion` para:

- Windows: `%APPDATA%\Adobe\CEP\extensions\`
- Mac: `~/Library/Application Support/Adobe/CEP/extensions/`

E libera extensões não assinadas:

- Windows (Prompt de Comando): `reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f` (repete com `CSXS.12`)
- Mac (Terminal): `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` (repete com `CSXS.12`)

## Como usar

1. Abre a sequência e posiciona o playhead onde a animação começa.
2. No painel, clica na animação. Edita os textos (a prévia atualiza na hora).
3. Se quiser, abre **Movimento** e mexe nas curvas de entrada e saída (arrasta as bolinhas ou escolhe um atalho), e **Câmera** pra ajustar desfoque de movimento, aberração e lente. Os ajustes de câmera valem pra todas as animações.
4. **Inserir no playhead**: o painel renderiza no tamanho e frame rate da sequência e coloca o clipe na primeira trilha livre acima da V1. Se não tiver trilha livre, ele tenta criar uma.
5. **Só importar pro bin**: renderiza e deixa no bin `Tamo Criando Motion`, pra tu arrastar depois.

Os frames ficam em `TamoCriando_Motion/` ao lado do arquivo `.prproj`. **Não apaga essa pasta** enquanto o projeto estiver em uso: o Premiere lê os PNGs de lá. Pra levar o projeto pra outro computador, leva a pasta junto.

Os textos e as curvas que tu edita ficam salvos no painel por animação. "Restaurar padrão desta animação" volta pro original.

O render demora mais que a prévia porque cada frame é desenhado várias vezes pro desfoque de movimento. Nos testes, sem placa de vídeo, a Trilha da Brasa (5,5 s em 1080×1920) levou cerca de um minuto e meio; com a GPU do Premiere tende a ser bem mais rápido. Se estiver lento, baixa o desfoque pra "leve" ou desliga.

## Problemas comuns

**O painel não aparece em Janela › Extensões.**
A chave `PlayerDebugMode` não pegou na versão do teu Premiere. Roda o instalador de novo com o Premiere fechado. Se continuar, confere a versão do CEP: Premiere 2022 a 2024 usam `CSXS.11`, Premiere 2025 em diante `CSXS.12`. O instalador cobre de 9 a 13.

**"Não achei trilha livre acima da V1".**
Cria uma trilha de vídeo nova (botão direito na área das trilhas › Adicionar trilha) e clica de novo. O clipe já ficou no bin, então dá pra arrastar também.

**A animação ficou mais lenta ou mais rápida que a prévia.**
O painel ajusta o frame rate do clipe pro da sequência. Se tu mudou a sequência depois de inserir, clica com o botão direito no clipe no bin › Modificar › Interpretar gravação e coloca o frame rate da sequência.

**As letras saíram com outra fonte.**
As fontes (Anton e Inter) vêm dentro do plugin (`plugin/tamocriando-motion/fonts/`). Se aparecer fonte genérica, reinstala o plugin com o instalador (a pasta `fonts/` tem que ir junto).

**O render saiu sem a aberração e a lente.**
Esses dois efeitos usam WebGL. Se o Premiere estiver sem aceleração de GPU, o painel renderiza só com o desfoque de movimento, sem dar erro. O resto da animação sai igual.

**Quero ver o que está dando errado.**
Com o painel aberto, acessa `http://localhost:8088` no Chrome. É o console do painel.

## Sobre o futuro (UXP)

A Adobe está migrando os plugins do Premiere de CEP pra UXP. Este painel usa CEP, que continua funcionando no Premiere atual. Todo o desenho das animações fica em `engine/`, separado do painel: quando valer a pena migrar, troca só a casca (painel + ponte com o Premiere).
