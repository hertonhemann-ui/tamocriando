/* Trilha e efeitos sintetizados em código, sincronizados com os cortes. Sem amostras, sem dependência. */
import fs from 'node:fs';
const SR = 44100;
const tau = Math.PI * 2;

function biquad(tipo, fc, Q) {
  const w = tau * fc / SR, c = Math.cos(w), a = Math.sin(w) / (2 * Q);
  let b0, b1, b2, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  if (tipo === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (tipo === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
let seed = 99; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function sintetizar({ dur, bpm, ev, dest }) {
  const N = Math.ceil(dur * SR), beat = 60 / bpm;
  const mL = new Float32Array(N), mR = new Float32Array(N), sL = new Float32Array(N), sR = new Float32Array(N);
  const duck = new Float32Array(N).fill(1);
  const add = (L, R, t, buf, g, pan = 0) => { const p = Math.floor(t * SR); for (let i = 0; i < buf.length && p + i < N; i++) { if (p + i < 0) continue; L[p + i] += buf[i] * g * (1 - Math.max(0, pan)); R[p + i] += buf[i] * g * (1 + Math.min(0, pan)); } };

  // ---- música: Am | F | C | G, dois compassos cada
  const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const bars = Math.ceil(dur / (beat * 4));
  for (let bar = 0; bar < bars; bar++) {
    const ch = prog[Math.floor(bar / 2) % 4], t0 = bar * beat * 4;
    // pad (só no 1º compasso de cada acorde, atravessa os dois)
    if (bar % 2 === 0) {
      const len = Math.floor(beat * 8 * SR), buf = new Float32Array(len);
      ch.forEach((n, k) => { [-0.07, 0.07].forEach((det) => { const f = hz(n + 12) * Math.pow(2, det / 12), lp = biquad('lp', 1100, 0.7); let ph = Math.random(); for (let i = 0; i < len; i++) { ph += f / SR; if (ph > 1) ph -= 1; buf[i] += lp((ph * 2 - 1) * 0.5) * 0.11; } }); });
      for (let i = 0; i < len; i++) { const x = i / len; buf[i] *= Math.min(1, x * 8) * Math.min(1, (1 - x) * 6); }
      add(mL, mR, t0, buf, 1, 0);
    }
    // baixo
    [0, 2.5].forEach((b) => { const len = Math.floor(beat * 1.6 * SR), buf = new Float32Array(len), f = hz(ch[0] - 12); for (let i = 0; i < len; i++) { const s = i / SR; buf[i] = Math.tanh(Math.sin(tau * f * s) * 1.6) * Math.exp(-s * 2.4) * 0.5; } add(mL, mR, t0 + b * beat, buf, 0.55, 0); });
    // arpejo em colcheias, começa no 3º compasso
    if (bar >= 2) for (let k = 0; k < 8; k++) {
      const n = ch[[0, 1, 2, 1, 2, 1, 0, 2][k]] + 24, len = Math.floor(SR * 0.9), buf = new Float32Array(len), per = Math.round(SR / hz(n)), line = new Float32Array(per).map(() => rnd());
      let idx = 0; for (let i = 0; i < len; i++) { const y = line[idx]; buf[i] = y; const nx = (idx + 1) % per; line[idx] = 0.5 * (line[idx] + line[nx]) * 0.996; idx = nx; }
      const lp = biquad('lp', 3200, 0.7); for (let i = 0; i < len; i++) buf[i] = lp(buf[i]);
      add(mL, mR, t0 + k * beat / 2, buf, 0.07, (k % 2 ? 0.5 : -0.5));
    }
    // pulso de brasa (bumbo suave em todo tempo) e chimbal nas contratempos
    for (let b = 0; b < 4; b++) {
      const tk = t0 + b * beat, len = Math.floor(SR * 0.3), kb = new Float32Array(len);
      for (let i = 0; i < len; i++) { const s = i / SR; kb[i] = Math.sin(tau * (46 + 90 * Math.exp(-s * 28)) * s) * Math.exp(-s * 11); }
      add(sL, sR, tk, kb, b % 2 ? 0.28 : 0.4, 0);
      const p = Math.floor(tk * SR); for (let i = 0; i < SR * 0.28 && p + i < N; i++) duck[p + i] = Math.min(duck[p + i], 0.45 + 0.55 * Math.min(1, i / (SR * 0.26)));
      const hh = new Float32Array(Math.floor(SR * 0.05)), hp = biquad('hp', 7000, 0.7); for (let i = 0; i < hh.length; i++) hh[i] = hp(rnd()) * Math.exp(-i / (SR * 0.011));
      add(sL, sR, tk + beat / 2, hh, 0.12, 0.3);
    }
  }
  for (let i = 0; i < N; i++) { const g = duck[i] * Math.min(1, i / (SR * 1.0)) * Math.min(1, (N - i) / (SR * 1.4)); mL[i] *= g; mR[i] *= g; }

  // ---- efeitos
  for (const e of ev) {
    if (e.tipo === 'whoosh') {
      const len = Math.floor(SR * 0.55), buf = new Float32Array(len); let bp = biquad('bp', 400, 1.1), last = 0;
      for (let i = 0; i < len; i++) { const x = i / len, f = 350 * Math.pow(14, x); if (i % 64 === 0) bp = biquad('bp', f, 1.1 + 2 * x); buf[i] = bp(rnd()) * Math.sin(Math.PI * x) ** 2 * 1.6; }
      add(sL, sR, e.t - 0.08, buf, 0.55, e.lado * 0.5);
    } else if (e.tipo === 'tick') {
      const len = Math.floor(SR * 0.05), buf = new Float32Array(len), f = 1500 + (e.k % 5) * 130; for (let i = 0; i < len; i++) buf[i] = Math.sin(tau * f * i / SR) * Math.exp(-i / (SR * 0.009));
      add(sL, sR, e.t, buf, 0.09, ((e.k % 3) - 1) * 0.3);
    } else if (e.tipo === 'shine') {
      const len = Math.floor(SR * 1.1), buf = new Float32Array(len); [1318.5, 1760, 2637, 3520].forEach((f, j) => { for (let i = 0; i < len; i++) buf[i] += Math.sin(tau * f * i / SR) * Math.exp(-i / (SR * (0.5 - j * 0.08))) * (0.5 / (j + 1)); });
      add(sL, sR, e.t, buf, 0.16, 0);
    } else if (e.tipo === 'boom') {
      const len = Math.floor(SR * 1.2), buf = new Float32Array(len), lp = biquad('lp', 900, 0.7);
      for (let i = 0; i < len; i++) { const s = i / SR; buf[i] = Math.sin(tau * (34 + 70 * Math.exp(-s * 7)) * s) * Math.exp(-s * 3.2) + lp(rnd()) * Math.exp(-s * 18) * 0.7; }
      add(sL, sR, e.t, buf, 0.95, 0);
      const p = Math.floor(e.t * SR); for (let i = 0; i < SR * 0.9 && p + i < N; i++) { const d = 0.35 + 0.65 * Math.min(1, i / (SR * 0.8)); mL[p + i] *= d; mR[p + i] *= d; }
    } else if (e.tipo === 'riser') {
      const len = Math.floor(SR * 1.3), buf = new Float32Array(len), hp = biquad('hp', 1800, 0.7); let ph = 0;
      for (let i = 0; i < len; i++) { const x = i / len; ph += (180 + 1100 * x * x) / SR; buf[i] = (hp(rnd()) * 0.5 + Math.sin(tau * ph) * 0.35) * x * x * (1 - Math.pow(Math.max(0, x - 0.97) / 0.03, 2)); }
      add(sL, sR, e.t, buf, 0.45, 0);
    }
  }

  // ---- mistura + reverb curta
  const out = Buffer.alloc(N * 4), dl = [Math.floor(SR * 0.037), Math.floor(SR * 0.053), Math.floor(SR * 0.071)], lines = dl.map((d) => new Float32Array(d)), idx = [0, 0, 0], lpv = biquad('lp', 3500, 0.7);
  for (let i = 0; i < N; i++) {
    const L = mL[i] + sL[i], R = mR[i] + sR[i], mono = lpv((L + R) * 0.5);
    let rev = 0; for (let k = 0; k < 3; k++) { const y = lines[k][idx[k]]; rev += y; lines[k][idx[k]] = mono + y * 0.62; idx[k] = (idx[k] + 1) % dl[k]; }
    const l = Math.tanh((L + rev * 0.16) * 1.1), r = Math.tanh((R + rev * 0.16) * 1.1);
    out.writeInt16LE(Math.round(l * 30000), i * 4); out.writeInt16LE(Math.round(r * 30000), i * 4 + 2);
  }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + out.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(out.length, 40);
  fs.writeFileSync(dest, Buffer.concat([h, out]));
}
