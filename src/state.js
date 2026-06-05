// Estado global mutable del juego (lo que en el index.html original eran `let`
// sueltos compartidos por todas las funciones). Los módulos importan `S` y leen/
// escriben sus propiedades; así se preserva el comportamiento sin reescribir la
// lógica. cv/ctx/def/prog se inicializan en main.js durante el arranque.
import { N } from './config.js';

export const S = {
  cell: 48, dpr: 1,
  grid: [],
  estado: 'idle',         // 'idle' | 'busy'
  sel: null,
  score: 0, movs: 0, objRestante: 0,
  endless: false,         // modo libre: sin límite de movimientos
  def: null,              // defNivel(n) actual
  vista: 'mapa',
  tweens: [],
  fx: [],                 // partículas / haces / ondas (efectos visuales)
  nowMs: 0,               // reloj para pulsos (palpitar)
  fxBeams: [],            // haces encolados por la detonación en curso
  lastTs: 0,
  prog: null,             // progreso { max, stars }
  cv: null, ctx: null,    // canvas + contexto 2d
  finShare: null,
  glosListo: false,
  // mapa
  mapOff: { x: 0, y: 0 },
  mapDim: { w: 0, h: 0, vw: 0, vh: 0 },
  mapStops: [],
  mapActualXY: null,
  mapPanInit: false,
  panStart: null, panBase: null, panMoved: false,
  downCell: null,
};

// Índices del tablero.
export const I = (r, c) => r * N + c;
export const at = i => S.grid[(i / N) | 0][i % N];

// Fábrica de gemas.
export function gem (r, c, t) { return { tipo: t, hp: 1, hpMax: 1, power: null, objetivo: false, objColor: null, dr: r, dc: c, scale: 1, charge: 0 }; }
