// Vista de mapa de mundos (lienzo navegable con pan), conmutación de vistas y HUD
// flotante del mundo. Verbatim del juego original.
import { $ } from '../dom.js';
import { S } from '../state.js';
import { NIVELES_POR_MUNDO, mundoDeNivel, infoMundo, reqMundo, reqNivel, featMundo } from '../config.js';
import { estrellasTotales } from '../progress.js';
import { tr } from '../i18n.js';
import { iniciarNivel } from '../levels.js';

export function mostrarVista (v) {
  S.vista = v;
  $('vistaMapa').classList.toggle('activa', v === 'mapa');
  $('vistaJuego').classList.toggle('activa', v === 'juego');
  $('btnMapaTop').style.display = v === 'juego' ? '' : 'none';
  $('btnGlosario').style.display = v === 'mapa' ? '' : 'none';
}

export function irAlMapa () { $('modalFin').classList.remove('abierto'); mostrarVista('mapa'); renderMapa(); }

// --- Mapa navegable (pan) ---
const SVGNS = 'http://www.w3.org/2000/svg';

export function renderMapa () {
  const vp = $('mapaVp'), lienzo = $('mapaMundo'), svg = $('mapaSvg');
  const mapDim = S.mapDim;
  mapDim.vw = vp.clientWidth || window.innerWidth;
  mapDim.vh = vp.clientHeight || (window.innerHeight - 120);
  const centerX = Math.max(mapDim.vw, 320) / 2;
  const amp = Math.min(centerX - 60, 120);

  Array.from(lienzo.querySelectorAll('.nivel-nodo,.portal')).forEach(e => e.remove());
  S.mapStops = [];

  const tot = estrellasTotales();
  const maxW = mundoDeNivel(S.prog.max) + 1;

  for (let w = 1; w <= maxW; w++) {
    if (w > 1) {
      const rm = reqMundo(w);
      S.mapStops.push({ type: 'portal', w, abierto: tot >= rm, req: rm, tot });
    }
    for (let k = 1; k <= NIVELES_POR_MUNDO; k++) {
      const n = (w - 1) * NIVELES_POR_MUNDO + k;
      const req = reqNivel(n);
      const unlocked = n <= S.prog.max && tot >= req;
      S.mapStops.push({ type: 'level', w, k, n, req, unlocked, esActual: n === S.prog.max });
    }
  }

  // Camino siempre ASCENDENTE: el nivel 1 (o=0) queda abajo y cada parada
  // siguiente sube. La X serpentea según el orden real.
  const lastO = S.mapStops.length - 1;
  S.mapStops.forEach((s, o) => {
    s.x = centerX + amp * Math.sin(o * 0.7);
    s.y = 90 + (lastO - o) * 118;
  });
  mapDim.w = Math.max(mapDim.vw, 320);
  mapDim.h = (lastO >= 0 ? 90 + lastO * 118 : 0) + 140;
  lienzo.style.width = mapDim.w + 'px';
  lienzo.style.height = mapDim.h + 'px';

  svg.setAttribute('width', mapDim.w);
  svg.setAttribute('height', mapDim.h);
  svg.innerHTML = '';
  for (let i = 1; i < S.mapStops.length; i++) {
    const a = S.mapStops[i - 1], b = S.mapStops[i];
    const d = 'M ' + a.x + ' ' + a.y + ' C ' + a.x + ' ' + ((a.y + b.y) / 2) + ', ' + b.x + ' ' + ((a.y + b.y) / 2) + ', ' + b.x + ' ' + b.y;
    const tint = infoMundo(b.w).tint;
    const seg = document.createElementNS(SVGNS, 'path');
    seg.setAttribute('d', d);
    seg.setAttribute('fill', 'none');
    const on = (b.type === 'level' ? b.unlocked : b.abierto);
    seg.setAttribute('stroke', on ? tint : 'rgba(148,163,184,.25)');
    seg.setAttribute('stroke-width', on ? '7' : '5');
    seg.setAttribute('stroke-linecap', 'round');
    seg.setAttribute('stroke-dasharray', on ? 'none' : '2 12');
    seg.setAttribute('opacity', on ? '0.55' : '0.5');
    svg.appendChild(seg);
  }

  S.mapActualXY = null;
  S.mapStops.forEach(s => {
    const tint = infoMundo(s.w).tint;
    if (s.type === 'portal') {
      const el = document.createElement('button');
      el.className = 'portal' + (s.abierto ? '' : ' bloq');
      el.style.setProperty('--tint', tint);
      el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
      const info = infoMundo(s.w);
      if (s.abierto) {
        el.innerHTML = '<span class="pn">' + tr('portal') + '</span><span class="pw">' + info.nombre + '</span>';
        el._accion = () => iniciarNivel((s.w - 1) * NIVELES_POR_MUNDO + 1);
      } else {
        el.innerHTML = '<span class="pn">' + tr('portal') + '</span><span class="plock">🔒 ★' + s.tot + '/' + s.req + '</span>';
      }
      lienzo.appendChild(el);
    } else {
      const stars = S.prog.stars[s.n] || 0;
      const el = document.createElement('button');
      el.className = 'nivel-nodo' + (s.unlocked ? '' : ' bloq') + (s.esActual && s.unlocked ? ' actual' : '');
      el.style.setProperty('--tint', tint);
      el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
      if (s.unlocked) {
        el.innerHTML = '<span class="nn">' + s.k + '</span><span class="ne">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>';
        el._accion = () => iniciarNivel(s.n);
      } else if (s.n <= S.prog.max) {
        el.innerHTML = '<span class="nn">🔒</span><span class="ne">★ ' + tot + '/' + s.req + '</span>';
      } else {
        el.innerHTML = '🔒';
      }
      lienzo.appendChild(el);
      if (s.esActual) S.mapActualXY = { x: s.x, y: s.y };
    }
  });

  if (!S.mapActualXY && S.mapStops.length) S.mapActualXY = { x: S.mapStops[0].x, y: S.mapStops[0].y };

  initMapaPan();
  centrarEn(S.mapActualXY, false);
  actualizarMapaHud();
}

