// Loop principal: avanza tweens, actualiza FX y dibuja el tablero (solo en la
// vista de juego). Verbatim del juego original.
import { S } from './state.js';
import { actualizarFx } from './fx.js';
import { dibujar } from './render.js';

export function loop (ts) {
  const dt = S.lastTs ? (ts - S.lastTs) : 16;
  S.lastTs = ts; S.nowMs = ts;
  for (let i = S.tweens.length - 1; i >= 0; i--) {
    const tw = S.tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur), e = tw.ease(k);
    for (const p in tw.props) tw.obj[p] = tw.from[p] + (tw.props[p] - tw.from[p]) * e;
    if (k >= 1) { S.tweens.splice(i, 1); tw.done(); }
  }
  actualizarFx(dt);
  if (S.vista === 'juego') dibujar();
  requestAnimationFrame(loop);
}
