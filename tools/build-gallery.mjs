#!/usr/bin/env node
/*
 * Monta a galeria a partir de gallery/galeria.html:
 *   gallery/index.html  -> abre direto no navegador (usa os arquivos do motor)
 *   dist/galeria.html   -> arquivo único com o motor embutido (pra publicar/compartilhar)
 *   node tools/build-gallery.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.join(ROOT, 'plugin/tamocriando-motion/engine');
const src = fs.readFileSync(path.join(ROOT, 'gallery/galeria.html'), 'utf8');
const re = /<!-- @engine:start -->[\s\S]*?<!-- @engine:end -->/;
if (!re.test(src)) throw new Error('Marcadores @engine não encontrados em gallery/galeria.html');

const files = JSON.parse(fs.readFileSync(path.join(ENGINE, 'scripts.json'), 'utf8'));
const inline = files.map((f) => {
  const code = fs.readFileSync(path.join(ENGINE, f), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>/* engine/${f} */\n${code}\n</script>`;
}).join('\n');

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/galeria.html'), src.replace(re, inline));

const local = '<!doctype html>\n<!-- gerado por tools/build-gallery.mjs a partir de galeria.html -->\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<link rel="stylesheet" href="../plugin/tamocriando-motion/fonts.css">\n</head>\n<body>\n' + src + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(ROOT, 'gallery/index.html'), local);
console.log('ok: gallery/index.html e dist/galeria.html (' + (fs.statSync(path.join(ROOT, 'dist/galeria.html')).size / 1024).toFixed(0) + ' KB)');
