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
    // câmera: desfoque (fração do frame), aberração e lente (0 a 100)
    fx: store.get('tc.fx', { blur: TC.fxDefaults.blur, aberration: Math.round(TC.fxDefaults.aberration * 100), lens: Math.round(TC.fxDefaults.lens * 100) })
  };
  if (!TC.brands[state.brand]) state.brand = TC.defaultBrand;

  // dois renderizadores: um pra prévia (leve), outro pro render final
  var previewR = new TC.Renderer(), exportR = new TC.Renderer();
  var curveEds = [];

  function fxFor(samples, fps) {
    return {
      blur: Number(state.fx.blur) || 0,
      samples: samples,
      fps: fps,
      aberration: (Number(state.fx.aberration) || 0) / 100,
      lens: (Number(state.fx.lens) || 0) / 100
    };
  }
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
    refreshSeq().then(function (info) {
      if (place && !(info && info.hasSequence)) throw new Error('Abre uma sequência na timeline antes.');
      var d = dims();
      var fps = (info && info.hasSequence && info.fps) || 30;
      var dur = currentDur();
      var frames = Math.max(1, Math.round(dur * fps));
      var base = info && info.projectPath ? path.dirname(info.projectPath) : path.join(os.homedir(), 'Documents');
      var stamp = tpl.id + '_' + stampNow();
      var outDir = path.join(base, 'TamoCriando_Motion', stamp);
      mkdirp(outDir);

      var cv = document.createElement('canvas');
      cv.width = d.w; cv.height = d.h;
      var ctx = cv.getContext('2d');
      var i = 0;
      var t0 = performance.now();
      status('Renderizando ' + frames + ' frames em ' + d.w + '×' + d.h + '…');
      progress(0);

      function step() {
        var until = performance.now() + 60;
        while (i < frames && performance.now() < until) {
          exportR.render(ctx, tpl.id, { w: d.w, h: d.h, t: i / fps, dur: dur, params: state.params, brand: state.brand, fx: fxFor(TC.fxDefaults.samples, fps) });
          var b64 = cv.toDataURL('image/png').slice('data:image/png;base64,'.length);
          fs.writeFileSync(path.join(outDir, stamp + '_' + pad5(i) + '.png'), Buf.from(b64, 'base64'));
          i++;
        }
        progress(i / frames);
        if (i < frames) return tick().then(step);
        return null;
      }

      return step().then(function () {
        var secs = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',');
        status('Render pronto em ' + secs + 's. Importando…');
        var first = path.join(outDir, stamp + '_' + pad5(0) + '.png');
        var name = tpl.name + (summary(tpl, state.params) ? ' · ' + summary(tpl, state.params) : '');
        var args = [q(first), fps, q(name), frames, Number($('track').value), place ? 'true' : 'false', q('Tamo Criando Motion'), q(stamp)];
        return jsx('tc_insert(' + args.join(',') + ')').then(function (r) {
          if (!r || !r.ok) throw new Error(r ? r.error : 'Sem resposta do Premiere.');
          var cut = tpl.cut ? ' O corte entre os clipes fica em ' + fmtNum(dur * tpl.cut, 2) + 's.' : '';
          status(r.placed ? 'Pronto: V' + r.track + ', no playhead.' + cut : 'Pronto: está no bin "' + r.bin + '".', 'ok');
        });
      });
    }).catch(function (e) {
      status(e && e.message ? e.message : String(e), 'err');
    }).then(function () {
      state.busy = false;
      $('insert').disabled = false; $('importOnly').disabled = false;
      setTimeout(function () { if (!state.busy) progress(null); }, 1200);
    });
  }

  // ------------------------------------------------------------------
  // eventos
  // ------------------------------------------------------------------
  function wire() {
    $('back').onclick = closeEditor;
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
      loadParams(state.id); buildFields();
    };
    wireFx();
    window.addEventListener('resize', function () { if (state.id) sizeStage(); else drawThumbs(); });
    window.addEventListener('focus', function () { refreshSeq(); });
  }

  function wireFx() {
    var blur = $('fx-blur'), ab = $('fx-ab'), lens = $('fx-lens');
    function show() {
      $('fx-ab-v').textContent = ab.value === '0' ? 'desligada' : ab.value;
      $('fx-lens-v').textContent = lens.value === '0' ? 'desligada' : lens.value;
    }
    function put() {
      state.fx = { blur: Number(blur.value), aberration: Number(ab.value), lens: Number(lens.value) };
      store.set('tc.fx', state.fx);
      show();
    }
    blur.value = String(state.fx.blur);
    if (blur.value === '') blur.value = String(TC.fxDefaults.blur);
    ab.value = state.fx.aberration; lens.value = state.fx.lens;
    blur.onchange = put; ab.oninput = put; lens.oninput = put;
    show();
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

  TC.loadFonts(TC.brands[state.brand]).then(function () {
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
  window.TCPanel = { state: state, openEditor: openEditor, render: render, refreshSeq: refreshSeq, curves: function () { return curveEds; } };
})();
