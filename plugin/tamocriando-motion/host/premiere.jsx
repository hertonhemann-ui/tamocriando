/*
 * Tamo Criando Motion — lado do Premiere (ExtendScript)
 * O painel renderiza os PNGs; aqui só importamos e colocamos na timeline.
 */

var TC_TICKS_PER_SECOND = 254016000000;

// ExtendScript antigo não tem JSON: serializador mínimo
function tc_json(v) {
  if (v === null || v === undefined) return 'null';
  var t = typeof v;
  if (t === 'number') return isFinite(v) ? String(v) : 'null';
  if (t === 'boolean') return v ? 'true' : 'false';
  if (t === 'string') {
    return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
  }
  if (v instanceof Array) {
    var a = [];
    for (var i = 0; i < v.length; i++) a.push(tc_json(v[i]));
    return '[' + a.join(',') + ']';
  }
  var o = [];
  for (var k in v) if (v.hasOwnProperty(k)) o.push(tc_json(k) + ':' + tc_json(v[k]));
  return '{' + o.join(',') + '}';
}

function tc_ok(data) { data = data || {}; data.ok = true; return tc_json(data); }
function tc_err(msg) { return tc_json({ ok: false, error: String(msg) }); }

function tc_seqSize(seq) {
  var w = 0, h = 0;
  try { w = seq.frameSizeHorizontal; h = seq.frameSizeVertical; } catch (e) {}
  if (!w || !h) {
    try { var s = seq.getSettings(); w = s.videoFrameWidth; h = s.videoFrameHeight; } catch (e2) {}
  }
  return { w: w, h: h };
}

// informações da sequência ativa
function tc_info() {
  try {
    var out = { projectPath: app.project ? (app.project.path || '') : '', hasSequence: false };
    var seq = app.project ? app.project.activeSequence : null;
    if (seq) {
      var size = tc_seqSize(seq);
      var tpf = Number(seq.timebase);
      var pos = seq.getPlayerPosition();
      out.hasSequence = true;
      out.name = seq.name;
      out.width = size.w;
      out.height = size.h;
      out.fps = tpf ? TC_TICKS_PER_SECOND / tpf : 30;
      out.playhead = pos.seconds;
      out.videoTracks = seq.videoTracks.numTracks;
    }
    return tc_ok(out);
  } catch (e) {
    return tc_err(e);
  }
}

function tc_getBin(name) {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var it = root.children[i];
    if (it && it.type === ProjectItemType.BIN && it.name === name) return it;
  }
  return root.createBin(name);
}

function tc_norm(p) { return String(p || '').replace(/\\/g, '/').toLowerCase(); }

function tc_findImported(bin, firstFile, stamp) {
  var target = tc_norm(firstFile);
  var fallback = null;
  for (var i = bin.children.numItems - 1; i >= 0; i--) {
    var it = bin.children[i];
    if (!it || it.type === ProjectItemType.BIN) continue;
    var mp = '';
    try { mp = tc_norm(it.getMediaPath()); } catch (e) {}
    if (mp && mp === target) return it;
    if (!fallback && (String(it.name).indexOf(stamp) >= 0 || mp.indexOf(tc_norm(stamp)) >= 0)) fallback = it;
  }
  return fallback;
}

// primeira trilha de vídeo (a partir de minIndex) livre no intervalo
function tc_freeTrack(seq, startTicks, endTicks, minIndex) {
  for (var i = minIndex; i < seq.videoTracks.numTracks; i++) {
    var tr = seq.videoTracks[i];
    var free = true;
    for (var j = 0; j < tr.clips.numItems; j++) {
      var c = tr.clips[j];
      if (Number(c.start.ticks) < endTicks && Number(c.end.ticks) > startTicks) { free = false; break; }
    }
    if (free) return i;
  }
  return -1;
}

function tc_addVideoTrack(seq) {
  try {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    qeSeq.addTracks(1, seq.videoTracks.numTracks, 0);
    return true;
  } catch (e) {
    return false;
  }
}

