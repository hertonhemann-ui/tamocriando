#!/bin/bash
# Instala o painel Tamo Criando Motion no Premiere Pro (macOS)
cd "$(dirname "$0")" || exit 1
SRC="../plugin/tamocriando-motion"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/tamocriando-motion"

if [ ! -f "$SRC/CSXS/manifest.xml" ]; then
  echo "Não achei a pasta do plugin em $SRC. Roda este arquivo de dentro da pasta install do pacote."
  exit 1
fi

# libera extensões não assinadas (CEP 9 a 13 = Premiere 2020 em diante)
for v in 9 10 11 12 13; do defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1; done

rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R "$SRC" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null

echo
echo "Pronto! Instalado em: $DEST"
echo "1. Fecha o Premiere (se estiver aberto) e abre de novo."
echo "2. Menu Janela > Extensões > Tamo Criando Motion"
echo
