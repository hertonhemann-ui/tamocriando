#!/bin/sh
# Monta index.html juntando as partes de src/ em ordem alfabética.
cd "$(dirname "$0")" && cat src/* > index.html
