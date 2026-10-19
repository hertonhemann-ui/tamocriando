#!/bin/sh
# NÃO executado pelo estúdio. Rode à mão no PC depois de postiz auth:status e de revisar.
set -e
cd "$(dirname "$0")"
URL=$(postiz upload final.mp4 | jq -r '.path')
postiz posts:create -c "$(jq -r .legenda postagem.json)" -m "$URL" -s "$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t draft -i "ID_DO_CANAL"
