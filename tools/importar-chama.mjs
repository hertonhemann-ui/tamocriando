#!/usr/bin/env node
/*
 * Importa quadros de chama (gerados no ChatGPT, desenhados à mão, filmados...) pro motor.
 *
 *   node tools/importar-chama.mjs <pasta-com-imagens>
 *   node tools/importar-chama.mjs <grade.png> --grade 4x3        # uma imagem com 12 quadros em grade
 *   node tools/importar-chama.mjs <grade.png> --grade 4x3 --previa /tmp/chama.png
 *
 * Aceita fundo liso de qualquer cor (a cor dos cantos vira transparência) ou PNG já com
 * transparência. Cada quadro vira uma máscara branca recortada e alinhada pela base; o motor
 * pinta ela na cor da marca. Resultado: plugin/tamocriando-motion/engine/flame-frames.js
 * (rode node tools/build-gallery.mjs depois pra galeria pegar).
 *
 *   --altura 384   altura de cada quadro em px
 *   --limpar       volta pras poses geradas por código (apaga os quadros importados)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'plugin/tamocriando-motion/engine/flame-frames.js');

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--limpar'));

function writeData(list) {
  const body = `/*
 * Quadros da chama em stop motion (máscaras PNG em data URI).
 * Este arquivo é gerado por: node tools/importar-chama.mjs <pasta ou imagem>
 * Vazio = o motor usa as 8 poses geradas por código.
 */
(function (root) {
  'use strict';
  root.TC.flameData = ${list.length ? '[\n    ' + list.map((d) => JSON.stringify(d)).join(',\n    ') + '\n  ]' : '[]'};
})(typeof window !== 'undefined' ? window : this);
`;
  fs.writeFileSync(OUT, body);
}

if (args.includes('--limpar')) { writeData([]); console.log('ok: quadros importados removidos, o motor volta pras poses geradas por código.'); process.exit(0); }
if (!pos.length) { console.error('uso: node tools/importar-chama.mjs <pasta ou imagem> [--grade 4x3] [--altura 384] [--previa arquivo.png]'); process.exit(1); }

const src = path.resolve(pos[0]);
if (!fs.existsSync(src)) { console.error('não achei: ' + src); process.exit(1); }
const EXT = /\.(png|jpe?g|webp)$/i;
const files = fs.statSync(src).isDirectory()
  ? fs.readdirSync(src).filter((f) => EXT.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((f) => path.join(src, f))
  : [src];
if (!files.length) { console.error('nenhuma imagem (png, jpg, webp) em ' + src); process.exit(1); }
const mime = (f) => (/\.png$/i.test(f) ? 'image/png' : /\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg');
const urls = files.map((f) => `data:${mime(f)};base64,${fs.readFileSync(f).toString('base64')}`);
const grade = flag('--grade') ? flag('--grade').split('x').map(Number) : null;
const H = Number(flag('--altura')) || 384;

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const res = await page.evaluate(async ({ urls, grade, H }) => {
  const load = (u) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('imagem inválida')); im.src = u; });
  // 1. recorta em quadros (grade) ou usa uma imagem por quadro
  const raw = [];
  for (const u of urls) {
    const im = await load(u);
    const cols = grade ? grade[0] : 1, rows = grade ? grade[1] : 1;
    const fw = Math.floor(im.width / cols), fh = Math.floor(im.height / rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas'); cv.width = fw; cv.height = fh;
      cv.getContext('2d').drawImage(im, c * fw, r * fh, fw, fh, 0, 0, fw, fh);
      raw.push(cv);
    }
  }
  // 2. fundo -> transparência: cor dos cantos (ou o alpha que já existir)
  const masks = raw.map((cv) => {
    const x = cv.getContext('2d'), w = cv.width, h = cv.height, id = x.getImageData(0, 0, w, h), d = id.data;
    const corner = (px, py) => { const i = (py * w + px) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
    const cs = [corner(2, 2), corner(w - 3, 2), corner(2, h - 3), corner(w - 3, h - 3)];
    const hasAlpha = cs.some((c) => c[3] < 200);
    const bg = [0, 1, 2].map((k) => cs.reduce((a, c) => a + c[k], 0) / 4);
    for (let i = 0; i < d.length; i += 4) {
      let a;
      if (hasAlpha) a = d[i + 3] / 255;
      else {
        const dist = Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
        const k = Math.min(1, Math.max(0, (dist - 18) / 52)); a = k * k * (3 - 2 * k);
      }
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
    }
    x.putImageData(id, 0, 0);
    // caixa do desenho
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (d[(y * w + xx) * 4 + 3] > 128) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { cv, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }).filter(Boolean);
  if (!masks.length) throw new Error('não achei nenhuma chama nas imagens (fundo liso e chama bem destacada ajudam)');
  // 3. mesma escala pra todos (a variação de altura entre quadros fica), alinhados pela base
  const maxH = Math.max(...masks.map((m) => m.h)), maxW = Math.max(...masks.map((m) => m.w));
  const sc = H / (maxH * 1.04), OW = Math.ceil(maxW * sc * 1.1), OH = H;
  const out = masks.map((m) => {
    const cv = document.createElement('canvas'); cv.width = OW; cv.height = OH;
    const x = cv.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(m.cv, m.x0, m.y0, m.w, m.h, (OW - m.w * sc) / 2, OH - m.h * sc, m.w * sc, m.h * sc);
    return cv.toDataURL('image/png');
  });
  return { frames: out, w: OW, h: OH, total: raw.length };
}, { urls, grade, H });

writeData(res.frames);
const prev = flag('--previa');
if (prev) {
  const sheet = await page.evaluate(async ({ frames, w, h }) => {
    const cv = document.createElement('canvas'); cv.width = (w + 10) * frames.length + 10; cv.height = h + 20;
    const x = cv.getContext('2d'); x.fillStyle = '#1A1714'; x.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < frames.length; i++) {
      const im = await new Promise((ok) => { const e = new Image(); e.onload = () => ok(e); e.src = frames[i]; });
      const t = document.createElement('canvas'); t.width = w; t.height = h; const tx = t.getContext('2d');
      tx.drawImage(im, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#C8502A'; tx.fillRect(0, 0, w, h);
      x.drawImage(t, 10 + i * (w + 10), 10);
    }
    return cv.toDataURL('image/png');
  }, res);
  fs.writeFileSync(path.resolve(prev), Buffer.from(sheet.split(',')[1], 'base64'));
  console.log('prévia:', path.resolve(prev));
}
await browser.close();
console.log(`ok: ${res.frames.length} quadros (${res.w}×${res.h}) em ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log('Depois: node tools/build-gallery.mjs, e reinstala o plugin no Premiere (instalador de novo).');
