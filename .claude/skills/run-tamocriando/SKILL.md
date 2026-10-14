---
name: run-tamocriando
description: Build, run, and drive tamocriando (Tamo Criando Motion) — the canvas animation engine, the Premiere Pro panel and the gallery. Use when asked to run or start the panel or the gallery, render, preview or screenshot an animation/template frame, test the Premiere plugin without Premiere, export a MOV, or run the smoke tests.
---

Tamo Criando Motion is a canvas animation engine (`plugin/tamocriando-motion/engine/`) wrapped by a Premiere Pro CEP panel (`plugin/tamocriando-motion/index.html`) and a static gallery (`gallery/`). There is no Premiere in this container: drive everything through **`.claude/skills/run-tamocriando/driver.mjs`**, which serves the repo, opens the pages in headless Chromium and, for the panel, fakes the Premiere host (`window.__adobe_cep__`) and Node's `fs`, so "Inserir no playhead" really renders and calls `tc_insert`.

All paths below are relative to the repo root.

## Prerequisites

Node 22 and ffmpeg (both already here), plus Playwright's Chromium (preinstalled at `/opt/pw-browsers` in this container; do not run `playwright install` here).

```bash
node --version      # v22.22.0
which ffmpeg        # /usr/bin/ffmpeg (only needed for MOV/WebP export)
```

## Setup

```bash
npm install --no-audit --no-fund   # installs playwright 1.56.1 (matches the preinstalled chromium-1194)
```

## Build

The panel has no build step. The gallery is generated from `gallery/galeria.html`:

```bash
node tools/build-gallery.mjs   # -> gallery/index.html (local) + dist/galeria.html (single file, engine inlined)
```

## Run (agent path)

Pipe commands to the driver, one per line. Exit code is 1 if any command failed.

**Panel, end to end** (pick an animation, edit a field, render + "insert" into the fake Premiere):

```bash
node .claude/skills/run-tamocriando/driver.mjs <<'EOF'
seq 1080x1920 29.97
open panel
ss painel-biblioteca
pick palavra-acesa
fill #fields input >> 1 | não marca
ss painel-palavra
click #insert
wait-status
calls
files
errors
quit
EOF
```

Expected: `status [status ok]: Pronto: V2, no playhead.`, a `tc_insert("/projetos/cliente/TamoCriando_Motion/<id>_<stamp>/<id>_<stamp>_00000.png",29.97…,…)` call, and `files` reporting `round(duration × fps)` PNGs (120 for `palavra-acesa`).

**Gallery** (build first):

```bash
node .claude/skills/run-tamocriando/driver.mjs <<'EOF'
open gallery
ss galeria
pick marca
sleep 800
ss galeria-editor
errors
quit
EOF
```

**Engine only** (what most template changes need; no UI):

```bash
node .claude/skills/run-tamocriando/driver.mjs <<'EOF'
list
frame marca 2.6 1080x1920
frame cinza-brasa 2.2 1080x1920 fx
frame palavra-acesa 1.2 1920x1080 destaque=não_marca fx
quit
EOF
```

Outputs (override with `TC_OUT=...`): screenshots `/tmp/tamocriando-run/shots/`, frames `/tmp/tamocriando-run/frames/`, panel PNGs `/tmp/tamocriando-run/panel-files/` (only after `save on`).

