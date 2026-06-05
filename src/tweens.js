// Tweens y easings; los recoge el loop principal (loop.js). `espera` es un sleep
// por Promise usado por la resolución de cascadas.
import { S } from './state.js';

export function tween (obj, props, dur, ease) {
  const from = {}; for (const k in props) from[k] = obj[k];
  return new Promise(res => S.tweens.push({ obj, props, from, dur, t: 0, ease: ease || easeOutQuad, done: res }));
}
export function easeOutQuad (t) { return 1 - (1 - t) * (1 - t); }
export function easeInQuad (t) { return t * t; }
export function easeOutBack (t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

export const espera = ms => new Promise(res => setTimeout(res, ms));
