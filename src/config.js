// Configuración y matemática de mundos/niveles (pura, salvo featMundo que mira el
// idioma). Verbatim del juego original.
import { getLang } from './i18n.js';

export const N = 8;                 // tablero N×N
export const PT_GEMA = 12;          // puntos por gema eliminada
export const NIVELES_POR_MUNDO = 10;
export const PROG_KEY = 'diamonds_prog';

// Paleta de gemas (claro arriba, oscuro abajo => aspecto de diamante)
export const COLORES = [
  ['#fda4af', '#e11d48'], // rojo
  ['#fdba74', '#ea580c'], // naranja
  ['#fde047', '#ca8a04'], // amarillo
  ['#86efac', '#16a34a'], // verde
  ['#7dd3fc', '#0284c7'], // azul
  ['#d8b4fe', '#9333ea']  // violeta
];

// Mundos: cada uno añade una mecánica. Más allá del último se repite "Caos"
// y la dificultad sigue escalando por fórmula.
export const MUNDOS = [
  { nombre: 'Cristal',  tint: '#22d3ee', feat: 'Combina y crea poderes',              featEn: 'Match and create power-ups' },
  { nombre: 'Escarcha', tint: '#7dd3fc', feat: 'Diamantes duros (2 golpes)',          featEn: 'Hard diamonds (2 hits)' },
  { nombre: 'Prisma',   tint: '#d8b4fe', feat: 'Un color más',                        featEn: 'One more color' },
  { nombre: 'Roca',     tint: '#a8a29e', feat: 'Diamantes reforzados (3 golpes)',     featEn: 'Reinforced diamonds (3 hits)' },
  { nombre: 'Tormenta', tint: '#fbbf24', feat: 'Menos movimientos, más objetivos',    featEn: 'Fewer moves, more targets' },
  { nombre: 'Caos',     tint: '#fb7185', feat: 'Todo combinado',                       featEn: 'Everything combined' },
];

export const featMundo = info => (getLang() === 'en' && info.featEn) ? info.featEn : info.feat;
export const mundoDeNivel = n => Math.floor((n - 1) / NIVELES_POR_MUNDO) + 1;
export const nivelEnMundo = n => ((n - 1) % NIVELES_POR_MUNDO) + 1;
export const infoMundo = w => MUNDOS[Math.min(w - 1, MUNDOS.length - 1)];

// Estrellas necesarias para entrar al mundo w (puerta del nivel 1).
export function reqMundo (w) { return w <= 1 ? 0 : Math.floor((w - 1) * NIVELES_POR_MUNDO * 3 * 0.45); }
// Estrellas que exige el nivel n (0 = ninguna). Puerta de mundo (em=1) y
// nivel "jefe" al final de cada mundo (em=último).
export function reqNivel (n) {
  const w = mundoDeNivel(n), em = nivelEnMundo(n);
  if (em === 1) return reqMundo(w);
  if (em === NIVELES_POR_MUNDO) return reqMundo(w) + Math.round(NIVELES_POR_MUNDO * 1.5);
  return 0;
}

// Mecánicas desbloqueadas por mundo (incremental).
export function features (w) {
  return {
    colores: w >= 3 ? 6 : 5,   // Prisma añade el 6º color
    duros: w >= 2,             // Escarcha: diamantes de 2 golpes
    reforzados: w >= 4,        // Roca: pueden ser de 3 golpes
  };
}
