// Progreso del jugador (niveles desbloqueados + estrellas) y reglas de desbloqueo.
// localStorage es la cache rápida y sincrónica del juego; el store.closer.click es
// el respaldo durable (§4). Las estrellas-bonus por referidos cuentan para el
// desbloqueo (ver referrals.js).
import { PROG_KEY, reqNivel } from './config.js';
import { S } from './state.js';
import { loadDoc, saveDoc, PROGRESS_THREAD } from './store.js';
import { referralBonusStars } from './referrals.js';

export function cargarProg () {
  try { const d = JSON.parse(localStorage.getItem(PROG_KEY)); if (d && d.stars) return { max: d.max || 1, stars: d.stars || {} }; } catch {}
  return { max: 1, stars: {} };
}
export function guardarProg () {
  try { localStorage.setItem(PROG_KEY, JSON.stringify(S.prog)); } catch {}
  saveDoc(PROGRESS_THREAD, S.prog).catch(() => {});   // respaldo durable best-effort
}

// Trae el progreso del store y lo FUSIONA con el local (gana el mayor avance).
// Devuelve true si cambió algo. Best-effort: si no hay store, no hace nada.
export async function syncProgressFromStore () {
  let remote = null;
  try { remote = await loadDoc(PROGRESS_THREAD); } catch {}
  if (!remote || !remote.stars) return false;
  let changed = false;
  if ((remote.max || 1) > S.prog.max) { S.prog.max = remote.max; changed = true; }
  for (const k in remote.stars) {
    const v = remote.stars[k] || 0;
    if (v > (S.prog.stars[k] || 0)) { S.prog.stars[k] = v; changed = true; }
  }
  if (changed) { try { localStorage.setItem(PROG_KEY, JSON.stringify(S.prog)); } catch {} }
  return changed;
}

// Estrellas totales (mejores por nivel) + bonus por referidos.
export function estrellasTotales () {
  let s = 0; for (const k in S.prog.stars) s += S.prog.stars[k] || 0;
  return s + referralBonusStars();
}
// Un nivel es jugable si llegó la progresión y se reúnen las estrellas.
export function desbloqueado (n) { return n <= S.prog.max && estrellasTotales() >= reqNivel(n); }
