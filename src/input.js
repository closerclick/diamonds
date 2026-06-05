// Interacción del jugador: detectar celda, seleccionar/deslizar para intercambiar,
// y resolver la jugada (poderes, olas naturales, combos). Verbatim del original.
// `registerInput()` engancha los listeners al canvas (se llama tras fijar S.cv).
import { S } from './state.js';
import { buscarGrupos, hayMovimientos } from './engine/matching.js';
import { waveNatural, waveExplicita, efectoSwap, colapsar, recuperar } from './engine/resolve.js';
import { tween } from './tweens.js';
import { beep, vibrar } from './audio.js';
import { actualizarHUD } from './ui/hud.js';
import { chequear, finalizarSiCorresponde } from './levels.js';

function celdaDesdeEvento (e) {
  const N = 8;
  const rect = S.cv.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / rect.width * N);
  const r = Math.floor((e.clientY - rect.top) / rect.height * N);
  if (r < 0 || r >= N || c < 0 || c >= N) return null;
  return { r, c };
}
const adyacentes = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function animarSwap (a, b) {
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  return Promise.all([tween(ga, { dr: b.r, dc: b.c }, 140), tween(gb, { dr: a.r, dc: a.c }, 140)]);
}
function intercambiar (a, b) {
  const t = S.grid[a.r][a.c]; S.grid[a.r][a.c] = S.grid[b.r][b.c]; S.grid[b.r][b.c] = t;
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  ga.dr = a.r; ga.dc = a.c; gb.dr = b.r; gb.dc = b.c;
}

async function intentarSwap (a, b) {
  S.estado = 'busy'; beep(440, 0.05, 0.15);
  await animarSwap(a, b); intercambiar(a, b);
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  const hayPoder = (ga && ga.power) || (gb && gb.power);
  const grupos = buscarGrupos({ a, b });
  if (grupos.clear.size === 0 && grupos.creations.length === 0 && !hayPoder) {
    await animarSwap(a, b); intercambiar(a, b); vibrar(30); S.estado = 'idle'; return;
  }
  S.movs--; actualizarHUD();

  if (hayPoder) {
    const set = efectoSwap(a, b);
    await waveExplicita(set, 1);
    await colapsar();
    let combo = 2;
    while (await waveNatural(null, combo)) { await colapsar(); combo++; }
  } else {
    let combo = 1, swap = { a, b };
    while (await waveNatural(swap, combo)) { swap = null; await colapsar(); combo++; }
  }

  if (chequear() === null && !hayMovimientos()) await recuperar();
  S.estado = 'idle';
  finalizarSiCorresponde();
}

export function registerInput () {
  const cv = S.cv;
  cv.addEventListener('pointerdown', e => {
    if (S.estado !== 'idle') return;
    e.preventDefault();
    S.downCell = celdaDesdeEvento(e);
    if (!S.downCell) return;
    if (S.sel && adyacentes(S.sel, S.downCell)) { const a = S.sel; S.sel = null; intentarSwap(a, S.downCell); }
    else S.sel = S.downCell;
  });
  cv.addEventListener('pointermove', e => {
    if (S.estado !== 'idle' || !S.downCell) return;
    const cur = celdaDesdeEvento(e);
    if (cur && adyacentes(S.downCell, cur)) { const a = S.downCell; S.downCell = null; S.sel = null; intentarSwap(a, cur); }
  });
  cv.addEventListener('pointerup', () => { S.downCell = null; });
  cv.addEventListener('pointercancel', () => { S.downCell = null; });
}
