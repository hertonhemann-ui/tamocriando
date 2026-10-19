#!/usr/bin/env node
/*
 * Diretor de b-roll: roteiro de falas -> decupagem (planos, câmera, foco, obturador) -> render 3D -> som -> mp4.
 *   node tools/estudio/produzir.mjs estudio/producoes/<id>/roteiro.json [--so-diretor] [--scale 0.5] [--ate 12]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sintetizar } from './som.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [, , arq, ...rest] = process.argv;
const flag = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const FPS = 24, OV = 0.32;
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
let sd = 1; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------- o diretor
const PLANOS = ['empurra', 'orbita', 'diagonal', 'guindaste', 'foco', 'puxa'];
const ANIM = ['flip', 'tilt', 'rise', 'zoom', 'slide'];
const NOMES = { empurra: 'travelling pra dentro', orbita: 'órbita lateral', diagonal: 'câmera torta (holandês) + avanço', guindaste: 'guindaste (sobe com tilt)', foco: 'puxada de foco entre planos', puxa: 'recuo revelando' };

function camera(tipo, d, lado) {
  const e = 'io', sh = [[0, 1.15], [0.34, 0.5], [d - OV, 0.5], [d, 1.0]];
  const base = { sh, fov: [[0, 42], [d, 38]], focus: 2640, ap: 0.7 };
  const whip = [[0, lado * 520, 'out'], [0.36, 0, 'out']];
  switch (tipo) {
    case 'empurra': return { ...base, x: [...whip, [d, -40, e]], z: [[0, 380], [d, -160, e]], ry: [[0, lado * 4], [d, -lado * 3, e]] };
    case 'puxa': return { ...base, x: [...whip, [d, 50, e]], z: [[0, -260], [d, 300, e]], fov: [[0, 36], [d, 44]] };
    case 'orbita': return { ...base, x: [[0, lado * 260], [d, -lado * 260, e]], ry: [[0, lado * 11], [d, -lado * 11, e]], z: [[0, 120], [d, -60, e]] };
    case 'guindaste': return { ...base, x: whip, y: [[0, -260], [d, 240, e]], rx: [[0, -6], [d, 5, e]], z: [[0, 100], [d, 40, e]] };
    case 'diagonal': return { ...base, x: [...whip, [d, -lado * 70, e]], rz: [[0, lado * -5], [d, lado * 4, e]], z: [[0, 260], [d, -140, e]], ry: [[0, 3], [d, -6, e]] };
    case 'foco': return { ...base, x: [...whip, [d, lado * 40, e]], ap: 1.25, focus: [[0, 2350], [d * 0.55, 2350], [d, 3350, 'io']], z: [[0, 160], [d, -60, e]], ry: [[0, 6 * lado], [d, -4 * lado, e]] };
  }
}

const PROP_POS = [{ x: 300, y: 280, ry: -16 }, { x: -300, y: -330, ry: 15 }, { x: 260, y: -360, ry: -12 }, { x: -280, y: 330, ry: 13 }];

export function dirigir(rot) {
  const BEAT = 60 / (rot.bpm || 92);
  const shots = [], ev = [], deco = [];
  let t = 0, prev = '', atoPrev = '';
  rot.falas.forEach((f, i) => {
    sd = 7 + i * 31;
    const pal = f.texto.split(/\s+/), n = pal.length, hiIdx = f.destaque ? pal.findIndex((w) => w.replace(/[.,!?…]/g, '').toLowerCase() === f.destaque.toLowerCase()) : -1;
    const beats = cl(Math.ceil((n * 0.34 + 1.1 + (f.extra || 0)) / BEAT), 4, 11), adv = beats * BEAT, last = i === rot.falas.length - 1, d = adv + (last ? 1.2 : OV);
    let tipo = PLANOS[(i * 5 + (f.ato ? f.ato.length : 0)) % PLANOS.length]; if (tipo === prev) tipo = PLANOS[(PLANOS.indexOf(tipo) + 1) % PLANOS.length]; prev = tipo;
    const lado = i % 2 ? 1 : -1, papel = f.tema === 'papel', mudaAto = f.ato && f.ato !== atoPrev; atoPrev = f.ato || atoPrev;
    const size = n <= 3 ? 220 : n <= 5 ? 180 : n <= 7 ? 150 : 128, flat = pal.map((w, j) => ({ t: w.replace(/,/g, ''), hi: j === hiIdx }));
    const color = papel ? '#1A1714' : '#EFE9DF', anim = ANIM[(i * 3 + 1) % ANIM.length];
    const heroi = f.cena && i % 2 === 1, planes = [];
    if (i % 3 !== 2) planes.push({ k: 'chao', y: -1000, z: -300, op: papel ? 0.22 : 0.38 });
    if (hiIdx >= 0) planes.push({ k: 'bloco', size: 560, flat: [{ t: pal[hiIdx].replace(/[.,!?]/g, ''), hi: false }], maxw: 5000, color: papel ? '#1A1714' : '#EFE9DF', anim: 'slide', stagger: 0, dw: 0.9, x: lado * -60, y: [[0, 300 * lado], [d, -300 * lado, 'io']], z: -700, rz: [[0, lado * -9], [d, lado * -5, 'io']], op: papel ? 0.09 : 0.1 });
    if (f.cena) {
      const pp = PROP_POS[i % PROP_POS.length];
      planes.push({ k: 'prop', n: f.cena, S: heroi ? 1050 : 780, hi: true, x: heroi ? 0 : pp.x, y: heroi ? 150 : pp.y, z: heroi ? -420 : -330, ry: [[0, pp.ry], [d, -pp.ry, 'io']], rz: [[0, -2], [d, 2, 'io']], op: [[0, 0], [0.35, 1, 'out']] });
    }
    planes.push({ k: 'brilho', w: 1300, c: '#C8502A', x: lado * 40, y: -40, z: -250, op: papel ? 0.25 : 0.5, s: [[0, .8], [d, 1.25, 'io']] });
    planes.push({ k: 'bloco', size, flat, maxw: 780, color, anim, stagger: 0.085, dw: 0.42, x: 0, y: heroi ? 700 : ((i % 3) - 1) * 120, z: 0, rz: [[0, lado * 1.5], [d, -lado * 1.5, 'io']], ry: [[0, 3], [d, -3, 'io']], s: heroi ? 0.82 : 1 });
    const flash = mudaAto ? { a: [[0, 0.95], [0.16, 0, 'out']], c: papel ? '#1A1714' : '#EFE9DF' } : f.impacto ? { a: [[0, 0.5], [0.12, 0, 'out']], c: '#C8502A' } : undefined;
    shots.push({ i, t0: +t.toFixed(3), dur: +d.toFixed(3), bg: papel ? 'papel' : 'tinta', particulas: papel ? 26 : 52, cam: camera(tipo, d, lado), planes, flash, op: [[0, 0], [OV * .9, 1, 'out'], [Math.max(OV, d - OV), 1], [d, last ? 1 : 0, 'in']] });
    deco.push({ i, t: t, beats, tipo, cena: f.cena || '-', ato: f.ato || '', texto: f.texto, papel, flash: !!flash });
    ev.push({ t: +t.toFixed(3), tipo: 'whoosh', lado });
    pal.forEach((w, k) => ev.push({ t: +(t + 0.085 * k + 0.12).toFixed(3), tipo: k === hiIdx ? 'shine' : 'tick', k }));
    if (mudaAto || f.impacto) ev.push({ t: +(t + 0.04).toFixed(3), tipo: 'boom' });
    if (mudaAto && i > 0) ev.push({ t: +Math.max(0, t - 1.3).toFixed(3), tipo: 'riser' });
    t += adv;
  });
  const dur = +(t + 1.2).toFixed(2);
  return { spec: { fps: FPS, dur, bpm: rot.bpm || 92, shots }, ev, deco, dur };
}

function decupagem(rot, deco, dur) {
  const m = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  let o = `# Decupagem: ${rot.titulo}\n\n${dur.toFixed(1)} s, ${rot.bpm || 92} bpm, ${deco.length} planos, ${FPS} fps. Cortes sempre no tempo da música.\n\n| # | tempo | ato | plano | cena | fala |\n|---|---|---|---|---|---|\n`;
  deco.forEach((d) => { o += `| ${d.i + 1} | ${m(d.t)} | ${d.ato} | ${NOMES[d.tipo]}${d.papel ? ' · fundo papel' : ''}${d.flash ? ' · clarão' : ''} | ${d.cena} | ${d.texto} |\n`; });
  return o;
}

async function main() {
  const rot = JSON.parse(fs.readFileSync(arq, 'utf8')), dir = path.dirname(path.resolve(arq));
  const { spec, ev, deco, dur } = dirigir(rot);
  const ate = Number(flag('--ate', 0)); if (ate) { spec.dur = ate; spec.shots = spec.shots.filter((s) => s.t0 < ate); }
  fs.writeFileSync(path.join(dir, 'cenas.json'), JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, 'decupagem.md'), decupagem(rot, deco, dur));
  console.log(`decupagem: ${deco.length} planos, ${dur.toFixed(1)} s`);
  if (rest.includes('--so-diretor')) return;
  const scale = flag('--scale', '0.5'), frames = path.join(dir, 'frames');
  fs.rmSync(frames, { recursive: true, force: true });
  let r = spawnSync('node', [path.join(ROOT, 'tools/estudio/render-cenas.mjs'), path.join(dir, 'cenas.json'), frames, '--scale', scale, '--workers', flag('--workers', '4')], { stdio: 'inherit' });
  if (r.status) throw new Error('render falhou');
  sintetizar({ dur: spec.dur, bpm: spec.bpm, ev, dest: path.join(dir, 'som.wav') });
  const final = path.join(dir, ate ? 'previa.mp4' : 'final.mp4');
  const vf = 'scale=1080:1920:flags=lanczos,unsharp=5:5:0.7:5:5:0,noise=alls=6:allf=t,eq=contrast=1.05:saturation=1.06,vignette=PI/5';
  r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, 'f_%05d.jpg'), '-i', path.join(dir, 'som.wav'), '-vf', vf, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=9', '-t', String(spec.dur), '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], { stdio: 'inherit' });
  if (r.status) throw new Error('ffmpeg falhou');
  fs.rmSync(frames, { recursive: true, force: true });
  console.log('pronto:', path.relative(ROOT, final));
}
if (process.argv[1] && process.argv[1].endsWith('produzir.mjs')) main().catch((e) => { console.error(e.message || e); process.exit(1); });
