// RNG determinista (mulberry32) y definición determinista de cada nivel: el nivel
// n siempre se genera igual. Verbatim del juego original.
import { features, mundoDeNivel, nivelEnMundo, infoMundo } from './config.js';

export function mulberry32 (a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Definición determinista del nivel n (1-based global).
export function defNivel (n) {
  const w = mundoDeNivel(n), em = nivelEnMundo(n);
  const f = features(w);
  const rng = mulberry32((Math.imul(n, 2654435761) ^ 0x9e3779b9) >>> 0);
  const tipo = (f.duros && em % 2 === 0) ? 'romper' : 'puntos';
  const movs = Math.max(14, 30 - (w - 1) * 2 - Math.floor((em - 1) / 2));
  let duros = 0;
  if (f.duros) {
    duros = tipo === 'romper' ? (3 + w + Math.floor(em / 2)) : Math.floor(rng() * 3);
    duros = Math.min(duros, 18);
  }
  const objetivoPuntos = tipo === 'puntos'
    ? Math.round((600 + w * 320 + em * 200) / 10) * 10
    : 0;
  return { n, w, em, tipo, movs, colores: f.colores, duros, reforzados: f.reforzados,
           objetivoPuntos, rng, info: infoMundo(w) };
}
