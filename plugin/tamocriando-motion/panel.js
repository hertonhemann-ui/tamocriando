/*
 * Painel do Premiere: escolhe a animação, edita o texto e as curvas,
 * renderiza PNG com alpha (já com o "jeito de câmera") direto na pasta do
 * projeto e manda o Premiere importar no playhead.
 */
(function () {
  'use strict';

  var cep = window.__adobe_cep__ || null;
  var req = typeof window.require === 'function' ? window.require : null;
  var fs = null, path = null, os = null, Buf = null;
  try {
    if (req) { fs = req('fs'); path = req('path'); os = req('os'); Buf = window.Buffer || req('buffer').Buffer; }
  } catch (e) { fs = null; }

  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem storage */ } }
  };

  var state = {
    brand: store.get('tc.brand', TC.defaultBrand),
    cat: store.get('tc.cat', 'todos'),
    fmt: store.get('tc.fmt', 'auto'),
    bd: store.get('tc.bd', 'video'),
    id: null,
    params: {},
    dur: null,
    seq: null,
    playing: true,
    t: 0,
    clock: 0,
    busy: false,
    hover: null,
    // câmera (escala do painel): blur em fração do quadro, o resto de 0 a 100. Cada animação guarda a sua.
    fx: Object.assign({}, TC.fxUIDefaults, store.get('tc.fx', {}))
  };
  if (!TC.brands[state.brand]) state.brand = TC.defaultBrand;

  // dois renderizadores: um pra prévia (leve), outro pro render final
  var previewR = new TC.Renderer(), exportR = new TC.Renderer();
  var curveEds = [];

  function fxFor(samples, fps) { return TC.fxFromUI(state.fx, samples, fps); }
  function seqFps() { return (state.seq && state.seq.hasSequence && state.seq.fps) || 30; }

  // ------------------------------------------------------------------
  // ponte com o ExtendScript
  // ------------------------------------------------------------------
  function jsx(script) {
    return new Promise(function (resolve) {
      if (!cep) { resolve(null); return; }
      cep.evalScript(script, function (r) {
        try { resolve(JSON.parse(r)); } catch (e) { resolve({ ok: false, error: String(r) }); }
      });
    });
  }
  var q = JSON.stringify;

  function fmtNum(n, d) { return Number(n).toFixed(d).replace('.', ','); }

  function refreshSeq() {
    var bar = document.querySelector('.seqbar');
    if (!cep) {
      bar.className = 'seqbar none';
      $('seqinfo').textContent = 'Modo navegador: só pré-visualização';
      return Promise.resolve(null);
    }
    return jsx('tc_info()').then(function (r) {
      state.seq = r && r.ok ? r : null;
      if (state.seq && state.seq.hasSequence) {
        bar.className = 'seqbar ok';
        $('seqinfo').textContent = state.seq.name + ' · ' + state.seq.width + '×' + state.seq.height + ' · ' + fmtNum(state.seq.fps, 2) + ' fps';
      } else {
        bar.className = 'seqbar none';
        $('seqinfo').textContent = r && !r.ok ? 'Erro: ' + r.error : 'Nenhuma sequência aberta';
      }
      return state.seq;
    });
  }

  // tamanho final do render
  function dims() {
    if (state.fmt !== 'auto' && TC.formats[state.fmt]) return TC.formats[state.fmt];
    if (state.seq && state.seq.hasSequence && state.seq.width) return { w: state.seq.width, h: state.seq.height };
    return TC.formats['9:16'];
  }

  // ------------------------------------------------------------------
  // marcas
  // ------------------------------------------------------------------
  function buildBrands() {
    var sel = $('brand');
    sel.innerHTML = '';
    Object.keys(TC.brands).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = TC.brands[k].name;
      sel.appendChild(o);
    });
    sel.value = state.brand;
    sel.hidden = Object.keys(TC.brands).length < 2;
    sel.onchange = function () {
      state.brand = sel.value; store.set('tc.brand', state.brand);
      drawMark();
      if (state.id) loadParams(state.id);
      drawThumbs();
      if (state.id) buildFields();
    };
  }

  // ------------------------------------------------------------------
  // banco (grade de cards)
  // ------------------------------------------------------------------
  function buildCats() {
    var nav = $('cats');
    nav.innerHTML = '';
    var cats = [{ id: 'todos', name: 'Todos' }].concat(TC.categories);
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c.name;
      b.setAttribute('aria-pressed', String(state.cat === c.id));
      b.onclick = function () { state.cat = c.id; store.set('tc.cat', c.id); buildCats(); buildGrid(); };
      nav.appendChild(b);
    });
  }

  var cards = [];
  function buildGrid() {
    var grid = $('grid');
    grid.innerHTML = '';
    cards = [];
    TC.list().forEach(function (tpl) {
      if (state.cat !== 'todos' && tpl.category !== state.cat) return;
      var card = document.createElement('button');
      card.type = 'button'; card.className = 'card';
      var cv = document.createElement('canvas');
      var meta = document.createElement('div'); meta.className = 'meta';
      var cat = TC.categories.filter(function (c) { return c.id === tpl.category; })[0];
      meta.innerHTML = '<div class="name"></div><div class="cat"></div>';
      meta.firstChild.textContent = tpl.name;
      meta.lastChild.textContent = cat ? cat.name : '';
      card.appendChild(cv); card.appendChild(meta);
      card.onclick = function () { openEditor(tpl.id); };
      card.onmouseenter = function () { state.hover = { id: tpl.id, cv: cv, start: performance.now() }; };
      card.onmouseleave = function () { if (state.hover && state.hover.cv === cv) { state.hover = null; drawThumb(cv, tpl.id, TC.templates[tpl.id].thumb); } };
      grid.appendChild(card);
      cards.push({ id: tpl.id, cv: cv });
    });
    drawThumbs();
  }

  function thumbSize(cv) {
    var d = dims();
    var cssW = cv.clientWidth || 140;
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(cssW * dpr), h = Math.round(w * d.h / d.w);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w: w, h: h };
  }

  function paramsFor(id) {
    var saved = store.get('tc.p.' + state.brand + '.' + id, null);
    var p = TC.defaults(id, TC.brands[state.brand]);
    if (saved) for (var k in saved) if (k in p) p[k] = saved[k];
    return p;
  }

  function drawThumb(cv, id, t) {
    var s = thumbSize(cv);
    var ctx = cv.getContext('2d');
    TC.renderFrame(ctx, id, { w: s.w, h: s.h, t: t, params: paramsFor(id), brand: state.brand, preview: true, backdrop: state.bd });
  }

  function drawThumbs() {
    cards.forEach(function (c) { drawThumb(c.cv, c.id, TC.templates[c.id].thumb); });
  }

  // ------------------------------------------------------------------
  // editor
  // ------------------------------------------------------------------
  function loadParams(id) {
    state.params = paramsFor(id);
    var savedDur = store.get('tc.d.' + id, null);
    state.dur = savedDur || TC.templates[id].duration;
  }
  function saveParams() {
    store.set('tc.p.' + state.brand + '.' + state.id, state.params);
    store.set('tc.d.' + state.id, state.dur);
  }

  function openEditor(id) {
    state.id = id;
    var tpl = TC.templates[id];
    loadParams(id);
    $('library').hidden = true;
    $('editor').hidden = false;
    $('ed-title').textContent = tpl.name;
    $('ed-desc').textContent = tpl.description || '';
    $('ed-uso').textContent = tpl.uso || '';
    buildFields();
    $('drag-hint').hidden = !tpl.drag;
    state.fx = Object.assign({}, TC.fxUIDefaults, store.get('tc.fx', {}), store.get('tc.fx.' + id, {}));
    syncFx();
    state.playing = true; state.clock = performance.now();
    $('play').textContent = '❚❚';
    status('');
    sizeStage();
    window.scrollTo(0, 0);
  }

  function closeEditor() {
    state.id = null;
    $('editor').hidden = true;
    $('library').hidden = false;
    drawThumbs();
  }

  function buildFields() {
    var tpl = TC.templates[state.id];
    var form = $('fields');
    form.innerHTML = '';
    curveEds.forEach(function (ed) { ed.destroy(); });
    curveEds = [];
    var box = $('curves');
    box.innerHTML = '';
    tpl.params.forEach(function (p) {
      if (p.type === 'curve') { buildCurve(box, p); return; }
      var wrap = document.createElement('label');
      wrap.className = 'field';
      var lab = document.createElement('span');
      lab.textContent = p.label;
      var input;
      if (p.type === 'select') {
        input = document.createElement('select');
        p.options.forEach(function (o) { var op = document.createElement('option'); op.value = o; op.textContent = o; input.appendChild(op); });
      } else if (p.type === 'textarea') {
        input = document.createElement('textarea'); input.rows = 3;
      } else {
        input = document.createElement('input');
        input.type = p.type === 'number' ? 'number' : 'text';
        if (p.min !== undefined) input.min = p.min;
        if (p.max !== undefined) input.max = p.max;
      }
      input.value = state.params[p.key] === undefined ? '' : state.params[p.key];
      input.dataset.key = p.key;
      var put = function () {
        state.params[p.key] = p.type === 'number' ? Number(input.value) : input.value;
        saveParams();
      };
      input.addEventListener('input', put);
      input.addEventListener('change', put);
      wrap.appendChild(lab); wrap.appendChild(input);
      form.appendChild(wrap);
    });
    $('curves').parentNode.hidden = !curveEds.length;
    $('dur').value = state.dur;
    $('dur').min = tpl.minDur;
  }

  // curva de entrada/saída: editor com alças (o valor guardado é o cubic-bezier)
  function buildCurve(box, p) {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var lab = document.createElement('span');
    lab.textContent = p.label;
    wrap.appendChild(lab);
    box.appendChild(wrap);
    var ed = new TC.CurveEditor(wrap, {
      value: state.params[p.key],
      onChange: function (v) { state.params[p.key] = v; saveParams(); }
    });
    ed.key = p.key;
    curveEds.push(ed);
  }

  function sizeStage() {
    var cv = $('stage');
    var wrap = cv.parentNode;
    var d = dims();
    var maxW = wrap.clientWidth || 360;
    var maxH = Math.max(220, window.innerHeight * 0.5);
    var cssW = maxW, cssH = cssW * d.h / d.w;
    if (cssH > maxH) { cssH = maxH; cssW = cssH * d.w / d.h; }
    var dpr = Math.min(1.5, window.devicePixelRatio || 1); // prévia leve; o render sai no tamanho real
    cv.style.width = Math.round(cssW) + 'px';
    cv.style.height = Math.round(cssH) + 'px';
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
  }

  function currentDur() {
    var tpl = TC.templates[state.id];
    var d = Number(state.dur) || tpl.duration;
    return Math.max(tpl.minDur, d);
  }

  // ------------------------------------------------------------------
  // loop de animação (prévia do editor + card em hover)
  // ------------------------------------------------------------------
  function frame(now) {
    requestAnimationFrame(frame);
    if (state.busy) return; // durante o render a prévia fica parada
    if (state.id && !$('editor').hidden) {
      var dur = currentDur();
      if (state.playing) {
        var cycle = dur + 0.6;
        state.t = ((now - state.clock) / 1000) % cycle;
        $('scrub').value = Math.round(Math.min(1, state.t / dur) * 1000);
      }
      var cv = $('stage');
      previewR.render(cv.getContext('2d'), state.id, {
        w: cv.width, h: cv.height, t: Math.min(state.t, dur), dur: dur,
        params: state.params, brand: state.brand, preview: true, backdrop: state.bd,
        fx: fxFor(3, seqFps())
      });
      $('time').textContent = fmtNum(Math.min(state.t, dur), 1) + 's';
    } else if (state.hover) {
      var tpl = TC.templates[state.hover.id];
      var tt = ((now - state.hover.start) / 1000) % (tpl.duration + 0.5);
      drawThumb(state.hover.cv, state.hover.id, Math.min(tt, tpl.duration));
    }
  }

  // ------------------------------------------------------------------
  // render pro disco + import
  // ------------------------------------------------------------------
  function status(msg, kind) {
    var el = $('status');
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  function progress(k) {
    $('progress').hidden = k === null;
    $('bar').style.width = Math.round((k || 0) * 100) + '%';
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function pad5(n) { n = String(n); while (n.length < 5) n = '0' + n; return n; }
  function stampNow() {
    var d = new Date();
    function p2(x) { return (x < 10 ? '0' : '') + x; }
    return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  }
  function mkdirp(dir) {
    if (fs.existsSync(dir)) return;
    mkdirp(path.dirname(dir));
    fs.mkdirSync(dir);
  }
  function summary(tpl, params) {
    for (var i = 0; i < tpl.params.length; i++) {
      var p = tpl.params[i];
      if ((p.type === 'text' || p.type === 'textarea') && params[p.key]) {
        var s = String(params[p.key]).replace(/\s+/g, ' ').trim();
        return s.length > 26 ? s.slice(0, 25) + '…' : s;
      }
    }
    return '';
  }

  function fxUIFor(id) { return Object.assign({}, TC.fxUIDefaults, store.get('tc.fx', {}), store.get('tc.fx.' + id, {})); }

  /*
   * Renderiza uma animação em PNG na pasta do projeto e manda o Premiere importar.
   *  o: { id, params, dur, place, at (s na sequência, opcional), track, fx (escala do painel), onProgress(k) }
   */
  function renderClip(o) {
    var tpl = TC.templates[o.id];
    return refreshSeq().then(function (info) {
      if (o.place && !(info && info.hasSequence)) throw new Error('Abre uma sequência na timeline antes.');
      var d = dims();
      var fps = (info && info.hasSequence && info.fps) || 30;
      var dur = Math.max(tpl.minDur, Number(o.dur) || tpl.duration);
      var frames = Math.max(1, Math.round(dur * fps));
      var base = info && info.projectPath ? path.dirname(info.projectPath) : path.join(os.homedir(), 'Documents');
      var stamp = tpl.id + '_' + stampNow();
      var outDir = path.join(base, 'TamoCriando_Motion', stamp);
      mkdirp(outDir);
      var params = Object.assign(TC.defaults(o.id, TC.brands[state.brand]), o.params || {});
      var fx = TC.fxFromUI(o.fx, TC.fxDefaults.samples, fps);

      var cv = document.createElement('canvas');
      cv.width = d.w; cv.height = d.h;
      var ctx = cv.getContext('2d');
      var i = 0;
      var t0 = performance.now();
      if (o.onStart) o.onStart({ frames: frames, w: d.w, h: d.h });

      function step() {
        var until = performance.now() + 60;
        while (i < frames && performance.now() < until) {
          exportR.render(ctx, tpl.id, { w: d.w, h: d.h, t: i / fps, dur: dur, params: params, brand: state.brand, fx: fx });
          var b64 = cv.toDataURL('image/png').slice('data:image/png;base64,'.length);
          fs.writeFileSync(path.join(outDir, stamp + '_' + pad5(i) + '.png'), Buf.from(b64, 'base64'));
          i++;
        }
        if (o.onProgress) o.onProgress(i / frames);
        if (i < frames) return tick().then(step);
        return null;
      }

      return step().then(function () {
        var secs = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',');
        if (o.onRendered) o.onRendered(secs);
        var first = path.join(outDir, stamp + '_' + pad5(0) + '.png');
        var name = tpl.name + (summary(tpl, params) ? ' · ' + summary(tpl, params) : '');
        var args = [q(first), fps, q(name), frames, o.track === undefined ? -1 : o.track, o.place ? 'true' : 'false', q('Tamo Criando Motion'), q(stamp)];
        if (o.at !== undefined && o.at !== null) args.push(Number(o.at));
        return jsx('tc_insert(' + args.join(',') + ')').then(function (r) {
          if (!r || !r.ok) throw new Error(r ? r.error : 'Sem resposta do Premiere.');
          r.dur = dur;
          return r;
        });
      });
    });
  }

  function render(place) {
    if (state.busy) return;
    if (!cep || !fs) {
      status('Isso aqui é a prévia no navegador. Pra inserir, abre o painel dentro do Premiere (Janela › Extensões › Tamo Criando Motion).', 'err');
      return;
    }
    var tpl = TC.templates[state.id];
    state.busy = true;
    $('insert').disabled = true; $('importOnly').disabled = true;
    status('Lendo a sequência…');
    renderClip({
      id: state.id, params: state.params, dur: currentDur(), place: place, track: Number($('track').value), fx: state.fx,
      onStart: function (i) { status('Renderizando ' + i.frames + ' frames em ' + i.w + '×' + i.h + '…'); progress(0); },
      onProgress: progress,
      onRendered: function (secs) { status('Render pronto em ' + secs + 's. Importando…'); }
    }).then(function (r) {
      var cut = tpl.cut ? ' O corte entre os clipes fica em ' + fmtNum(r.dur * tpl.cut, 2) + 's.' : '';
      status(r.placed ? 'Pronto: V' + r.track + ', no playhead.' + cut : 'Pronto: está no bin "' + r.bin + '".', 'ok');
    }).catch(function (e) {
      status(e && e.message ? e.message : String(e), 'err');
    }).then(function () {
      state.busy = false;
      $('insert').disabled = false; $('importOnly').disabled = false;
      setTimeout(function () { if (!state.busy) progress(null); }, 1200);
    });
  }

  // ------------------------------------------------------------------
  // plano (animações a partir da transcrição): ver, marcar na timeline, inserir
  // ------------------------------------------------------------------
  var plan = { data: null, items: [] };

  function planStatus(msg, kind) { var el = $('plan-status'); el.textContent = msg || ''; el.className = 'status' + (kind ? ' ' + kind : ''); }

  function checkCue(c) {
    var tpl = TC.templates[c.animacao], msgs = [];
    if (!tpl) return { ok: false, msgs: ['animação "' + c.animacao + '" não existe no banco'] };
    if (typeof c.t !== 'number' || c.t < 0) return { ok: false, msgs: ['tempo inválido'] };
    var dur = typeof c.dur === 'number' ? c.dur : tpl.duration;
    if (dur < tpl.minDur) msgs.push('duração menor que o mínimo (' + tpl.minDur + ' s): vai ser ajustada');
    Object.keys(c.params || {}).forEach(function (k) {
      var def = tpl.params.filter(function (p) { return p.key === k; })[0];
      if (!def) msgs.push('campo "' + k + '" não existe aqui e será ignorado');
      else if (def.type === 'select' && def.options.indexOf(c.params[k]) < 0) msgs.push('"' + k + '" = "' + c.params[k] + '" não é uma opção');
    });
    return { ok: true, msgs: msgs, tpl: tpl, dur: Math.max(tpl.minDur, dur) };
  }

  function loadPlan() {
    var raw = $('plan-json').value.trim();
    if (!raw) { planStatus('Cola o plano (o JSON que o Claude devolveu) ou abre o arquivo.', 'err'); return; }
    var data;
    try { data = JSON.parse(raw); } catch (e) { planStatus('Isso não é um JSON válido: ' + e.message, 'err'); return; }
    if (!data || !Array.isArray(data.cues)) { planStatus('Faltou a lista "cues" no plano.', 'err'); return; }
    plan.data = data;
    plan.items = data.cues.map(function (c) { var ck = checkCue(c); return { cue: c, ck: ck, on: ck.ok }; });
    var list = $('plan-list');
    list.innerHTML = '';
    plan.items.forEach(function (it, i) {
      var li = document.createElement('li');
      li.className = it.ck.ok ? '' : 'bad';
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = it.on; cb.disabled = !it.ck.ok; cb.id = 'pc' + i;
      cb.onchange = function () { it.on = cb.checked; };
      var lab = document.createElement('label'); lab.htmlFor = cb.id;
      var nm = it.ck.ok ? it.ck.tpl.name : it.cue.animacao;
      lab.innerHTML = '<b></b> <span class="t"></span><i></i>';
      lab.querySelector('b').textContent = nm;
      lab.querySelector('.t').textContent = fmtNum(it.cue.t, 1) + ' s' + (it.ck.ok ? ' · ' + fmtNum(it.ck.dur, 1) + ' s' : '');
      lab.querySelector('i').textContent = it.cue.fala ? '“' + it.cue.fala + '”' : (it.cue.porque || '');
      li.appendChild(cb); li.appendChild(lab);
      if (it.ck.msgs.length) { var w = document.createElement('div'); w.className = 'warn'; w.textContent = it.ck.msgs.join(' · '); li.appendChild(w); }
      list.appendChild(li);
    });
    var novas = data.novas || [];
    $('plan-novas').hidden = !novas.length;
    $('plan-novas-list').innerHTML = '';
    novas.forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = (n.nome || '?') + ' (' + fmtNum(n.t || 0, 1) + ' s): ' + (n.descricao || n.porque || '');
      $('plan-novas-list').appendChild(li);
    });
    $('plan-actions').hidden = false;
    var bad = plan.items.filter(function (x) { return !x.ck.ok; }).length;
    planStatus(plan.items.length + ' animações no plano' + (bad ? ', ' + bad + ' com problema (desmarcadas)' : '') + '.', bad ? 'err' : 'ok');
  }

  function planOffset() { return Number($('plan-offset').value) || 0; }

  function planMarkers() {
    if (!cep) { planStatus('Abre o painel dentro do Premiere pra pôr marcadores.', 'err'); return; }
    var items = plan.items.filter(function (x) { return x.ck.ok; }).map(function (x) {
      return { t: x.cue.t, dur: x.ck.dur, name: x.ck.tpl.name, comment: (x.cue.fala ? '“' + x.cue.fala + '” ' : '') + (x.cue.porque || '') };
    });
    jsx('tc_markers(' + JSON.stringify(items) + ',' + planOffset() + ')').then(function (r) {
      if (!r || !r.ok) planStatus(r ? r.error : 'Sem resposta do Premiere.', 'err');
      else planStatus(r.count + ' marcadores na sequência.', 'ok');
    });
  }

  function planInsert() {
    if (state.busy) return;
    if (!cep || !fs) { planStatus('Abre o painel dentro do Premiere pra inserir.', 'err'); return; }
    var todo = plan.items.filter(function (x) { return x.on && x.ck.ok; });
    if (!todo.length) { planStatus('Marca pelo menos uma animação.', 'err'); return; }
    state.busy = true;
    $('plan-insert').disabled = true; $('plan-markers').disabled = true;
    var off = planOffset(), n = 0, failed = [];
    function next() {
      if (n >= todo.length) return Promise.resolve();
      var it = todo[n++], tag = n + '/' + todo.length + ' ' + it.ck.tpl.name;
      return renderClip({
        id: it.cue.animacao, params: it.cue.params, dur: it.cue.dur, place: true, at: off + it.cue.t, track: -1, fx: fxUIFor(it.cue.animacao),
        onStart: function (i) { planStatus('Renderizando ' + tag + ' (' + i.frames + ' frames)…'); progress(0); },
        onProgress: progress
      }).catch(function (e) { failed.push(it.ck.tpl.name + ': ' + (e && e.message ? e.message : e)); }).then(next);
    }
    next().then(function () {
      planStatus(failed.length ? (todo.length - failed.length) + ' inseridas, ' + failed.length + ' com erro: ' + failed.join(' | ') : todo.length + ' animações inseridas nos tempos do plano.', failed.length ? 'err' : 'ok');
    }).then(function () {
      state.busy = false; $('plan-insert').disabled = false; $('plan-markers').disabled = false;
      setTimeout(function () { if (!state.busy) progress(null); }, 1200);
    });
  }

  function openPlan() {
    state.id = null;
    $('editor').hidden = true; $('library').hidden = true; $('plan').hidden = false;
    if (state.seq && state.seq.hasSequence && !$('plan-offset').dataset.touched) $('plan-offset').value = '0';
  }
  function closePlan() { $('plan').hidden = true; $('library').hidden = false; drawThumbs(); }

  // ------------------------------------------------------------------
  // eventos
  // ------------------------------------------------------------------
  function wire() {
    TC.attachDrag($('stage'), {
      tpl: function () { return state.id && !$('editor').hidden ? TC.templates[state.id] : null; },
      params: function () { return state.params; },
      set: function (k, v) {
        state.params[k] = v; saveParams();
        var el = document.querySelector('#fields [data-key="' + k + '"]');
        if (el) el.value = v;
      }
    });
    $('back').onclick = closeEditor;
    $('open-plan').onclick = openPlan;
    $('plan-back').onclick = closePlan;
    $('plan-load').onclick = loadPlan;
    $('plan-markers').onclick = planMarkers;
    $('plan-insert').onclick = planInsert;
    $('plan-offset').oninput = function () { $('plan-offset').dataset.touched = '1'; };
    $('plan-playhead').onclick = function () {
      refreshSeq().then(function (i) { if (i && i.hasSequence) { $('plan-offset').value = (Math.round(i.playhead * 100) / 100); $('plan-offset').dataset.touched = '1'; } });
    };
    $('plan-file').onchange = function () {
      var f = $('plan-file').files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { $('plan-json').value = String(rd.result); loadPlan(); };
      rd.readAsText(f);
    };
    $('refresh').onclick = function () { refreshSeq().then(function () { if (state.id) sizeStage(); else buildGrid(); }); };
    $('play').onclick = function () {
      state.playing = !state.playing;
      $('play').textContent = state.playing ? '❚❚' : '▶';
      if (state.playing) state.clock = performance.now() - state.t * 1000;
    };
    $('scrub').oninput = function () {
      state.playing = false; $('play').textContent = '▶';
      state.t = Number($('scrub').value) / 1000 * currentDur();
    };
    $('dur').oninput = function () {
      var v = Number($('dur').value);
      if (v > 0) { state.dur = v; saveParams(); }
    };
    $('fmt').value = state.fmt;
    $('fmt').onchange = function () { state.fmt = $('fmt').value; store.set('tc.fmt', state.fmt); sizeStage(); };
    $('bd').value = state.bd;
    $('bd').onchange = function () { state.bd = $('bd').value; store.set('tc.bd', state.bd); };
    $('insert').onclick = function () { render(true); };
    $('importOnly').onclick = function () { render(false); };
    $('reset').onclick = function () {
      store.set('tc.p.' + state.brand + '.' + state.id, null);
      store.set('tc.d.' + state.id, null);
      store.set('tc.fx.' + state.id, null);
      state.fx = Object.assign({}, TC.fxUIDefaults);
      loadParams(state.id); buildFields(); syncFx();
    };
    wireFx();
    window.addEventListener('resize', function () { if (state.id) sizeStage(); else drawThumbs(); });
    window.addEventListener('focus', function () { refreshSeq(); });
  }

  var FX_KEYS = [['blur', 'fx-blur'], ['edge', 'fx-edge'], ['aberration', 'fx-ab'], ['lens', 'fx-lens'], ['displace', 'fx-disp'], ['noise', 'fx-noise']];
  function syncFx() {
    FX_KEYS.forEach(function (kv) {
      var el = $(kv[1]), v = state.fx[kv[0]];
      if (kv[0] === 'blur') { el.value = String(v); if (el.value === '') el.value = '0.5'; }
      else { el.value = v; var lab = $(kv[1] + '-v'); if (lab) lab.textContent = Number(v) === 0 ? 'desligado' : v; }
    });
    var cur = JSON.stringify(FX_KEYS.map(function (kv) { return Number(state.fx[kv[0]]); }));
    var match = '';
    Object.keys(TC.fxPresets).forEach(function (k) {
      var pv = TC.fxPresets[k].v;
      if (JSON.stringify(FX_KEYS.map(function (kv) { return pv[kv[0]]; })) === cur) match = k;
    });
    $('fx-preset').value = match;
  }
  function wireFx() {
    var sel = $('fx-preset');
    sel.innerHTML = '<option value="">personalizado</option>';
    Object.keys(TC.fxPresets).forEach(function (k) {
      var o = document.createElement('option'); o.value = k; o.textContent = TC.fxPresets[k].label; sel.appendChild(o);
    });
    function put() {
      FX_KEYS.forEach(function (kv) { state.fx[kv[0]] = Number($(kv[1]).value); });
      if (state.id) store.set('tc.fx.' + state.id, state.fx);
      store.set('tc.fx', state.fx);
      syncFx();
    }
    FX_KEYS.forEach(function (kv) { $(kv[1]).oninput = put; $(kv[1]).onchange = put; });
    sel.onchange = function () {
      if (!TC.fxPresets[sel.value]) return;
      state.fx = Object.assign({}, TC.fxPresets[sel.value].v);
      if (state.id) store.set('tc.fx.' + state.id, state.fx);
      store.set('tc.fx', state.fx);
      syncFx();
    };
    syncFx();
  }

  // a chama no canto do painel
  function drawMark() {
    var cv = $('mark');
    if (!cv) return;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.save();
    c.translate(cv.width / 2, cv.height / 2);
    c.scale(cv.height * 0.92, cv.height * 0.92);
    c.beginPath();
    TC.flamePath(c, {});
    c.fillStyle = TC.brands[state.brand].colors.ember;
    c.fill();
    c.restore();
  }

  // tema do Premiere (cor de fundo do painel)
  function applyHostSkin() {
    if (!cep || !cep.getHostEnvironment) return;
    try {
      var env = JSON.parse(cep.getHostEnvironment());
      var c = env.appSkinInfo.panelBackgroundColor.color;
      var hex = '#' + [c.red, c.green, c.blue].map(function (v) { v = Math.round(v).toString(16); return v.length < 2 ? '0' + v : v; }).join('');
      document.documentElement.style.setProperty('--bg', hex);
    } catch (e) { /* mantém o padrão */ }
  }

  Promise.all([TC.loadFonts(TC.brands[state.brand]), TC.loadFlameFrames()]).then(function () {
    applyHostSkin();
    drawMark();
    buildBrands();
    buildCats();
    wire();
    refreshSeq().then(function () { buildGrid(); });
    buildGrid();
    requestAnimationFrame(frame);
  });

  // pra testes automatizados
  window.TCPanel = { state: state, openEditor: openEditor, render: render, refreshSeq: refreshSeq, loadPlan: loadPlan, plan: plan, curves: function () { return curveEds; } };
})();
