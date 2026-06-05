// i18n (es / en). Mismas cadenas y lógica que el juego original; el `tr()` cae a
// español si falta una clave. `aplicarIdioma()` (que toca el DOM y re-renderiza)
// vive en ui/hud.js para no acoplar este módulo a la UI.
export const LANG_KEY = 'diamonds_lang';

let LANG = (() => {
  const s = localStorage.getItem(LANG_KEY);
  if (s === 'es' || s === 'en') return s;
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
})();

export const STR = {
  es: {
    mapa: '← Mapa', nivelActual: '◎ Nivel actual', guia: 'Guía',
    hint: 'Arrastra para explorar el mapa', portal: 'Portal',
    guiaTitulo: 'Guía del juego',
    lvl: 'Nivel', obj: 'Objetivo', meta: 'Meta', romper: 'Romper', libre: 'Libre',
    mov: 'Mov.', puntos: 'Puntos',
    superado: '¡Nivel superado!', sinMovs: 'Sin movimientos',
    siguiente: 'Siguiente nivel', reintentar: 'Reintentar',
    endless: '∞ Seguir sin límite', irMapa: 'Ir al mapa',
    compartir: 'Compartir', copiado: 'Texto copiado',
    shareMsgs: [
      (l, e, u) => '💎 Acabo de superar el nivel ' + l + ' en Diamonds con ' + e + ' ⭐. ¿Me superas? 😏 ' + u,
      (l, e, u) => '🚀 Llegué al nivel ' + l + ' en Diamonds. A ver si me alcanzas 👀 ' + u,
      (l, e, u) => '🏆 Nivel ' + l + ' completado en Diamonds. No creo que me ganes 😎 ' + u,
      (l, e, u) => '💎🔥 Voy por el nivel ' + l + ' de Diamonds. ¿Tú dónde andas? 🤔 ' + u,
      (l, e, u) => '⭐ ' + e + ' estrellas en el nivel ' + l + ' de Diamonds. Tu turno 😜 ' + u,
    ],
    puntosN: n => 'Puntos: ' + n, movsRest: n => 'Movimientos restantes: ' + n,
    faltaron: n => 'Te faltaron ' + n + ' puntos', quedaban: n => 'Quedaban ' + n + ' diamantes',
    combo: n => '¡Combo ×' + n + '!',
    // glosario
    gJugar: 'Cómo jugar', gDiam: 'Diamantes',
    gPow: 'Power-ups (se crean al combinar)', gComb: 'Combinaciones (intercambia dos power-ups)',
    gCombinaT: 'Combina', gCombinaD: 'Toca una gema y una vecina (o desliza) para intercambiarlas.', gCombinaH: 'Alinea 3 o más del mismo color para romperlas.',
    gCascT: 'Cascadas', gCascD: 'Al caer pueden formarse nuevas líneas.', gCascH: 'Cada reacción en cadena multiplica los puntos (¡combo!).',
    gObjT: 'Objetivo del nivel', gObjD: 'Meta de puntos, o romper todos los diamantes objetivo.', gObjH: 'Lo ves arriba en el marcador.',
    gEstrT: 'Estrellas', gEstrD: '1 a 3 según lo holgado que ganes. ', gEstrH: 'Abren mundos y portales en el mapa.',
    gDuroT: 'Diamante duro', gDuroD: 'Necesita 2 golpes para romperse (muestra grietas).', gDuroH: 'Combínalo dos veces.',
    gRefT: 'Diamante reforzado', gRefD: 'Aguanta 3 golpes. Aparece en mundos avanzados.',
    gRayoT: 'Rayo', gRayoD: 'Se crea con 4 en línea.', gRayoH: 'Al activarlo limpia toda la fila o la columna.',
    gBombaT: 'Bomba', gBombaD: 'Se crea con una forma de L o T.', gBombaH: 'Estalla en un área de 3×3.',
    gEstrellaT: 'Estrella', gEstrellaD: 'Se crea con 5 en línea.', gEstrellaH: 'Elimina todos los diamantes de un color.',
    gCometaT: 'Cometa', gCometaD: 'Se crea con un cuadrado 2×2.', gCometaH: 'Dispara a 3 celdas (prioriza objetivos) con salpicadura.',
    gActivar: 'Para activar un power-up, intercámbialo con una gema vecina.',
    gC1T: 'Rayo + Rayo', gC1D: 'Cruz: limpia una fila y una columna completas.',
    gC2T: 'Rayo + Bomba', gC2D: 'Banda: 3 filas y 3 columnas.',
    gC3T: 'Bomba + Bomba', gC3D: 'Explosión enorme de 5×5.',
    gC4T: 'Rayo/Bomba + Cometa', gC4D: 'Varios disparos a zonas del tablero.',
    gC5T: 'Cometa + Cometa', gC5D: '6 estallidos repartidos.',
    gC6T: 'Estrella + Rayo/Bomba', gC6D: 'Convierte cada gema de un color en rayo o bomba.',
    gC7T: 'Estrella + Estrella', gC7D: '¡Arrasa todo el tablero!',
  },
  en: {
    mapa: '← Map', nivelActual: '◎ Current level', guia: 'Guide',
    hint: 'Drag to explore the map', portal: 'Portal',
    guiaTitulo: 'Game guide',
    lvl: 'Level', obj: 'Goal', meta: 'Goal', romper: 'Break', libre: 'Free',
    mov: 'Moves', puntos: 'Points',
    superado: 'Level cleared!', sinMovs: 'Out of moves',
    siguiente: 'Next level', reintentar: 'Retry',
    endless: '∞ Keep playing', irMapa: 'Go to map',
    compartir: 'Share', copiado: 'Text copied',
    shareMsgs: [
      (l, e, u) => '💎 Just cleared level ' + l + ' in Diamonds with ' + e + ' ⭐. Can you beat me? 😏 ' + u,
      (l, e, u) => '🚀 Reached level ' + l + ' in Diamonds. Catch up if you can 👀 ' + u,
      (l, e, u) => '🏆 Level ' + l + ' done in Diamonds. Bet you can\'t beat me 😎 ' + u,
      (l, e, u) => '💎🔥 I\'m on level ' + l + ' of Diamonds. Where are you? 🤔 ' + u,
      (l, e, u) => '⭐ ' + e + ' stars on level ' + l + ' of Diamonds. Your turn 😜 ' + u,
    ],
    puntosN: n => 'Points: ' + n, movsRest: n => 'Moves left: ' + n,
    faltaron: n => 'You needed ' + n + ' more points', quedaban: n => n + ' diamonds left',
    combo: n => 'Combo ×' + n + '!',
    gJugar: 'How to play', gDiam: 'Diamonds',
    gPow: 'Power-ups (created by matching)', gComb: 'Combos (swap two power-ups)',
    gCombinaT: 'Match', gCombinaD: 'Tap a gem and a neighbor (or swipe) to swap them.', gCombinaH: 'Line up 3 or more of the same color to clear them.',
    gCascT: 'Cascades', gCascD: 'New lines may form as gems fall.', gCascH: 'Each chain reaction multiplies your points (combo!).',
    gObjT: 'Level goal', gObjD: 'Reach a points target, or break all target diamonds.', gObjH: 'Shown at the top scoreboard.',
    gEstrT: 'Stars', gEstrD: '1 to 3 based on how well you win. ', gEstrH: 'They unlock worlds and portals on the map.',
    gDuroT: 'Hard diamond', gDuroD: 'Takes 2 hits to break (shows cracks).', gDuroH: 'Match it twice.',
    gRefT: 'Reinforced diamond', gRefD: 'Takes 3 hits. Appears in later worlds.',
    gRayoT: 'Lightning', gRayoD: 'Created with 4 in a row.', gRayoH: 'Clears the whole row or column.',
    gBombaT: 'Bomb', gBombaD: 'Created with an L or T shape.', gBombaH: 'Blasts a 3×3 area.',
    gEstrellaT: 'Star', gEstrellaD: 'Created with 5 in a row.', gEstrellaH: 'Removes all diamonds of one color.',
    gCometaT: 'Comet', gCometaD: 'Created with a 2×2 square.', gCometaH: 'Fires at 3 cells (targets first) with splash.',
    gActivar: 'To trigger a power-up, swap it with an adjacent gem.',
    gC1T: 'Lightning + Lightning', gC1D: 'Cross: clears a full row and column.',
    gC2T: 'Lightning + Bomb', gC2D: 'Band: 3 rows and 3 columns.',
    gC3T: 'Bomb + Bomb', gC3D: 'Huge 5×5 blast.',
    gC4T: 'Lightning/Bomb + Comet', gC4D: 'Several shots across the board.',
    gC5T: 'Comet + Comet', gC5D: '6 scattered blasts.',
    gC6T: 'Star + Lightning/Bomb', gC6D: 'Turns every gem of a color into lightning or bomb.',
    gC7T: 'Star + Star', gC7D: 'Wipes the whole board!',
  },
};

export const tr = k => { const v = (STR[LANG] || STR.es)[k]; return v != null ? v : (STR.es[k] != null ? STR.es[k] : k); };
export const getLang = () => LANG;
export function setLang (l) { LANG = l; localStorage.setItem(LANG_KEY, LANG); }
