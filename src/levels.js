// Flujo de nivel: chequeo de victoria/derrota, estrellas, inicio de nivel, modo
// libre (endless), pantalla de fin y compartir. Verbatim del juego original salvo
// el fallback de compartir, que usa toast (no window.prompt: §5 sin prompts).
import { $ } from './dom.js';
import { S } from './state.js';
import { defNivel } from './rng.js';
import { generarNivel, contarObjetivos } from './engine/levelgen.js';
import { hayMovimientos } from './engine/matching.js';
import { recuperar } from './engine/resolve.js';
import { desbloqueado, guardarProg } from './progress.js';
import { mostrarVista } from './ui/map.js';
import { actualizarHUD } from './ui/hud.js';
import { medir } from './render.js';
import { tr } from './i18n.js';
import { beep, avisoFin } from './audio.js';

export function chequear () {
  if (S.endless) return null;   // en modo libre el nivel nunca termina
  if (S.def.tipo === 'puntos' && S.score >= S.def.objetivoPuntos) return 'win';
  if (S.def.tipo === 'romper' && S.objRestante <= 0) return 'win';
  if (S.movs <= 0) return 'lose';
  return null;
}

export function estrellas () {
  if (S.def.tipo === 'puntos') { const r = S.score / S.def.objetivoPuntos; return r >= 1.6 ? 3 : r >= 1.2 ? 2 : 1; }
  const r = S.movs / S.def.movs; return r >= 0.5 ? 3 : r >= 0.25 ? 2 : 1;
}

export function iniciarNivel (n) {
  if (!desbloqueado(n)) { beep(300, 0.18, 0.3); return; }
  S.def = defNivel(n);
  S.score = 0; S.movs = S.def.movs; S.sel = null; S.estado = 'idle'; S.endless = false;
  generarNivel();
  S.objRestante = contarObjetivos();
  mostrarVista('juego');
  medir();
  actualizarHUD();
}

// Continúa el tablero actual sin límite de movimientos (modo libre).
export async function entrarEndless () {
  $('modalFin').classList.remove('abierto');
  S.endless = true;
  S.movs = Infinity;
  S.estado = 'idle';
  actualizarHUD();
  if (!hayMovimientos()) await recuperar();
  S.estado = 'idle';
}

export function toast (txt) {
  let t = $('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#0f172a;color:#e2e8f0;border:1px solid #334155;padding:10px 18px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.4);transition:opacity .25s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = txt;
  t.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.opacity = '0'; }, 1800);
}

export async function compartirNivel () {
  if (!S.finShare) return;
  const url = 'https://diamonds.closer.click/';
  const msgs = tr('shareMsgs');
  const pick = msgs[Math.floor(Math.random() * msgs.length)];
  const texto = pick(S.finShare.nivel, S.finShare.estrellas, url);
  try {
    if (navigator.share) { await navigator.share({ title: 'Diamonds', text: texto, url }); return; }
  } catch (_) { return; /* el usuario canceló el diálogo nativo */ }
  try {
    await navigator.clipboard.writeText(texto);
    toast(tr('copiado'));
  } catch (_) {
    toast(texto);   // sin Web Share ni portapapeles: mostramos el texto (sin window.prompt, §5)
  }
}

export function nivelCompletado () {
  const def = S.def;
  const e = estrellas();
  S.prog.stars[def.n] = Math.max(S.prog.stars[def.n] || 0, e);
  S.prog.max = Math.max(S.prog.max, def.n + 1);
  guardarProg();
  $('finTitulo').textContent = tr('superado');
  pintarEstrellas(e);
  $('finMsg').textContent = def.tipo === 'puntos' ? tr('puntosN')(S.score) : tr('movsRest')(Math.max(0, S.movs));
  S.finShare = { nivel: def.n, estrellas: e };
  $('btnSiguiente').style.display = ''; $('btnReintentar').style.display = 'none';
  $('btnEndless').style.display = '';
  $('btnCompartir').style.display = '';
  $('modalFin').classList.add('abierto');
  avisoFin();
}
export function nivelFallado () {
  const def = S.def;
  $('finTitulo').textContent = tr('sinMovs');
  pintarEstrellas(0);
  $('finMsg').textContent = def.tipo === 'puntos'
    ? tr('faltaron')(Math.max(0, def.objetivoPuntos - S.score))
    : tr('quedaban')(Math.max(0, S.objRestante));
  $('btnSiguiente').style.display = 'none'; $('btnReintentar').style.display = '';
  $('btnEndless').style.display = '';
  $('btnCompartir').style.display = 'none';
  $('modalFin').classList.add('abierto');
  beep(300, 0.25, 0.35);
}
export function finalizarSiCorresponde () {
  const r = chequear();
  if (r === 'win') nivelCompletado();
  else if (r === 'lose') nivelFallado();
}

export function pintarEstrellas (e) {
  let h = '';
  for (let i = 0; i < 3; i++) h += '<span class="' + (i < e ? 'on' : 'off') + '">★</span>';
  $('finEstrellas').innerHTML = h;
}
