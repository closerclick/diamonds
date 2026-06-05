// Generación procedural del tablero de un nivel (determinista por def.rng) y conteo
// de objetivos. Verbatim del juego original.
import { S, gem } from '../state.js';
import { N } from '../config.js';
import { tieneMatches, hayMovimientos } from './matching.js';

export function generarNivel () {
  const def = S.def;
  const C = def.colores, rng = def.rng;
  do {
    S.grid = [];
    for (let r = 0; r < N; r++) {
      const fila = [];
      for (let c = 0; c < N; c++) {
        let t;
        do { t = (rng() * C) | 0; }
        while ((c >= 2 && fila[c - 1].tipo === t && fila[c - 2].tipo === t) ||
               (r >= 2 && S.grid[r - 1][c].tipo === t && S.grid[r - 2][c].tipo === t));
        fila.push(gem(r, c, t));
      }
      S.grid.push(fila);
    }
  } while (tieneMatches() || !hayMovimientos());

  // Diamantes duros
  let n = def.duros, guard = 0;
  while (n > 0 && guard++ < 800) {
    const r = (rng() * N) | 0, c = (rng() * N) | 0, g = S.grid[r][c];
    if (g.hpMax === 1 && !g.power) {
      const hp = def.reforzados && rng() < 0.45 ? 3 : 2;
      g.hp = hp; g.hpMax = hp;
      if (def.tipo === 'romper') g.objetivo = true;
      n--;
    }
  }
}

export function contarObjetivos () {
  let n = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.grid[r][c] && S.grid[r][c].objetivo) n++;
  return n;
}
