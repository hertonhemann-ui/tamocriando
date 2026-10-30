/* ================= SOM ================= */
let audio = null;
const PREFS_KEY = 'cafe-cantinho-prefs';
let prefs = { som: true };
try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { /* sem armazenamento */ }
function salvaPrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* ok */ } }
function sfx(tipo, extra = 0) {
  if (!prefs.som) return;
  try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { return; }
  const t = audio.currentTime;
  const tom = (f, d, tipoOnda = 'square', vol = 0.05, atraso = 0, f2) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = tipoOnda; o.frequency.setValueAtTime(f, t + atraso); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + atraso + d);
    g.gain.setValueAtTime(vol, t + atraso); g.gain.exponentialRampToValueAtTime(0.0001, t + atraso + d);
    o.connect(g).connect(audio.destination); o.start(t + atraso); o.stop(t + atraso + d + 0.03);
  };
  if (tipo === 'clique') tom(660, 0.05, 'square', 0.03);
  else if (tipo === 'moer') tom(110, 0.35, 'sawtooth', 0.035, 0, 70);
  else if (tipo === 'vapor') tom(900, 0.3, 'triangle', 0.02, 0, 1400);
  else if (tipo === 'pronto') { tom(880, 0.08, 'square', 0.04); tom(1320, 0.12, 'square', 0.04, 0.08); }
  else if (tipo === 'perfeito') { [988, 1319, 1760].forEach((f, i) => tom(f, 0.09, 'square', 0.045, i * 0.06)); }
  else if (tipo === 'caixa') { tom(1568, 0.06, 'square', 0.04); tom(2093, 0.14, 'square', 0.04, 0.06); }
  else if (tipo === 'combo') { const b = 440 * Math.pow(2, Math.min(extra, 12) / 12); tom(b, 0.08, 'square', 0.04); tom(b * 1.5, 0.12, 'square', 0.04, 0.07); }
  else if (tipo === 'erro') tom(150, 0.22, 'square', 0.05, 0, 90);
  else if (tipo === 'meta') { [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.12, 'square', 0.045, i * 0.09)); }
  else if (tipo === 'nivel') { [392, 523, 659, 784, 1047].forEach((f, i) => tom(f, 0.1, 'triangle', 0.06, i * 0.07)); }
  else if (tipo === 'limpa') { tom(300, 0.12, 'sawtooth', 0.025, 0, 600); tom(500, 0.12, 'sawtooth', 0.025, 0.12, 250); }
  else if (tipo === 'anota') { tom(1200, 0.04, 'square', 0.03); tom(1500, 0.05, 'square', 0.03, 0.06); }
  else if (tipo === 'miau') { tom(700, 0.18, 'triangle', 0.04, 0, 1100); tom(1000, 0.2, 'triangle', 0.03, 0.14, 600); }
  else if (tipo === 'sentar') tom(260, 0.09, 'triangle', 0.04, 0, 180);
  else if (tipo === 'porta') tom(1200, 0.25, 'triangle', 0.03, 0, 1000);
}

