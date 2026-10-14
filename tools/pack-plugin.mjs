#!/usr/bin/env node
/*
 * Gera dist/TamoCriando-Motion.zip: o plugin + instaladores, pronto pra mandar
 * pra outra máquina (ou pra um cliente, com a marca dele).
 *   node tools/pack-plugin.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, 'TamoCriando-Motion.zip');
fs.rmSync(out, { force: true });
const r = spawnSync('zip', ['-r', '-q', out, 'plugin/tamocriando-motion', 'install', 'docs/INSTALAR.md', '-x', '*.DS_Store'], { cwd: ROOT, stdio: 'inherit' });
if (r.error || r.status !== 0) {
  console.error('Não consegui rodar o "zip". No Windows, compacta manualmente as pastas plugin/ e install/.');
  process.exit(1);
}
console.log('Pacote:', path.relative(ROOT, out), `(${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