// ---- Pan ----
function clampOff () {
  const mapDim = S.mapDim, mapOff = S.mapOff;
  const minX = Math.min(0, mapDim.vw - mapDim.w), maxX = 0;
  const minY = Math.min(0, mapDim.vh - mapDim.h), maxY = 0;
  if (mapDim.w <= mapDim.vw) mapOff.x = (mapDim.vw - mapDim.w) / 2;
  else mapOff.x = Math.max(minX, Math.min(maxX, mapOff.x));
  mapOff.y = Math.max(minY, Math.min(maxY, mapOff.y));
}
function aplicarPan () {
  clampOff();
  $('mapaMundo').style.transform = 'translate(' + S.mapOff.x + 'px,' + S.mapOff.y + 'px)';
}
function centrarEn (xy, suave) {
  if (!xy) return;
  S.mapOff.x = S.mapDim.vw / 2 - xy.x;
  S.mapOff.y = S.mapDim.vh / 2 - xy.y;
  const lienzo = $('mapaMundo');
  lienzo.style.transition = suave ? 'transform .35s ease' : 'none';
  aplicarPan();
  if (suave) setTimeout(() => { lienzo.style.transition = 'none'; }, 360);
}
function actualizarMapaHud () {
  const cy = -S.mapOff.y + S.mapDim.vh / 2;
  let best = S.mapStops[0], bd = Infinity;
  for (const s of S.mapStops) { const d = Math.abs(s.y - cy); if (d < bd) { bd = d; best = s; } }
  if (!best) return;
  const info = infoMundo(best.w), tot = estrellasTotales();
  const hud = $('mapaHud');
  hud.style.setProperty('--tint', info.tint);
  hud.innerHTML =
    '<div><div class="mh-num">Mundo ' + best.w + '</div>' +
    '<div class="mh-nombre">' + info.nombre + '</div>' +
    '<div class="mh-feat">' + featMundo(info) + '</div></div>' +
    '<div class="mh-stars">★ ' + tot + '</div>';
}

function initMapaPan () {
  if (S.mapPanInit) return;
  S.mapPanInit = true;
  const vp = $('mapaVp');
  vp.addEventListener('pointerdown', e => {
    S.panStart = { x: e.clientX, y: e.clientY };
    S.panBase = { x: S.mapOff.x, y: S.mapOff.y };
    S.panMoved = false;
    vp.classList.add('dragging');
    $('mapaMundo').style.transition = 'none';
    try { vp.setPointerCapture(e.pointerId); } catch (err) {}
  });
  vp.addEventListener('pointermove', e => {
    if (!S.panStart) return;
    const dx = e.clientX - S.panStart.x, dy = e.clientY - S.panStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) {
      S.panMoved = true;
      const h = $('mapaHint'); if (h) h.style.opacity = '0';
    }
    S.mapOff.x = S.panBase.x + dx; S.mapOff.y = S.panBase.y + dy;
    aplicarPan();
    actualizarMapaHud();
  });
  const fin = e => {
    const fueTap = S.panStart && !S.panMoved;
    S.panStart = null; vp.classList.remove('dragging');
    if (fueTap && e && typeof e.clientX === 'number') {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const nodo = t && t.closest && t.closest('.nivel-nodo, .portal');
      if (nodo && nodo._accion) nodo._accion();
    }
  };
  vp.addEventListener('pointerup', fin);
  vp.addEventListener('pointercancel', () => { S.panStart = null; vp.classList.remove('dragging'); });
  $('mapaRecenter').addEventListener('click', () => centrarEn(S.mapActualXY, true));
}
