#!/usr/bin/env node
/* node tools/estudio/render-cenas.mjs <spec.json> <pasta-saida> [--scale 0.667] [--sub 5] [--workers 3] [--frames 0-90] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [, , specPath, outDir, ...rest] = process.argv;
const flag = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const scale = Number(flag('--scale', 0.667)), sub = Number(flag('--sub', 0)), workers = Number(flag('--workers', 4));
const W = Math.round(1080 * scale / 2) * 2, H = Math.round(1920 * scale / 2) * 2;
const total = Math.round(spec.dur * spec.fps);
let [a, b] = flag('--frames', `0-${total - 1}`).split('-').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const m = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' }[path.extname(p)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': m }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const { chromium } = await import('playwright');
// Sem flag: SwiftShader (CPU, funciona em qualquer máquina, lento).
// --gpu: Chromium com janela (headful), que usa a placa de vídeo de verdade. --chrome: o Google Chrome instalado.
const GPU = rest.includes('--gpu') || rest.includes('--chrome');
const ARGS = GPU ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
  : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const LAUNCH = { args: ARGS, headless: !GPU, ...(rest.includes('--chrome') ? { channel: 'chrome' } : {}) };
let next = a, done = 0, glInfo = ''; const t0 = Date.now();
async function worker() {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[página]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/tools/estudio/cena.html`);
  await page.evaluate(({ W, H }) => window.cenaInit(W, H), { W, H });
  const nImg = await page.evaluate((s) => window.cenaLoad(s), spec);
  if (!glInfo) { glInfo = await page.evaluate(() => window.cenaGL()); console.log(`placa: ${glInfo} · imagens do acervo: ${nImg}`); if (GPU && /swiftshader|llvmpipe|software/i.test(glInfo)) console.log('AVISO: pediu --gpu mas o navegador caiu no render por software. Atualiza o driver de vídeo ou tenta --chrome.'); }
  for (;;) {
    const i = next++; if (i > b) break;
    const dest = path.join(outDir, `f_${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) { done++; continue; } // retoma de onde parou
    const url = await page.evaluate(({ t, n }) => window.cenaFrame(t, n), { t: i / spec.fps, n: sub });
    fs.writeFileSync(dest + '.tmp', Buffer.from(url.split(',')[1], 'base64')); fs.renameSync(dest + '.tmp', dest);
    if (++done % 60 === 0) process.stdout.write(`${done}/${b - a + 1} (${((Date.now() - t0) / 1000).toFixed(0)}s) `);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: workers }, worker));
srv.close();
console.log(`\nok ${b - a + 1} quadros em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