| command | what it does |
|---|---|
| `open panel\|gallery\|render` | serve repo + open page (`panel` gets the fake Premiere; viewport 400×900) |
| `seq 1080x1920 29.97` / `seq none` | fake active sequence; set **before** `open panel` (default 540×960 @ 29.97) |
| `pick <id>` | open the editor for a template id (panel or gallery) |
| `list` | template ids, categories, durations |
| `frame <id> [t] [WxH] [fx] [key=value]` | one engine frame on the preview backdrop; `fx` = default camera, `fx:cinema` (or `tremido`, `sujo`, `limpo`) = a preset, `fxo=blur:0,edge:60` = only what you list (0-100); `_` in values becomes a space; the output file name carries the params |
| `fill <css> >> <n> \| <text>` / `select <css> >> <n> \| <value>` | set the n-th matching field |
| `click <css>` / `click-text <text>` | DOM click (exact text wins over substring) |
| `drag <css> <dx> <dy>` | real mouse drag from the element's center (used for the drag-to-move text on `#stage` / `#ed-cv`) |
| `wait-text <css> <fragment>` | waits until the element's text contains the fragment (use `#plan-status inseridas` for plan inserts; `wait-status` only watches `#status`) |
| `wait <css>` / `wait-status` / `sleep <ms>` | `wait-status` waits for the panel's render+import to finish (`#status` gets `ok`/`err`) |
| `calls` | ExtendScript calls the panel made (`tc_info`, `tc_insert`) |
| `files` / `save on\|off` | PNG count/bytes the panel wrote; `save on` also writes them to disk |
| `ss [name]`, `text [css]`, `eval <js>`, `errors`, `quit` | screenshot, read text, run JS, page errors/404s, exit |

Interactive (same commands) under tmux:

```bash
tmux new-session -d -s tc -x 160 -y 40
tmux send-keys -t tc 'node .claude/skills/run-tamocriando/driver.mjs' Enter
timeout 30 bash -c 'until tmux capture-pane -t tc -p | grep -q "driver>"; do sleep 0.2; done'
tmux send-keys -t tc 'open gallery' Enter
timeout 60 bash -c 'until tmux capture-pane -t tc -p | grep -q "aberto: gallery"; do sleep 0.3; done'
tmux send-keys -t tc 'pick trilha-brasa' Enter
tmux send-keys -t tc 'ss galeria-trilha' Enter
timeout 30 bash -c 'until tmux capture-pane -t tc -p | grep -q "galeria-trilha.png"; do sleep 0.3; done'
tmux capture-pane -t tc -p
tmux send-keys -t tc 'quit' Enter
```

Commands typed while one is running queue up and run in order.

### Batch render (engine → files)

```bash
node tools/render.mjs --still 2.6 --only marca --formats 9:16 --out /tmp/tamocriando-run/render     # one full-res PNG
node tools/render.mjs --sheet --only virada --formats 16:9 --out /tmp/tamocriando-run/render         # contact sheet
node tools/render.mjs --only contador --formats 9:16 --codec png --out /tmp/tamocriando-run/render   # MOV (png, rgba), 150 frames, ~25 s with fx
```

Renders go through the same camera post-processing as the panel by default (`--blur 0.5 --aberration 35 --lens 20 --samples 6`); `--no-fx` gives raw engine frames (the `contador` MOV drops from ~25 s to ~5 s). Camera flags also include `--edge`, `--displace`, `--noise` (0-100) and `--fx-preset padrão|cinema|tremido|sujo|limpo`. Other flags (`--catalog`, `--gif`, `--params '{json}'`, `--fps`, `--times a,b,c`) are in the header of `tools/render.mjs`.

## Run (human path)

On a machine with Premiere: run `install/instalar-windows.bat` or `install/instalar-mac.command`, restart Premiere, open *Janela › Extensões › Tamo Criando Motion*. Not runnable here; `host/premiere.jsx` is only syntax-checked (see Test).

## Test

```bash
node tools/smoke-test.mjs
```

Expected: every line `ok` and `tudo certo` — all templates × 4 formats (raw and with fx) draw without throwing, panel/gallery script lists match `engine/scripts.json`, the panel renders the shortest template at 29.97 fps and calls `tc_insert`, the panel's curve editor ("faísca" preset) reaches `state.params.entrada`, the gallery shows every template and opens its editor with 2 curves, and `host/premiere.jsx` passes `node --check`. The gallery part needs `node tools/build-gallery.mjs` first (otherwise it prints `--  galeria não gerada` and skips).

## Gotchas

