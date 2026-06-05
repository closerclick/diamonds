// Resolución del tablero: aplicar la detonación (puntos/animaciones/objetivos),
// olas naturales y explícitas, efecto de combinar dos power-ups, gravedad (recta +
// diagonal) y recuperación cuando no hay movimientos. Verbatim del juego original.
import { S, I, at, gem } from '../state.js';
import { N, PT_GEMA, COLORES } from '../config.js';
import { tween, easeInQuad, easeOutQuad, easeOutBack, espera } from '../tweens.js';
import { spawnEsquirlas, spawnHaz, spawnOnda } from '../fx.js';
import { buscarGrupos, hayMovimientos } from './matching.js';
import { recolectarDetonacion } from './blast.js';
import { beep, vibrar } from '../audio.js';
import { actualizarHUD, mostrarCombo } from '../ui/hud.js';

export async function aplicarDetonacion (deton, combo, creations) {
  const cell = S.cell;
  creations.forEach(cr => { const g = at(cr.idx); if (g) { g.power = cr.power; g.hp = 1; g.hpMax = 1; } });
  const pivotSet = new Set(creations.map(c => c.idx));

  const removidos = [], danados = []; let objHit = 0;
  deton.forEach(i => {
    const g = at(i); if (!g) return;
    if (pivotSet.has(i)) return;
    if (g.hp > 1) { g.hp--; danados.push(g); return; }
    removidos.push(i); if (g.objetivo) objHit++;
  });

  S.score += removidos.length * PT_GEMA * combo + creations.length * 30;
  if (combo >= 2 && removidos.length) mostrarCombo(combo);
  actualizarHUD();
  beep(500 + combo * 70, 0.12, 0.3);
  vibrar(combo > 1 ? [20, 20, 30] : 35);

  // Haces/ondas de los poderes que fluyen sobre el área afectada
  if (S.fxBeams.length) {
    S.fxBeams.forEach(b => { if (b.k === 'beam') spawnHaz(b.r0, b.c0, b.r1, b.c1, b.col); else spawnOnda(b.r, b.c, cell * 1.7, b.col); });
    S.fxBeams = [];
  }

  // 1) Luz palpitante de carga en las gemas por estallar
  removidos.forEach(i => { const g = at(i); if (g) g.charge = 1; });
  if (removidos.length) await espera(150);

  // 2) Estallido en pedazos
  const anims = [];
  removidos.forEach(i => {
    const g = at(i); if (!g) return;
    const cx = (g.dc + 0.5) * cell, cy = (g.dr + 0.5) * cell;
    const [k1, k2] = g.power ? ['#ffffff', '#bae6fd'] : COLORES[g.tipo];
    spawnEsquirlas(cx, cy, k1, k2);
    anims.push(tween(g, { scale: 0, charge: 0 }, 130, easeInQuad));
  });
  danados.forEach(g => { g.scale = 1; anims.push(tween(g, { scale: 0.62 }, 80, easeOutQuad).then(() => tween(g, { scale: 1 }, 150, easeOutBack))); });
  await Promise.all(anims);

  removidos.forEach(i => { S.grid[(i / N) | 0][i % N] = null; });
  S.objRestante -= objHit;
  actualizarHUD();
}

export async function waveNatural (swap, combo) {
  const { clear, creations } = buscarGrupos(swap);
  if (clear.size === 0 && creations.length === 0) return false;
  const protect = new Set(creations.map(c => c.idx));
  const deton = recolectarDetonacion(clear, protect);
  await aplicarDetonacion(deton, combo, creations);
  return true;
}

export async function waveExplicita (initial, combo) {
  const deton = recolectarDetonacion(initial, null);
  if (deton.size === 0) return false;
  await aplicarDetonacion(deton, combo, []);
  return true;
}

// Efecto de intercambiar uno o dos poderes (combos).
export function efectoSwap (a, b) {
  const grid = S.grid;
  const ia = I(a.r, a.c), ib = I(b.r, b.c);
  const ga = at(ia), gb = at(ib);
  const set = new Set([ia, ib]);
  const pa = ga && ga.power, pb = gb && gb.power;
  const add = i => { if (i >= 0 && i < N * N) set.add(i); };
  const fila = r => { if (r < 0 || r >= N) return; for (let c = 0; c < N; c++) add(I(r, c)); };
  const col = c => { if (c < 0 || c >= N) return; for (let r = 0; r < N; r++) add(I(r, c)); };
  const area = (r, c, rad) => { for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) add(I(rr, cc)); } };
  const color = col0 => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.tipo === col0) add(I(r, c)); } };

  const eachColor = (col0, fn) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.tipo === col0) fn(r, c); } };
  const shots = (cnt, fn) => {
    const pool = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.tipo >= 0) pool.push([r, c]); }
    for (let k = 0; k < cnt && pool.length; k++) { const [r, c] = pool.splice((Math.random() * pool.length) | 0, 1)[0]; fn(r, c); }
  };

  if (pa && pb) {
    const has = p => pa === p || pb === p;
    if (has('estrella') && pa === pb) {
      for (let i = 0; i < N * N; i++) add(i);                              // estrella + estrella = todo el tablero
    } else if (has('estrella')) {
      const otro = pa === 'estrella' ? gb : ga, col0 = otro.tipo;
      if (otro.power === 'bomba') eachColor(col0, (r, c) => area(r, c, 1)); // estrella + bomba = cada gema del color explota 3×3
      else if (otro.power === 'cometa') { color(col0); shots(6, (r, c) => area(r, c, 1)); } // estrella + cometa = borra el color + 6 disparos
      else { eachColor(col0, (r, c) => { fila(r); col(c); }); color(col0); } // estrella + rayo = cada gema del color = cruz
    } else if (has('cometa') && pa === pb) {
      shots(6, (r, c) => area(r, c, 1));                                    // cometa + cometa = 6 estallidos
    } else if (has('cometa')) {
      const otro = pa === 'cometa' ? gb : ga;
      if (otro.power === 'bomba') shots(3, (r, c) => area(r, c, 1));        // cometa + bomba = 3 estallidos 3×3
      else shots(3, (r, c) => { fila(r); col(c); });                       // cometa + rayo = 3 cruces
    } else if (pa === 'bomba' && pb === 'bomba') {
      area(a.r, a.c, 2); area(b.r, b.c, 2);                                // bomba + bomba = 5×5
    } else if (has('bomba')) {
      for (let d = -1; d <= 1; d++) { fila(a.r + d); col(a.c + d); }       // rayo + bomba = banda (3 filas + 3 col)
    } else {
      fila(a.r); col(a.c);                                                 // rayo + rayo = cruz
    }
  } else {
    const pcell = pa ? ia : ib, pg = at(pcell), otro = pa ? gb : ga;
    if (pg.power === 'estrella') pg.objColor = otro ? otro.tipo : pg.tipo;  // estrella + normal = ese color
    // rayo/bomba/cometa + normal: la detonación expande desde pcell
  }
  return set;
}

