// Efectos visuales: partículas (esquirlas), haces, ondas y destellos. Se dibujan
// sobre el canvas y se actualizan desde el loop. Verbatim del juego original.
import { S } from './state.js';
import { easeOutQuad } from './tweens.js';

export function actualizarFx (dt) {
  const s = Math.min(dt, 40) / 1000;       // seg. (clamp para no saltar)
  for (let i = S.fx.length - 1; i >= 0; i--) {
    const p = S.fx[i];
    p.t += dt;
    if (p.kind === 'shard') {
      p.vy += 1400 * s;                    // gravedad
      p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s;
    }
    if (p.t >= p.dur) S.fx.splice(i, 1);
  }
}

export const centroX = c => (c + 0.5) * S.cell;
export const centroY = r => (r + 0.5) * S.cell;

// Estallido en pedazos: esquirlas triangulares que salen volando.
export function spawnEsquirlas (cx, cy, c1, c2) {
  const cell = S.cell;
  const n = 7 + ((Math.random() * 4) | 0);
  for (let k = 0; k < n; k++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = cell * (2.2 + Math.random() * 3.2);
    S.fx.push({
      kind: 'shard', x: cx, y: cy,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - cell * 1.5,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 14,
      size: cell * (0.12 + Math.random() * 0.13),
      color: Math.random() < 0.5 ? c1 : c2,
      t: 0, dur: 360 + Math.random() * 240
    });
  }
  // destello breve
  S.fx.push({ kind: 'flash', x: cx, y: cy, r: cell * 0.55, t: 0, dur: 180 });
}

// Haz que fluye de (r0,c0) a (r1,c1).
export function spawnHaz (r0, c0, r1, c1, color) {
  S.fx.push({ kind: 'beam', x0: centroX(c0), y0: centroY(r0), x1: centroX(c1), y1: centroY(r1), color, t: 0, dur: 300 });
}
// Onda expansiva (bomba).
export function spawnOnda (r, c, radio, color) {
  S.fx.push({ kind: 'ring', x: centroX(c), y: centroY(r), r: radio, color, t: 0, dur: 320 });
}

export function dibujarFx () {
  const ctx = S.ctx, cell = S.cell;
  for (const p of S.fx) {
    const k = p.t / p.dur, vida = 1 - k;
    if (p.kind === 'beam') {
      // línea que fluye: tramo brillante que viaja del origen al destino
      const head = Math.min(1, k * 1.6);
      const hx = p.x0 + (p.x1 - p.x0) * head, hy = p.y0 + (p.y1 - p.y0) * head;
      const grad = ctx.createLinearGradient(p.x0, p.y0, hx, hy);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, p.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = cell * 0.30 * vida + cell * 0.05;
      ctx.lineCap = 'round';
      ctx.globalAlpha = Math.min(1, vida * 1.4);
      ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(hx, hy); ctx.stroke();
      // núcleo blanco en la cabeza
      ctx.globalAlpha = vida;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.beginPath(); ctx.arc(hx, hy, cell * 0.12 * vida + cell * 0.03, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    } else if (p.kind === 'ring') {
      const rad = p.r * easeOutQuad(k);
      ctx.strokeStyle = p.color; ctx.globalAlpha = vida;
      ctx.lineWidth = cell * 0.16 * vida + cell * 0.03;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (p.kind === 'flash') {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + k));
      g.addColorStop(0, 'rgba(255,255,255,' + (0.85 * vida) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k), 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'shard') {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, vida * 1.6);
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, s * 0.6); ctx.lineTo(-s * 0.8, s * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
}