/*
 * Importa a sequência de PNG e (opcionalmente) coloca no playhead.
 *  firstFile  caminho do primeiro frame (…_00000.png)
 *  fps        frame rate do render (igual ao da sequência)
 *  name       nome do item no projeto
 *  frames     quantidade de frames
 *  track      -1 = automático (primeira livre acima da V1), ou índice 0-based
 *  place      true = coloca na timeline; false = só importa pro bin
 *  atSeconds  (opcional) posição na sequência em segundos; sem isso usa o playhead
 */
function tc_insert(firstFile, fps, name, frames, track, place, binName, stamp, atSeconds) {
  try {
    if (!app.project) return tc_err('Nenhum projeto aberto.');
    var seq = app.project.activeSequence;
    if (place && !seq) return tc_err('Abre uma sequência na timeline antes de inserir.');

    var bin = tc_getBin(binName || 'Tamo Criando Motion');
    var imported = app.project.importFiles([firstFile], true, bin, true);
    if (imported === false) return tc_err('O Premiere recusou a importação dos PNGs.');
    var item = tc_findImported(bin, firstFile, stamp || '');
    if (!item) return tc_err('Importei, mas não achei o item no projeto. Procura no bin "' + bin.name + '".');

    try { if (item.setOverrideFrameRate) item.setOverrideFrameRate(fps); } catch (e1) {}
    try { item.name = name; } catch (e2) {}

    if (!place) return tc_ok({ placed: false, bin: bin.name });

    var pos = seq.getPlayerPosition();
    var tpf = Number(seq.timebase);
    var atSec = (atSeconds === undefined || atSeconds === null || atSeconds < 0) ? pos.seconds : atSeconds;
    var startTicks = (atSeconds === undefined || atSeconds === null || atSeconds < 0) ? Number(pos.ticks) : Math.round(atSec * TC_TICKS_PER_SECOND);
    var endTicks = startTicks + frames * tpf;
    var idx = track;
    if (idx === undefined || idx === null || idx < 0) {
      idx = tc_freeTrack(seq, startTicks, endTicks, 1);
      if (idx < 0) {
        if (tc_addVideoTrack(seq)) {
          seq = app.project.activeSequence;
          idx = tc_freeTrack(seq, startTicks, endTicks, 1);
        }
      }
      if (idx < 0) return tc_err('Não achei trilha livre acima da V1 nesse trecho. Cria uma trilha de vídeo nova e tenta de novo (o clipe já está no bin).');
    }
    if (idx >= seq.videoTracks.numTracks) return tc_err('A trilha V' + (idx + 1) + ' não existe nessa sequência.');
    seq.videoTracks[idx].overwriteClip(item, atSec);
    return tc_ok({ placed: true, track: idx + 1, at: atSec, bin: bin.name });
  } catch (e) {
    return tc_err(e);
  }
}

/*
 * Marcadores na sequência (um por animação do plano).
 *  items   [{ t, dur, name, comment }]  t em segundos a partir do início do vídeo
 *  offset  segundos em que o vídeo começa na sequência
 */
function tc_markers(items, offset) {
  try {
    var seq = app.project ? app.project.activeSequence : null;
    if (!seq) return tc_err('Abre uma sequência na timeline antes.');
    var n = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var at = (offset || 0) + it.t;
      var m = seq.markers.createMarker(at);
      m.name = it.name;
      m.comments = it.comment || '';
      try {
        if (it.dur) { var tm = new Time(); tm.seconds = at + it.dur; m.end = tm; }
      } catch (e1) { /* versão sem duração de marcador */ }
      n++;
    }
    return tc_ok({ count: n });
  } catch (e) {
    return tc_err(e);
  }
}

// abre a pasta dos renders no Explorer/Finder
function tc_reveal(folder) {
  try { var f = new Folder(folder); f.execute(); return tc_ok({}); } catch (e) { return tc_err(e); }
}