- **Script lists are hand-written in three places.** A new template file must be added to `plugin/tamocriando-motion/engine/scripts.json` *and* the `<script>` tags in `plugin/tamocriando-motion/index.html` and `gallery/galeria.html`, then `node tools/build-gallery.mjs`. If they drift, the panel silently shows fewer animations; the smoke test catches it.
- **Edit `gallery/galeria.html`, never `gallery/index.html` or `dist/galeria.html`** — those two are overwritten by the build.
- **`click-text` matches substrings**: `click-text Marca` used to hit the "Marcar" category chip and then `wait #editor` timed out. Use `pick <id>`.
- **Full-frame textured templates make huge PNGs**: `marca` (paper background) at 1080×1920 wrote 135 frames = 422 MB. That's why `save` defaults to off and the default fake sequence is 540×960. Clean up with `rm -rf /tmp/tamocriando-run`.
- **The gallery loads Google Fonts** (for the published single-file version). Without the container's proxy env (e.g. under `env -i`) `errors` shows `requestfailed: https://fonts.googleapis.com/…` + `ERR_CERT_AUTHORITY_INVALID`. Harmless: `gallery/index.html` also links the local `fonts.css`.
- **`fx` needs WebGL.** Headless Chromium here has it (SwiftShader). `frame … fx` prints whether WebGL was actually used; without it only motion blur is applied.
- **The fake Premiere answers by string prefix** (`tc_info`, `tc_insert`); a new ExtendScript function in `host/premiere.jsx` needs a matching branch in `cepMock()` in the driver.
- **Templates are pure functions of `t`**: `frame <id> <t>` is deterministic; `t` is clamped to `[0, duration]`.
- **Text drawn before the fonts load used to stick in the fallback face.** `S.textLayer` caches the rendered word; the gallery drew once before `TC.loadFonts` resolved and "Acender" stayed in a thin sans forever. `core.js` now clears the text caches on `document.fonts` `loadingdone` and after `TC.loadFonts`. Any new cache keyed on text must be cleared in `clearTextCache()` too.
- **Panel export is slow headless.** The panel renders through `TC.Renderer` (6 motion-blur subframes + a low-res motion mask + WebGL), ~0.5 s/frame at 1080×1920 on SwiftShader: `trilha-brasa` (165 frames) took ~80 s. Keep the default 540×960 fake sequence unless you need full size; `wait-status` waits up to 10 min.
- **Curve editors** are `.tc-curve` blocks inside `#curves` (panel) and `#ed-curves` (gallery); their preset buttons carry the preset label (`suave`, `brasa`, `faísca`, `fôlego`, `apagar`, `linear`). `eval TCPanel.curves()` returns the panel's editor instances.

## Troubleshooting

- **`ERRO: page.waitForSelector: Timeout … exceeded` after `click-text`**: it clicked something other than the card (see substring gotcha). Use `pick <id>`.
- **`status [status err]: Abre uma sequência na timeline antes.`**: the fake Premiere has no sequence (`seq none`). Expected; use `seq 1080x1920 29.97` before `open panel`, or click `#importOnly`.
- **`status [status err]: Cannot read properties of undefined (reading 'duration')`**: `#insert`/`#importOnly` clicked with no editor open. `pick <id>` first.
- **`[página] Failed to load resource: … 404` from `tools/render.mjs`** (or 404 lines in `errors`): `fonts.css` or a script list points to a file that no longer exists (hit after swapping fonts). Fix the reference.

## Plan from a transcript, and the flame frames

```bash
node tools/plano.mjs ler docs/exemplos/transcricao-exemplo.srt --out /tmp/tr.json
node tools/plano.mjs validar docs/exemplos/plano-exemplo.json --transcricao /tmp/tr.json   # exit 1 on errors
node tools/plano.mjs storyboard docs/exemplos/plano-exemplo.json --transcricao /tmp/tr.json --out /tmp/sb.html
node tools/importar-chama.mjs <grade.png> --grade 4x3 --previa /tmp/chama.png                 # then: node tools/importar-chama.mjs --limpar
```

Panel plan tab, end to end (fake Premiere): `click #open-plan`, put the JSON in `#plan-json`, `click #plan-load`, `fill #plan-offset >> 0 | 10`, `click #plan-insert`, `wait-text #plan-status inseridas`, `calls` (the `tc_insert` calls end with the placement second).

Gotchas learned here:
- Chromium text-input `fill` of long JSON is fine; to set the textarea from the driver use `eval document.querySelector('#plan-json').value = ...`.
- After a test import of flame frames always run `node tools/importar-chama.mjs --limpar` before committing, or the repo ships your test frames.
