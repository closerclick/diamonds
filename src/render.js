// Dimensionado del canvas y dibujo del tablero/gemas. Verbatim del juego original
// (las referencias a cv/ctx/cell van por el estado compartido S).
import { S } from './state.js';
import { N, COLORES } from './config.js';
import { dibujarFx } from './fx.js';

export function medir () {
  const cv = S.cv;
  const wrap = cv.parentElement;
  const rect = wrap.getBoundingClientRect();
  const lado = Math.floor(Math.min(rect.width, rect.height));
  if (lado <= 0) return;
  S.dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.style.width = lado + 'px';
  cv.style.height = lado + 'px';
  cv.width = Math.floor(lado * S.dpr);
  cv.height = Math.floor(lado * S.dpr);
  S.cell = (lado * S.dpr) / N;
}

export function dibujar () {
  const ctx = S.ctx, cv = S.cv, cell = S.cell;
  ctx.clearRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if ((r + c) % 2 === 0) { ctx.fillStyle = 'rgba(148,163,184,.04)'; ctx.fillRect(c * cell, r * cell, cell, cell); }
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const g = S.grid[r][c];
    if (g && g.tipo >= 0) dibujarGema(g, S.sel && S.sel.r === r && S.sel.c === c);
  }
  dibujarFx();
}

export function rombo (cx, cy, half) {
  const ctx = S.ctx;
  ctx.beginPath();
  ctx.moveTo(cx, cy - half); ctx.lineTo(cx + half, cy);
  ctx.lineTo(cx, cy + half); ctx.lineTo(cx - half, cy);
  ctx.closePath();
}

export function dibujarGema (g, seleccionada) {
  const ctx = S.ctx, cell = S.cell;
  const cx = (g.dc + 0.5) * cell, cy = (g.dr + 0.5) * cell;
  const half = cell * 0.40 * g.scale;
  const esEstrella = g.power === 'estrella';

  // Luz palpitante de "carga" justo antes de explotar
  if (g.charge > 0) {
    const pulso = 0.55 + 0.45 * Math.sin(S.nowMs / 45);
    const a = g.charge * pulso;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.62);
    rg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a) + ')');
    rg.addColorStop(0.5, 'rgba(255,255,255,' + (0.35 * a) + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, cell * 0.62, 0, Math.PI * 2); ctx.fill();
  }

  if (seleccionada) {
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.arc(cx, cy, cell * 0.46, 0, Math.PI * 2); ctx.fill();
  }

  // Base de piedra para diamantes duros
  if (g.hpMax > 1) {
    const tono = g.hpMax >= 3 ? '#57534e' : '#78716c';
    ctx.fillStyle = tono;
    const s = cell * 0.46 * g.scale;
    const rr = cell * 0.12;
    roundRect(cx - s, cy - s, s * 2, s * 2, rr); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = Math.max(1, cell * 0.02);
    roundRect(cx - s, cy - s, s * 2, s * 2, rr); ctx.stroke();
  }

  const [c1, c2] = esEstrella ? ['#f8fafc', '#cbd5e1'] : COLORES[g.tipo];
  const grad = ctx.createLinearGradient(cx, cy - half, cx, cy + half);
  grad.addColorStop(0, c1); grad.addColorStop(1, c2);
  rombo(cx, cy, half); ctx.fillStyle = grad; ctx.fill();

  // Facetas
  rombo(cx, cy, half * 0.55); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - half); ctx.lineTo(cx + half * 0.35, cy - half * 0.32); ctx.lineTo(cx - half * 0.35, cy - half * 0.32);
  ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();

  // Borde
  ctx.lineWidth = Math.max(1, cell * 0.02); ctx.strokeStyle = 'rgba(0,0,0,.18)';
  rombo(cx, cy, half); ctx.stroke();

  // Grietas si está dañado
  if (g.hpMax > 1 && g.hp < g.hpMax) {
    ctx.strokeStyle = 'rgba(15,23,42,.65)'; ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.5, cy - half * 0.2); ctx.lineTo(cx, cy + half * 0.1); ctx.lineTo(cx + half * 0.45, cy - half * 0.35);
    if (g.hp <= g.hpMax - 2) { ctx.moveTo(cx - half * 0.1, cy + half * 0.5); ctx.lineTo(cx + half * 0.2, cy - half * 0.05); }
    ctx.stroke();
  }

  // Poderes
  if (g.power === 'lineH' || g.power === 'lineV') {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const w = half * 0.85, t = half * 0.16;
    ctx.save(); ctx.translate(cx, cy); if (g.power === 'lineV') ctx.rotate(Math.PI / 2);
    ctx.fillRect(-w, -t * 1.6, w * 2, t); ctx.fillRect(-w, t * 0.6, w * 2, t);
    ctx.restore();
  } else if (g.power === 'bomba') {
    ctx.fillStyle = 'rgba(2,6,15,.55)';
    ctx.beginPath(); ctx.arc(cx, cy, half * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = Math.max(1.5, cell * 0.035);
    ctx.beginPath(); ctx.arc(cx, cy, half * 0.5, 0, Math.PI * 2); ctx.stroke();
  } else if (esEstrella) {
    estrella4(cx, cy, half * 0.75, half * 0.28);
  } else if (g.power === 'cometa') {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath(); ctx.arc(cx, cy, half * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, cell * 0.03);
    for (let k = 0; k < 4; k++) {
      const ang = Math.PI / 4 + k * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * half * 0.85, cy + Math.sin(ang) * half * 0.85); ctx.stroke();
    }
  }

  // Pips de HP (diamantes duros)
  if (g.hpMax > 1) {
    const px = cx + half * 0.62, py = cy - half * 0.62, r = Math.max(1.5, cell * 0.035);
    for (let k = 0; k < g.hp; k++) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(px - k * r * 2.6, py, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Anillo de objetivo
  if (g.objetivo) {
    ctx.strokeStyle = 'rgba(252,211,77,.9)'; ctx.lineWidth = Math.max(1.5, cell * 0.03);
    ctx.setLineDash([cell * 0.12, cell * 0.08]);
    ctx.beginPath(); ctx.arc(cx, cy, half * 1.05, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function estrella4 (cx, cy, R, r) {
  const ctx = S.ctx;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}

export function roundRect (x, y, w, h, r) {
  const ctx = S.ctx;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
