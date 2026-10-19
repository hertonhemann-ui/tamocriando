#!/usr/bin/env node
/*
 *   node tools/estudio-extra.mjs pacote  estudio/producoes/<id> [--capa 2.2]   gera postagem.json, postar.sh e capa.jpg se faltar (NÃO envia nada)
 *   node tools/estudio-extra.mjs aprender estudio/desempenho.csv       métricas -> estudio/memoria.json
 *   node tools/estudio-extra.mjs voz <id> "texto" [--saida arq.mp3]    ElevenLabs (precisa ELEVENLABS_API_KEY e voz; só no PC/Actions)
 *
 * desempenho.csv: id,pilar,views,retencao,envios,salvos   (retencao 0 a 1; envios e salvos por mil views)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib-motor.mjs';

const [, , cmd, alvo, ...rest] = process.argv;
const flagCapa = rest.includes('--capa') ? rest[rest.indexOf('--capa') + 1] : '2.2';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

if (cmd === 'pacote') {
  const dir = path.resolve(alvo), rot = J(path.join(dir, 'roteiro.json')), est = J(path.join(ROOT, 'estudio/estrategia.json'));
  const txt = JSON.stringify(rot.falas || rot.beats || []).toLowerCase(); const bad = est.regras.nuncaNoVideo.filter((w) => new RegExp('(^|[^a-zà-ú])' + w + '([^a-zà-ú]|$)').test(txt));
  if (bad.length) { console.error('o vídeo pede ação (' + bad.join(', ') + '): tira do roteiro'); process.exit(1); }
  const leg = rot.legenda || {};
  const post = {
    id: rot.id, estado: est.autonomia.modo === 'auto' ? 'pronto' : 'rascunho', aprovado: false,
    video: 'final.mp4', capa: 'capa.jpg',
    legenda: `${leg.texto || rot.titulo}\n\n${(leg.hashtags || []).map((h) => '#' + h).join(' ')}`,
    comentarioFixado: leg.comentarioFixado || est.cta[rot.funil] || '',
    horario: leg.horario || est.cadencia.janelas[0], plataformas: est.canais.shorts.plataformas
  };
  fs.writeFileSync(path.join(dir, 'postagem.json'), JSON.stringify(post, null, 2));
  // o motor 3D não gera capa: tira um quadro do gancho, depois que o texto já entrou
  const video = path.join(dir, 'final.mp4'), capa = path.join(dir, 'capa.jpg');
  if (fs.existsSync(video) && !fs.existsSync(capa)) {
    spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', flagCapa, '-i', video, '-frames:v', '1', '-q:v', '2', capa]);
  }
  // comando do Postiz como rascunho; fica num arquivo, ninguém roda sozinho
  fs.writeFileSync(path.join(dir, 'postar.sh'), `#!/bin/sh
# NÃO executado pelo estúdio. Rode à mão no PC depois de postiz auth:status e de revisar.
set -e
cd "$(dirname "$0")"
URL=$(postiz upload final.mp4 | jq -r '.path')
postiz posts:create -c "$(jq -r .legenda postagem.json)" -m "$URL" -s "$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t draft -i "ID_DO_CANAL"
`);
  console.log('pacote pronto (rascunho, nada enviado):', path.relative(ROOT, dir));
}

if (cmd === 'aprender') {
  const linhas = fs.readFileSync(alvo, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
  const por = {};
  for (const [, pilar, views, ret, env, sal] of linhas) {
    const nota = +ret * 0.5 + Math.min(+env / 20, 1) * 0.3 + Math.min(+sal / 20, 1) * 0.2; // retenção pesa mais; envio e salvo completam
    (por[pilar] ||= []).push(nota);
  }
  const med = Object.fromEntries(Object.entries(por).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]));
  const m = Math.max(...Object.values(med));
  const pesos = Object.fromEntries(Object.entries(med).map(([k, v]) => [k, +(0.4 + 0.6 * v / m).toFixed(2)])); // piso 0,4: nunca zera um pilar
  fs.writeFileSync(path.join(ROOT, 'estudio/memoria.json'), JSON.stringify({ atualizado: new Date().toISOString(), amostra: linhas.length, pesos }, null, 2));
  console.log('pesos por pilar:', pesos);
}

if (cmd === 'voz') {
  const key = process.env.ELEVENLABS_API_KEY, voz = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voz) { console.error('defina ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID (só no PC ou no Actions)'); process.exit(1); }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}/with-timestamps`, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ text: rest[0], model_id: 'eleven_multilingual_v2' }) });
  if (!r.ok) { console.error('erro', r.status); process.exit(1); }
  const j = await r.json();
  fs.writeFileSync(rest[rest.indexOf('--saida') + 1] || `${alvo}.mp3`, Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(`${alvo}.tempos.json`, JSON.stringify(j.alignment));
  console.log('voz e tempos salvos (não testado contra o serviço real)');
}
