// Progreso del jugador (niveles desbloqueados + estrellas) y reglas de desbloqueo
// por estrellas. Persistencia en localStorage (en Fase 2 migra a store.closer.click).
import { PROG_KEY, reqNivel } from './config.js';
import { S } from './state.js';

export function cargarProg () {
  try { const d = JSON.parse(localStorage.getItem(PROG_KEY)); if (d && d.stars) return { max: d.max || 1, stars: d.stars || {} }; } catch {}
  return { max: 1, stars: {} };
}
export function guardarProg () { localStorage.setItem(PROG_KEY, JSON.stringify(S.prog)); }

// Estrellas totales acumuladas (suma de las mejores por nivel).
export function estrellasTotales () {
  let s = 0; for (const k in S.prog.stars) s += S.prog.stars[k] || 0; return s;
}
// Un nivel es jugable si llegó la progresión y se reúnen las estrellas.
export function desbloqueado (n) { return n <= S.prog.max && estrellasTotales() >= reqNivel(n); }
