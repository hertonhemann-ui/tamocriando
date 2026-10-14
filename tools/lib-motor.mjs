// Carrega o motor de animação no Node (sem navegador): serve pra ler o catálogo e validar planos.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(ROOT, 'plugin/tamocriando-motion/engine');

export function carregarMotor() {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  const list = JSON.parse(fs.readFileSync(path.join(ENGINE, 'scripts.json'), 'utf8'));
  for (const f of list) vm.runInContext(fs.readFileSync(path.join(ENGINE, f), 'utf8'), ctx, { filename: f });
  return ctx.TC;
}

export function carregarSinais() {
  return JSON.parse(fs.readFileSync(path.join(ENGINE, 'sinais.json'), 'utf8'));
}
