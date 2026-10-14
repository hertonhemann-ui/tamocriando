#!/usr/bin/env node
/*
 * Teste rápido (sem Premiere):
 *  1. todo template desenha em todos os formatos, em vários instantes, sem erro
 *  2. o painel abre, edita, renderiza e chama tc_insert (Premiere e disco simulados)
 *  3. o ExtendScript do host tem sintaxe válida
 *
 *   node tools/smoke-test.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
let failed = 0;
const ok = (m) => console.log('  ok  ' + m);
const bad = (m) => { failed++; console.log('  FALHOU  ' + m); };

// 3. sintaxe do ExtendScript (ES3 é subconjunto de JS)
{
  const tmp = path.join(os.tmpdir(), 'tc-host-check.js');
  fs.copyFileSync(path.join(ROOT, 'plugin/tamocriando-motion/host/premiere.jsx'), tmp);
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  r.status === 0 ? ok('host/premiere.jsx: sintaxe válida') : bad('host/premiere.jsx: ' + r.stderr);
}

const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch();

// 1. todos os templates
{
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/tools/render-page.html');
  await page.evaluate(() => window.tcReady);
  const res = await page.evaluate(() => {
    const out = [];
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    for (const brand of Object.keys(TC.brands)) {
      for (const tpl of TC.list()) {
        for (const f of Object.keys(TC.formats)) {
          const { w, h } = TC.formats[f];
          cv.width = Math.round(w / 4); cv.height = Math.round(h / 4);
          for (const k of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
            try {
              TC.renderFrame(ctx, tpl.id, { w: cv.width, h: cv.height, t: tpl.duration * k, brand });
              if (k === 0.5 && f === '9:16') new TC.Renderer().render(ctx, tpl.id, { w: cv.width, h: cv.height, t: tpl.duration * k, brand, fx: TC.fxDefaults });
              // texto vazio e números fora da faixa não podem quebrar
              const empty = {};
              tpl.params.forEach((p) => { if (p.type !== 'curve') empty[p.key] = p.type === 'number' ? 99 : p.type === 'select' ? p.options[0] : ''; });
              TC.renderFrame(ctx, tpl.id, { w: cv.width, h: cv.height, t: tpl.duration * k, brand, params: empty });
            } catch (e) { out.push(`${brand}/${tpl.id}/${f}/t=${k}: ${e.message}`); }
          }
        }
      }
    }
    return { errors: out, count: TC.list().length };
  });
  res.errors.length ? res.errors.forEach(bad) : ok(`${res.count} templates × 4 formatos × todas as marcas desenham sem erro (inclusive com campos vazios)`);
  errors.forEach((e) => bad('erro na página: ' + e));
  await page.close();
}

// 1b. o painel e a galeria listam os scripts do motor à mão: têm que bater com engine/scripts.json
{
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugin/tamocriando-motion/engine/scripts.json'), 'utf8'));
  const panel = [...fs.readFileSync(path.join(ROOT, 'plugin/tamocriando-motion/index.html'), 'utf8').matchAll(/src="engine\/([^"]+)"/g)].map((m) => m[1]);
  const gal = [...fs.readFileSync(path.join(ROOT, 'gallery/galeria.html'), 'utf8').matchAll(/src="\.\.\/plugin\/tamocriando-motion\/engine\/([^"]+)"/g)].map((m) => m[1]);
  JSON.stringify(panel) === JSON.stringify(list) ? ok('index.html do painel carrega os mesmos scripts de engine/scripts.json') : bad('painel carrega ' + panel.join(', ') + ' / esperado ' + list.join(', '));
  JSON.stringify(gal) === JSON.stringify(list) ? ok('galeria carrega os mesmos scripts de engine/scripts.json') : bad('galeria carrega ' + gal.join(', ') + ' / esperado ' + list.join(', '));
}

// 2. painel com Premiere simulado
{
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__calls = [];
    window.__files = { count: 0, bytes: 0, dirs: [] };
    window.__adobe_cep__ = {
      evalScript(script, cb) {
        window.__calls.push(script);
        if (script.startsWith('tc_info')) {
          setTimeout(() => cb(JSON.stringify({ ok: true, hasSequence: true, name: 'Reels 01', width: 540, height: 960, fps: 30000 / 1001, playhead: 3.2, projectPath: '/projetos/cliente/edicao.prproj', videoTracks: 3 })), 5);
        } else if (script.startsWith('tc_insert')) {
          setTimeout(() => cb(JSON.stringify({ ok: true, placed: true, track: 2, at: 3.2, bin: 'Tamo Criando Motion' })), 5);
        } else cb('{"ok":false,"error":"?"}');
      },
      getHostEnvironment() { return JSON.stringify({ appSkinInfo: { panelBackgroundColor: { color: { red: 35, green: 35, blue: 35 } } } }); }
    };
    const dirs = new Set(['/', '/projetos', '/projetos/cliente']);
    const mods = {
      fs: {
        existsSync: (p) => dirs.has(p),
        mkdirSync: (p) => { dirs.add(p); window.__files.dirs.push(p); },
        writeFileSync: (p, b) => { window.__files.count++; window.__files.bytes += b.length; window.__files.last = p; }
      },
      path: {
        join: (...a) => a.join('/').replace(/\/+/g, '/'),
        dirname: (p) => p.replace(/\/[^/]*$/, '') || '/'
      },
      os: { homedir: () => '/home/teste' },
      buffer: { Buffer: { from: (s) => ({ length: Math.floor(s.length * 3 / 4) }) } }
    };
    window.require = (m) => mods[m];
  });
  await page.goto(base + '/plugin/tamocriando-motion/index.html');
  await page.waitForFunction(() => document.querySelectorAll('.card').length > 0);
  const cards = await page.locator('.card').count();
  const nTpl = await page.evaluate(() => TC.list().length);
  cards === nTpl && nTpl > 0 ? ok(`painel lista as ${cards} animações do motor`) : bad(`painel lista ${cards} cards, motor tem ${nTpl}`);
  const seqText = await page.locator('#seqinfo').textContent();
  seqText.includes('Reels 01') ? ok('painel lê a sequência: ' + seqText) : bad('info da sequência: ' + seqText);

  // a animação mais curta (render rápido)
  const short = await page.evaluate(() => TC.list().slice().sort((a, b) => a.duration - b.duration)[0]);
  await page.locator('.card', { hasText: short.name }).first().click();
  await page.waitForSelector('#editor:not([hidden])');
  await page.locator('#insert').click();
  await page.waitForFunction(() => /\b(ok|err)\b/.test(document.getElementById('status').className), null, { timeout: 60000 });
  const st = await page.locator('#status').textContent();
  const files = await page.evaluate(() => window.__files);
  const calls = await page.evaluate(() => window.__calls.filter((c) => c.startsWith('tc_insert')));
  st.startsWith('Pronto') ? ok('inserção: ' + st) : bad('inserção: ' + st);
  const expected = Math.round(short.duration * 30000 / 1001);
  files.count === expected ? ok(`render de "${short.id}" gravou ${files.count} PNGs (${short.duration}s a 29,97 fps) em ${files.dirs.at(-1)}`) : bad(`esperava ${expected} PNGs de "${short.id}", gravou ${files.count}`);
  calls.length === 1 && calls[0].includes('_00000.png') ? ok('chamou tc_insert com o primeiro frame') : bad('chamada tc_insert: ' + calls.join(' | '));

  // edita um texto e confere que a prévia usa o valor novo
  await page.locator('#back').click();
  await page.locator('.card').first().click();
  const firstKey = await page.evaluate(() => TC.templates[window.TCPanel.state.id].params.find((q) => q.type === 'text').key);
  await page.locator('#fields input[type=text]').first().fill('teste de campo');
  const p = await page.evaluate((k) => window.TCPanel.state.params[k], firstKey);
  p === 'teste de campo' ? ok('edição de campo chega na prévia') : bad('param ' + firstKey + ' = ' + p);

  // editor de curva: o atalho "faísca" muda a curva de entrada usada na prévia
  const nCurves = await page.locator('#curves .tc-curve').count();
  await page.locator('#curves .tc-curve').first().locator('button', { hasText: 'faísca' }).click();
  const ent = await page.evaluate(() => window.TCPanel.state.params.entrada);
  nCurves === 2 && JSON.stringify(ent) === JSON.stringify([0.34, 1.5, 0.64, 1])
    ? ok('editor de curvas: 2 curvas, atalho "faísca" chega nos parâmetros')
    : bad('curvas no editor: ' + nCurves + ', entrada = ' + JSON.stringify(ent));
  await page.screenshot({ path: path.join(os.tmpdir(), 'tc-panel.png') });
  errors.forEach((e) => bad('erro no painel: ' + e));
  await page.close();
}

// 3. galeria (gerada por tools/build-gallery.mjs)
if (fs.existsSync(path.join(ROOT, 'gallery/index.html'))) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/gallery/index.html');
  await page.waitForFunction(() => document.querySelectorAll('.shot canvas').length > 0);
  const shots = await page.locator('.shot').count();
  const nTpl = await page.evaluate(() => TC.list().length);
  shots === nTpl ? ok(`galeria mostra as ${shots} animações`) : bad(`galeria mostra ${shots}, motor tem ${nTpl}`);
  await page.locator('.shot').first().click();
  await page.waitForSelector('#editor:not([hidden])');
  const nCurves = await page.locator('#ed-curves .tc-curve').count();
  nCurves === 2 ? ok('galeria abre o editor com as 2 curvas') : bad('curvas no editor da galeria: ' + nCurves);
  errors.forEach((e) => bad('erro na galeria: ' + e));
  await page.close();
} else console.log('  --  galeria não gerada (roda node tools/build-gallery.mjs), pulei');

await browser.close();
srv.close();
console.log(failed ? `\n${failed} falha(s)` : '\ntudo certo');
process.exit(failed ? 1 : 0);
