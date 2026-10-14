#!/usr/bin/env node
/*
 * Renderizador em lote do banco de animações.
 *
 *   node tools/render.mjs                       # tudo, 9:16 e 16:9, ProRes 4444 com alpha
 *   node tools/render.mjs --only palavra-acesa --formats 9:16
 *   node tools/render.mjs --only nome --params '{"nome":"ana souza"}'
 *   node tools/render.mjs --codec png           # QuickTime PNG (arquivo menor, também tem alpha)
 *   node tools/render.mjs --previews            # gera também MP4 e GIF de pré-visualização
 *   node tools/render.mjs --sheet               # folhas de contato (revisão rápida)
 *   node tools/render.mjs --catalog             # uma imagem com todas as animações
 *   node tools/render.mjs --still 2.5 --only marca  # um frame em resolução cheia (com fundo de prévia)
 *   node tools/render.mjs --gif --out docs      # prévias animadas leves (WebP) pro README
 *
 * Câmera (o mesmo pós-processamento do painel, ligado por padrão; não vale pro --catalog):
 *   --blur 0.5         desfoque de movimento, fração do frame (0.5 = obturador 180°, 0 desliga)
 *   --aberration 35    aberração cromática de 0 a 100 (só onde algo se mexe)
 *   --lens 20          distorção de lente de 0 a 100
 *   --edge 50          desfoque de borda (olho de lente) de 0 a 100
 *   --displace 30      turbulência (quadro tremendo a 12 por segundo) de 0 a 100
 *   --noise 25         ruído de filme de 0 a 100
 *   --fx-preset cinema atalho pronto: padrão, cinema, tremido, sujo, limpo (as flags acima não valem junto)
 *   --samples 6        instantes por frame no desfoque
 *   --no-fx            desliga tudo (frame cru do motor)
 *
 * Precisa de: Node 18+, ffmpeg no PATH e Playwright (npm i -D playwright).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const a = { formats: ['9:16', '16:9'], fps: 30, codec: 'prores', out: path.join(ROOT, 'renders'), brand: undefined, scale: 1,
    fx: { blur: 0.5, aberration: 35, lens: 20, displace: 0, noise: 0, edge: 0, samples: 6 }, useFx: true };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    if (k === '--only') a.only = next().split(',');
    else if (k === '--formats') a.formats = next().split(',');
    else if (k === '--fps') a.fps = Number(next());
    else if (k === '--codec') a.codec = next();
    else if (k === '--out') a.out = path.resolve(next());
    else if (k === '--brand') a.brand = next();
    else if (k === '--params') a.params = JSON.parse(next());
    else if (k === '--dur') a.dur = Number(next());
    else if (k === '--scale') a.scale = Number(next());
    else if (k === '--previews') a.previews = true;
    else if (k === '--sheet') a.sheet = true;
    else if (k === '--catalog') a.catalog = true;
    else if (k === '--gif') a.gif = true;
    else if (k === '--still') a.still = Number(next());
    else if (k === '--times') a.times = next().split(',').map(Number);
    else if (k === '--backdrop') a.backdrop = next();
    else if (k === '--keep-frames') a.keepFrames = true;
    else if (k === '--blur') a.fx.blur = Number(next());
    else if (k === '--aberration') a.fx.aberration = Number(next());
    else if (k === '--lens') a.fx.lens = Number(next());
    else if (k === '--displace') a.fx.displace = Number(next());
    else if (k === '--noise') a.fx.noise = Number(next());
    else if (k === '--edge') a.fx.edge = Number(next());
    else if (k === '--fx-preset') a.fxPreset = next();
    else if (k === '--samples') a.fx.samples = Number(next());
    else if (k === '--no-fx') a.useFx = false;
    else if (k === '-h' || k === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); process.exit(0); }
    else throw new Error('Argumento desconhecido: ' + k);
  }
  return a;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg falhou: ' + args.join(' '));
}

const CODECS = {
  prores: { ext: '.mov', args: ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0'] },
  png: { ext: '.mov', args: ['-c:v', 'png', '-pix_fmt', 'rgba'] },
  qtrle: { ext: '.mov', args: ['-c:v', 'qtrle', '-pix_fmt', 'argb'] },
  webm: { ext: '.webm', args: ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '28'] }
};

async function main() {
  const a = parseArgs(process.argv);
  // o que a página recebe: mesmas escalas do painel (aberração e lente em 0..1)
  // preset (cinema, tremido, sujo, limpo...) vem do motor; as flags soltas valem por cima dele
  const fxFor = (fps) => (a.useFx ? { ui: a.fx, preset: a.fxPreset, fps } : undefined);
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { throw new Error('Playwright não encontrado. Roda: npm i -D playwright'); }

  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.error('[página]', m.text()); });
  page.on('pageerror', (e) => console.error('[página]', e.message));
  await page.goto(`http://127.0.0.1:${port}/tools/render-page.html`);
  const list = await page.evaluate(() => window.tcReady);
  const todo = list.filter((t) => !a.only || a.only.includes(t.id));
  if (!todo.length) throw new Error('Nenhum template encontrado. Disponíveis: ' + list.map((t) => t.id).join(', '));

  fs.mkdirSync(a.out, { recursive: true });
  if (a.catalog) {
    for (const fmt of a.formats) {
      const url = await page.evaluate(({ ids, fmt, brand }) => window.tcCatalog(ids, fmt, brand), { ids: todo.map((t) => t.id), fmt, brand: a.brand });
      const dest = path.join(a.out, `catalogo_${fmt.replace(':', 'x')}.png`);
      fs.writeFileSync(dest, Buffer.from(url.split(',')[1], 'base64'));
      console.log('catálogo', path.relative(process.cwd(), dest));
    }
    await browser.close(); srv.close();
    return;
  }
  const sizes = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };

  for (const tpl of todo) {
    for (const fmt of a.formats) {
      const [bw, bh] = sizes[fmt];
      const w = Math.round(bw * a.scale), h = Math.round(bh * a.scale);
      const dur = a.dur || tpl.duration;
      const tag = `${tpl.id}_${fmt.replace(':', 'x')}`;

      if (a.sheet) {
        const times = a.times || [0.25, 0.5, 0.8, 1.2, 1.8, tpl.thumb, dur - 0.3, dur - 0.1].map((x) => Math.max(0, Math.min(dur, x)));
        const scale = fmt === '16:9' ? 0.3 : 0.25;
        const url = await page.evaluate(({ id, o }) => window.tcSheet(id, o), {
          id: tpl.id, o: { w, h, scale, times, cols: 4, dur, params: a.params, brand: a.brand, backdrop: a.backdrop, fx: fxFor(a.fps) }
        });
        const dir = path.join(a.out, 'sheets'); fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, tag + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        console.log('folha', path.join(dir, tag + '.png'));
        continue;
      }

      if (a.still !== undefined) {
        const url = await page.evaluate(({ id, o }) => window.tcFrame(id, o), {
          id: tpl.id, o: { w, h, t: a.still, dur, params: a.params, brand: a.brand, preview: true, backdrop: a.backdrop, fx: fxFor(a.fps) }
        });
        const sdir = path.join(a.out, 'stills'); fs.mkdirSync(sdir, { recursive: true });
        fs.writeFileSync(path.join(sdir, `${tag}_${a.still}.png`), Buffer.from(url.split(',')[1], 'base64'));
        console.log('still', path.join(sdir, `${tag}_${a.still}.png`));
        continue;
      }
      if (a.gif) {
        const gs = fmt === '16:9' ? 0.3 : 0.25;
        const gw = Math.round(bw * gs / 2) * 2, gh = Math.round(bh * gs / 2) * 2;
        const gfps = 15, n = Math.round(dur * gfps) + 8;
        const tmpg = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-gif-'));
        for (let i = 0; i < n; i++) {
          const url = await page.evaluate(({ id, o }) => window.tcFrame(id, o), {
            id: tpl.id, o: { w: gw, h: gh, t: Math.min(dur, i / gfps), dur, params: a.params, brand: a.brand, preview: true, fx: fxFor(gfps) }
          });
          fs.writeFileSync(path.join(tmpg, `g_${String(i).padStart(5, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
        }
        const gdir = path.join(a.out, 'previews'); fs.mkdirSync(gdir, { recursive: true });
        // WebP animado: bem menor que GIF e o GitHub mostra no README
        ffmpeg(['-framerate', String(gfps), '-i', path.join(tmpg, 'g_%05d.png'), '-c:v', 'libwebp_anim', '-lossless', '0', '-quality', '62',
          '-compression_level', '6', '-loop', '0', path.join(gdir, tag + '.webp')]);
        fs.rmSync(tmpg, { recursive: true, force: true });
        console.log('webp', path.relative(ROOT, path.join(gdir, tag + '.webp')));
        continue;
      }

      const frames = Math.round(dur * a.fps);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-'));
      process.stdout.write(`${tag}: ${frames} frames `);
      for (let i = 0; i < frames; i++) {
        const url = await page.evaluate(({ id, o }) => window.tcFrame(id, o), {
          id: tpl.id, o: { w, h, t: i / a.fps, dur, params: a.params, brand: a.brand, fx: fxFor(a.fps) }
        });
        fs.writeFileSync(path.join(tmp, `f_${String(i).padStart(5, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
        if (i % 30 === 0) process.stdout.write('.');
      }
      const codec = CODECS[a.codec];
      if (!codec) throw new Error('Codec desconhecido: ' + a.codec);
      const dest = path.join(a.out, tag + codec.ext);
      ffmpeg(['-framerate', String(a.fps), '-i', path.join(tmp, 'f_%05d.png'), ...codec.args, dest]);
      console.log(' ->', path.relative(ROOT, dest));

      if (a.previews) {
        const pdir = path.join(a.out, 'previews'); fs.mkdirSync(pdir, { recursive: true });
        const pw = fmt === '16:9' ? 640 : 360;
        // prévia sobre fundo neutro (o alpha vira cinza escuro)
        ffmpeg(['-f', 'lavfi', '-i', `color=c=0x2b2b2b:s=${w}x${h}:r=${a.fps}`, '-framerate', String(a.fps), '-i', path.join(tmp, 'f_%05d.png'),
          '-filter_complex', `[0][1]overlay=shortest=1,scale=${pw}:-2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', path.join(pdir, tag + '.mp4')]);
        ffmpeg(['-f', 'lavfi', '-i', `color=c=0x2b2b2b:s=${w}x${h}:r=${a.fps}`, '-framerate', String(a.fps), '-i', path.join(tmp, 'f_%05d.png'),
          '-filter_complex', `[0][1]overlay=shortest=1,fps=15,scale=${Math.round(pw * 0.75)}:-2:flags=lanczos,split[x][y];[x]palettegen=max_colors=96[p];[y][p]paletteuse=dither=bayer:bayer_scale=4`,
          path.join(pdir, tag + '.gif')]);
      }
      if (a.keepFrames) {
        const fdir = path.join(a.out, 'frames', tag);
        fs.mkdirSync(fdir, { recursive: true });
        for (const f of fs.readdirSync(tmp)) fs.renameSync(path.join(tmp, f), path.join(fdir, f));
      }
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  await browser.close();
  srv.close();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
