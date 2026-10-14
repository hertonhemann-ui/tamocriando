#!/usr/bin/env node
/*
 * Driver do tamocriando: sobe um servidor estático na raiz do repo e abre
 * as páginas num Chromium headless (Playwright). O painel do Premiere roda
 * com um Premiere SIMULADO: window.__adobe_cep__ responde tc_info/tc_insert
 * e window.require('fs') grava os PNGs de verdade em OUT_DIR/panel-files/.
 *
 * Uso (comandos por linha, via stdin):
 *   node .claude/skills/run-tamocriando/driver.mjs <<'EOF'
 *   open panel
 *   ss biblioteca
 *   EOF
 * Ou interativo dentro do tmux (mesmos comandos). "help" lista tudo.
 *
 * Saídas em $TC_OUT (padrão /tmp/tamocriando-run): shots/, frames/, panel-files/.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = process.env.TC_OUT || '/tmp/tamocriando-run';
const SHOTS = path.join(OUT, 'shots'), FRAMES = path.join(OUT, 'frames'), PFILES = path.join(OUT, 'panel-files');
for (const d of [SHOTS, FRAMES, PFILES]) fs.mkdirSync(d, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const PAGES = {
  panel: '/plugin/tamocriando-motion/index.html',
  gallery: '/gallery/index.html',
  render: '/tools/render-page.html'
};

let server = null, base = '', browser = null, page = null, current = null;
let errors = [];
let saveFiles = false;   // "save on": grava os PNGs do painel de verdade (cuidado: ~3 MB/frame em tela cheia)
// sequência simulada do Premiere (mude com "seq" ANTES de "open panel")
let seq = { hasSequence: true, name: 'Reels 01', width: 540, height: 960, fps: 30000 / 1001, playhead: 3.2, projectPath: '/projetos/cliente/edicao.prproj', videoTracks: 3 };

function log(...a) { console.log(...a); }

async function ensureServer() {
  if (server) return;
  server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
}

async function ensureBrowser() {
  if (!browser) browser = await chromium.launch();
}

function need() { if (!page) throw new Error('nenhuma página aberta: use "open panel|gallery|render"'); }

// Premiere + Node simulados (o painel usa os dois)
function cepMock(seqInfo) {
  window.__calls = [];
  window.__files = { count: 0, bytes: 0, dirs: [], last: '' };
  window.__adobe_cep__ = {
    evalScript(script, cb) {
      window.__calls.push(script);
      let r = { ok: false, error: 'função desconhecida' };
      if (script.startsWith('tc_info')) r = Object.assign({ ok: true }, seqInfo);
      else if (script.startsWith('tc_insert')) {
        const place = /,\s*true\s*,/.test(script);
        const at = /"\s*,\s*(-?\d+(?:\.\d+)?)\)$/.exec(script);
        r = place ? { ok: true, placed: true, track: 2, at: at ? Number(at[1]) : seqInfo.playhead, bin: 'Tamo Criando Motion' } : { ok: true, placed: false, bin: 'Tamo Criando Motion' };
      } else if (script.startsWith('tc_markers')) r = { ok: true, count: (script.match(/"name"/g) || []).length };
      else if (script.startsWith('tc_reveal')) r = { ok: true };
      setTimeout(() => cb(JSON.stringify(r)), 5);
    },
    getHostEnvironment() { return JSON.stringify({ appSkinInfo: { panelBackgroundColor: { color: { red: 35, green: 35, blue: 35 } } } }); }
  };
  const dirs = new Set(['/']);
  const mods = {
    fs: {
      existsSync: (p) => dirs.has(p) || p === '/projetos' || p === '/projetos/cliente',
      mkdirSync: (p) => { dirs.add(p); window.__files.dirs.push(p); },
      writeFileSync: (p, b) => { window.__files.count++; window.__files.bytes += b.length; window.__files.last = p; if (window.__saveFile) window.__saveFile(p, b.b64); }
    },
    path: { join: (...a) => a.join('/').replace(/\/+/g, '/'), dirname: (p) => p.replace(/\/[^/]*$/, '') || '/' },
    os: { homedir: () => '/home/editor' },
    buffer: { Buffer: { from: (s) => ({ length: Math.floor(s.length * 3 / 4), b64: s }) } }
  };
  window.require = (m) => mods[m];
}

const COMMANDS = {
  async open(which) {
    which = which || 'panel';
    if (!PAGES[which]) throw new Error('páginas: ' + Object.keys(PAGES).join(', '));
    await ensureServer(); await ensureBrowser();
    if (page) await page.context().close();
    const ctx = await browser.newContext({ viewport: which === 'panel' ? { width: 400, height: 900 } : { width: 1280, height: 900 } });
    page = await ctx.newPage();
    errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ': ' + r.url()); });
    if (which === 'panel') {
      await page.exposeFunction('__saveFile', (p, b64) => {
        if (!saveFiles) return;
        const dest = path.join(PFILES, p.replace(/^\/+/, ''));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
      });
      await page.addInitScript(cepMock, seq);
    }
    await page.goto(base + PAGES[which]);
    if (which === 'panel') await page.waitForFunction(() => document.querySelectorAll('.card').length > 0, null, { timeout: 30000 });
    if (which === 'gallery') await page.waitForFunction(() => document.querySelectorAll('.shot canvas').length > 0, null, { timeout: 30000 });
    if (which === 'render') await page.evaluate(() => window.tcReady);
    current = which;
    log('aberto:', which, base + PAGES[which]);
  },

  // "seq 1080x1920 29.97" | "seq none" (sem sequência aberta no Premiere)
  async seq(arg) {
    if (arg === 'none') seq = Object.assign({}, seq, { hasSequence: false });
    else {
      const m = /(\d+)x(\d+)\s+([\d.]+)/.exec(arg || '');
      if (!m) throw new Error('uso: seq 1080x1920 29.97  |  seq none');
      const fps = Number(m[3]);
      seq = Object.assign({}, seq, { hasSequence: true, width: +m[1], height: +m[2], fps: Math.abs(fps - 29.97) < 0.01 ? 30000 / 1001 : Math.abs(fps - 23.976) < 0.01 ? 24000 / 1001 : fps });
    }
    log('sequência simulada:', JSON.stringify(seq), '(vale no próximo "open panel")');
  },

  async ss(name) {
    need();
    const f = path.join(SHOTS, (name || 'shot-' + Date.now()) + '.png');
    await page.screenshot({ path: f, fullPage: current === 'gallery' && name && name.endsWith('-full') });
    log('screenshot:', f);
  },

  async click(sel) {
    need();
    const r = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return 'NOT_FOUND'; el.click(); return 'OK'; }, sel);
    log('click', sel, '->', r);
  },

  // clica no botão/card com esse texto (exato primeiro; depois "contém")
  async 'click-text'(text) {
    need();
    const r = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      const label = (e) => (e.querySelector('.name, h3')?.textContent || e.textContent).trim();
      const el = els.find((e) => label(e) === t) || els.find((e) => (e.getAttribute('aria-label') || '') === t) ||
        els.find((e) => e.textContent.includes(t)) || els.find((e) => (e.getAttribute('aria-label') || '').includes(t));
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK: ' + el.tagName + '.' + el.className + ' "' + label(el).slice(0, 40) + '"';
    }, text);
    log('click-text', JSON.stringify(text), '->', r);
  },

  // abre o editor de uma animação pelo id (painel ou galeria)
  async pick(id) {
    need();
    const r = await page.evaluate((id) => {
      if (!TC.templates[id]) return 'template não existe: ' + id;
      if (window.TCPanel) { window.TCPanel.openEditor(id); return 'OK (painel)'; }
      const b = [...document.querySelectorAll('.shot')].find((e) => e.getAttribute('aria-label') === 'Editar ' + TC.templates[id].name);
      if (!b) return 'NOT_FOUND';
      b.click(); return 'OK (galeria)';
    }, id);
    if (!r.startsWith('OK')) throw new Error('pick ' + id + ': ' + r);
    await page.waitForSelector('#editor:not([hidden])', { timeout: 10000 });
    log('pick', id, '->', r);
  },

  // "fill #fields input >> 1 | texto": preenche o N-ésimo campo que casa com o seletor
  async fill(arg) {
    need();
    const [left, value] = arg.split('|').map((x) => x.trim());
    const [sel, idx] = left.split('>>').map((x) => x.trim());
    await page.locator(sel).nth(Number(idx || 0)).fill(value ?? '');
    log('fill', sel, idx || 0, '=', JSON.stringify(value));
  },

  async select(arg) {
    need();
    const [left, value] = arg.split('|').map((x) => x.trim());
    const [sel, idx] = left.split('>>').map((x) => x.trim());
    await page.locator(sel).nth(Number(idx || 0)).selectOption(value);
    log('select', sel, idx || 0, '=', value);
  },

  async wait(sel) {
    need();
    await page.waitForSelector(sel, { timeout: 15000 });
    log('ok:', sel);
  },

  // painel: espera o render+importação terminar (status ok ou err)
  async 'wait-status'() {
    need();
    await page.waitForFunction(() => /\b(ok|err)\b/.test(document.getElementById('status').className), null, { timeout: 600000 });
    const st = await page.evaluate(() => ({ cls: document.getElementById('status').className, text: document.getElementById('status').textContent }));
    log('status [' + st.cls + ']:', st.text);
  },

  async save(v) {
    saveFiles = v === 'on';
    log('gravar PNGs do painel em disco:', saveFiles ? 'sim, em ' + PFILES : 'não (só conta)');
  },

  async sleep(ms) { await new Promise((r) => setTimeout(r, Number(ms) || 500)); log('dormiu', ms || 500, 'ms'); },

  async text(sel) { need(); log(await page.evaluate((s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)', sel || null)); },

  async eval(expr) { need(); log(JSON.stringify(await page.evaluate(expr), null, 1)); },

  // chamadas ExtendScript que o painel fez
  async calls() { need(); log((await page.evaluate(() => window.__calls || [])).join('\n') || '(nenhuma)'); },

  async files() {
    need();
    const f = await page.evaluate(() => window.__files);
    log(JSON.stringify(f));
    log(saveFiles ? 'cópia real em: ' + PFILES : '(não gravados em disco: use "save on" antes do render)');
  },

  async errors() { log(errors.length ? errors.join('\n') : 'sem erros'); },

  async list() {
    if (!page) await COMMANDS.open('render');
    const l = await page.evaluate(() => TC.list().map((t) => `${t.category.padEnd(9)} ${t.id.padEnd(16)} ${t.duration}s  ${t.name}`));
    log(l.join('\n'));
  },

  // "frame <id> [t] [WxH] [fx] [k=v ...]": um frame do motor, sem UI.
  // fx liga o pós-processamento (TC.Renderer); fx:<preset> escolhe um de TC.fxPresets (padrão, cinema, tremido, sujo, limpo);
  // fxo=blur:0,aberration:35,edge:50 liga só o que tu listar (escala do painel, 0 a 100).
  async frame(arg) {
    if (current !== 'render') await COMMANDS.open('render');
    const parts = (arg || '').split(/\s+/).filter(Boolean);
    const id = parts.shift();
    if (!id) throw new Error('uso: frame <id> [t] [WxH] [fx] [chave=valor]');
    let t = 1, w = 1080, h = 1920, fx = false, fxo = null;
    const params = {};
    for (const p of parts) {
      if (/^\d+x\d+$/.test(p)) { [w, h] = p.split('x').map(Number); }
      else if (p === 'fx') fx = 'padrão';
      else if (p.startsWith('fx:')) fx = p.slice(3);
      else if (p.startsWith('fxo=')) { fx = 'custom'; fxo = Object.fromEntries(p.slice(4).split(',').map((kv) => kv.split(':')).map(([k, v]) => [k, Number(v)])); }
      else if (p.includes('=')) { const [k, ...v] = p.split('='); params[k] = v.join('=').replace(/_/g, ' '); }
      else t = Number(p);
    }
    const r = await page.evaluate(({ id, t, w, h, fx, fxo, params }) => {
      if (!TC.templates[id]) throw new Error('template não existe: ' + id + ' (veja "list")');
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const o = { w, h, t, params, preview: true };
      let gl = null;
      if (fx) { const R = new TC.Renderer(); R.render(cv.getContext('2d'), id, Object.assign(o, { fx: TC.fxFromUI(fxo || (TC.fxPresets[fx] || TC.fxPresets['padrão']).v, 6, 30) })); gl = R.hasGL(); }
      else TC.renderFrame(cv.getContext('2d'), id, o);
      return { url: cv.toDataURL('image/png'), gl };
    }, { id, t, w, h, fx, fxo, params });
    const ptag = Object.keys(params).length ? '_' + Object.entries(params).map(([k, v]) => k + '=' + v).join('_').replace(/[^\w=+-]+/g, '-') : '';
    const f = path.join(FRAMES, `${id}${ptag}_${w}x${h}_t${t}${fx ? '_fx' + (fx === 'padrão' ? '' : '-' + (fxo ? Object.entries(fxo).map(([k, v]) => k.slice(0, 2) + v).join('_') : fx)) : ''}.png`);
    fs.writeFileSync(f, Buffer.from(r.url.split(',')[1], 'base64'));
    log('frame:', f, fx ? (r.gl ? '(fx com WebGL: desfoque + aberração + lente)' : '(fx SEM WebGL: só desfoque de movimento)') : '');
  },

  async quit() {
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
    browser = page = server = null;
  },

  // espera um texto aparecer num elemento: wait-text <css> <trecho>
  async 'wait-text'(arg) {
    need();
    const i = (arg || '').indexOf(' ');
    const sel = (arg || '').slice(0, i), frag = (arg || '').slice(i + 1);
    await page.waitForFunction(([s, f]) => (document.querySelector(s)?.textContent || '').includes(f), [sel, frag], { timeout: 600000 });
    log('wait-text', sel, JSON.stringify(frag), '-> OK');
  },
  // arrasta com o mouse a partir do centro de um elemento: drag <css> <dx> <dy>
  async drag(arg) {
    need();
    const [sel, dx, dy] = (arg || '').split(/\s+/);
    const box = await page.locator(sel).first().boundingBox();
    if (!box) throw new Error('elemento sem caixa: ' + sel);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + Number(dx) / 2, y + Number(dy) / 2, { steps: 4 });
    await page.mouse.move(x + Number(dx), y + Number(dy), { steps: 4 });
    await page.mouse.up();
    log('drag', sel, dx, dy);
  },
  help() {
    log([
      'open panel|gallery|render   abre a página (panel = painel do Premiere com host simulado)',
      'seq 1080x1920 29.97 | none  sequência simulada (use antes de "open panel")',
      'ss [nome]                   screenshot em ' + SHOTS,
      'pick <id>                   abre o editor da animação (ids: comando list)',
      'click <css> | click-text <texto>',
      'drag <css> <dx> <dy>        arrasta com o mouse a partir do centro do elemento (px)',
      'fill <css> >> <n> | <valor> preenche o n-ésimo campo',
      'select <css> >> <n> | <valor>',
      'wait-text <css> <trecho>    espera o texto aparecer no elemento (ex.: #plan-status inseridas)',
      'wait <css> | wait-status (painel: espera render+importação) | sleep <ms>',
      'text [css] | eval <js> | errors',
      'calls                       chamadas ExtendScript feitas pelo painel',
      'files                       PNGs que o painel gravou (contagem/bytes)',
      'save on|off                 grava os PNGs do painel de verdade em ' + PFILES + ' (padrão off)',
      'list                        animações registradas no motor',
      'frame <id> [t] [WxH] [fx] [chave=valor]  um frame do motor em ' + FRAMES,
      'quit'
    ].join('\n'));
  }
};

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const interactive = process.stdin.isTTY;
if (interactive) { log('tamocriando driver — "help" lista os comandos'); process.stdout.write('driver> '); }
let failed = false;
for await (const raw of rl) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) { if (interactive) process.stdout.write('driver> '); continue; }
  const sp = line.indexOf(' ');
  const cmd = sp < 0 ? line : line.slice(0, sp), rest = sp < 0 ? '' : line.slice(sp + 1);
  const fn = COMMANDS[cmd];
  if (!fn) log('comando desconhecido:', cmd, '(help)');
  else {
    try { await fn(rest); } catch (e) { failed = true; log('ERRO:', e.message.split('\n')[0]); }
  }
  if (cmd === 'quit') break;
  if (interactive) process.stdout.write('driver> ');
}
await COMMANDS.quit();
process.exit(failed ? 1 : 0);