// Asienta el tablero: gravedad recta + relleno; luego un paso diagonal donde la
// casilla de abajo está bloqueada. `refill` rellena arriba; `fixed` no se mueve.
export async function colapsar (opts) {
  const refill = !opts || opts.refill !== false;
  const fixed = (opts && opts.fixed) || null;
  const movible = g => g && !(fixed && fixed.has(g));
  const grid = S.grid;

  let cambio = true;
  while (cambio) {
    cambio = false;

    // 1) Gravedad recta + relleno, hasta asentar.
    let recto = true;
    while (recto) {
      recto = false;
      const tw = [];
      for (let r = N - 2; r >= 0; r--) for (let c = 0; c < N; c++) {
        const g = grid[r][c];
        if (movible(g) && !grid[r + 1][c]) {
          grid[r + 1][c] = g; grid[r][c] = null;
          tw.push(tween(g, { dr: r + 1 }, 90)); recto = true; cambio = true;
        }
      }
      if (refill) for (let c = 0; c < N; c++) {
        if (!grid[0][c]) {
          const g = gem(0, c, (Math.random() * S.def.colores) | 0);
          g.dr = -1; grid[0][c] = g;
          tw.push(tween(g, { dr: 0 }, 110)); recto = true; cambio = true;
        }
      }
      if (tw.length) await Promise.all(tw);
    }

    // 2) Un paso diagonal donde la casilla de abajo está bloqueada.
    const td = [];
    for (let r = N - 2; r >= 0; r--) for (let c = 0; c < N; c++) {
      const g = grid[r][c];
      if (!movible(g) || !grid[r + 1][c]) continue;   // libre abajo => lo maneja la recta
      const ops = [];
      if (c > 0 && !grid[r + 1][c - 1]) ops.push(c - 1);
      if (c < N - 1 && !grid[r + 1][c + 1]) ops.push(c + 1);
      if (!ops.length) continue;
      const nc = ops[(Math.random() * ops.length) | 0];  // prioridad al azar izq/der
      grid[r + 1][nc] = g; grid[r][c] = null;
      td.push(tween(g, { dr: r + 1, dc: nc }, 120)); cambio = true;
    }
    if (td.length) await Promise.all(td);
  }
}

// Sin movimientos posibles: estallan los diamantes estándar; los especiales
// mantienen su posición. Se rellena por gravedad (con diagonal) alrededor de
// ellos y se resuelven las cascadas. Se repite hasta que vuelva a haber jugada.
export async function recuperar () {
  const grid = S.grid;
  S.estado = 'busy';
  let guard = 0;
  while (!hayMovimientos() && guard++ < 30) {
    const rem = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const g = grid[r][c];
      if (g && g.tipo >= 0 && !g.power) rem.push(g);
    }
    if (!rem.length) break;                  // solo quedan especiales: nada que hacer
    rem.forEach(g => { g.charge = 1; });
    await espera(140);
    const anims = [];
    rem.forEach(g => {
      const cx = (g.dc + 0.5) * S.cell, cy = (g.dr + 0.5) * S.cell;
      spawnEsquirlas(cx, cy, ...COLORES[g.tipo]);
      anims.push(tween(g, { scale: 0, charge: 0 }, 130, easeInQuad));
    });
    await Promise.all(anims);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (rem.includes(grid[r][c])) grid[r][c] = null;

    const fixed = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] && grid[r][c].power) fixed.add(grid[r][c]);
    await colapsar({ refill: true, fixed });

    // Caso especial: tras el rellenado, dejar caer TODO normalmente para que esos
    // especiales se asienten en los huecos que les queden debajo.
    await colapsar();

    // Las gemas nuevas pueden formar combinaciones: resolverlas.
    let combo = 1;
    while (await waveNatural(null, combo)) { await colapsar(); combo++; }
  }
}
