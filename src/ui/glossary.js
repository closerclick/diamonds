// Glosario / guía del juego: iconos SVG generados (gemas, glifos de poder,
// mini-diagramas de área) y construcción del contenido. Verbatim del original.
import { $ } from '../dom.js';
import { S } from '../state.js';
import { COLORES } from '../config.js';
import { tr } from '../i18n.js';

// Icono SVG de un diamante (con poder/dureza opcionales), estilo del juego.
function svgGema (opts) {
  const o = opts || {};
  const col = o.col || ['#7dd3fc', '#0284c7'];
  const wide = o.wide;
  const W = wide ? 76 : 46, cells = wide ? [18, 58] : [23];
  const id = 'g' + Math.round(Math.random() * 1e6);
  let defs = '', body = '';
  cells.forEach((cx, i) => {
    const gid = id + '_' + i;
    const c = o.cols && o.cols[i] ? o.cols[i] : col;
    defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`;
    const cy = 23, h = 17;
    if (o.hard) {
      const tono = o.hard >= 3 ? '#57534e' : '#78716c';
      body += `<rect x="${cx - 19}" y="${cy - 19}" width="38" height="38" rx="7" fill="${tono}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>`;
    }
    body += `<polygon points="${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}" fill="url(#${gid})" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>`;
    body += `<polygon points="${cx},${cy - h} ${cx + h * 0.35},${cy - h * 0.3} ${cx - h * 0.35},${cy - h * 0.3}" fill="rgba(255,255,255,.5)"/>`;
    const gl = (Array.isArray(o.glyph) ? o.glyph[i] : o.glyph);
    body += glifoPoder(gl, cx, cy, h);
    if (o.hard) for (let k = 0; k < o.hard; k++) body += `<circle cx="${cx + 11 - k * 5}" cy="${cy - 11}" r="2" fill="#fde68a"/>`;
  });
  return `<svg class="glos-ic${wide ? ' wide' : ''}" viewBox="0 0 ${W} 46" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
}
function glifoPoder (g, cx, cy, h) {
  if (g === 'rayoH') return `<rect x="${cx - h * 0.8}" y="${cy - h * 0.28}" width="${h * 1.6}" height="${h * 0.16}" fill="#fff"/><rect x="${cx - h * 0.8}" y="${cy + h * 0.12}" width="${h * 1.6}" height="${h * 0.16}" fill="#fff"/>`;
  if (g === 'rayoV') return `<rect x="${cx - h * 0.28}" y="${cy - h * 0.8}" width="${h * 0.16}" height="${h * 1.6}" fill="#fff"/><rect x="${cx + h * 0.12}" y="${cy - h * 0.8}" width="${h * 0.16}" height="${h * 1.6}" fill="#fff"/>`;
  if (g === 'bomba') return `<circle cx="${cx}" cy="${cy}" r="${h * 0.5}" fill="rgba(2,6,15,.55)" stroke="#fde68a" stroke-width="2"/>`;
  if (g === 'estrella') { let p = ''; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2; const r = i % 2 === 0 ? h * 0.75 : h * 0.28; p += (i ? 'L' : 'M') + (cx + Math.cos(a) * r) + ',' + (cy + Math.sin(a) * r); } return `<path d="${p}Z" fill="#fff"/>`; }
  if (g === 'cometa') { let s = `<circle cx="${cx}" cy="${cy}" r="${h * 0.24}" fill="#fff"/>`; for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; s += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * h * 0.8}" y2="${cy + Math.sin(a) * h * 0.8}" stroke="#fff" stroke-width="2"/>`; } return s; }
  return '';
}
// Mini-diagrama del área afectada en una grilla pequeña.
function svgGrid (cells, accent) {
  const n = 5, s = 9, pad = 2, W = n * s + pad * 2;
  let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = cells.some(c => c[0] === x && c[1] === y);
    r += `<rect x="${pad + x * s}" y="${pad + y * s}" width="${s - 1.5}" height="${s - 1.5}" rx="1.5" fill="${on ? accent : 'rgba(148,163,184,.14)'}"/>`;
  }
  return `<svg class="glos-ic" viewBox="0 0 ${W} ${W}" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
}
const filaG = y => { const a = []; for (let x = 0; x < 5; x++) a.push([x, y]); return a; };
const colG = x => { const a = []; for (let y = 0; y < 5; y++) a.push([x, y]); return a; };
const cruzG = () => filaG(2).concat(colG(2));
const areaG = (cx, cy, rad) => { const a = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (Math.abs(x - cx) <= rad && Math.abs(y - cy) <= rad) a.push([x, y]); return a; };
const todoG = () => areaG(2, 2, 4);

const PAL = COLORES;
function item (ic, titulo, desc, how) {
  return '<div class="glos-item">' + ic + '<div class="glos-tx"><b>' + titulo + '</b><span>' + desc +
    (how ? ' <span class="how">' + how + '</span>' : '') + '</span></div></div>';
}

function construirGlosario () {
  const A = '#22d3ee';
  let h = '';

  h += '<div class="glos-sec"><h3>' + tr('gJugar') + '</h3>';
  h += item(svgGema({ col: PAL[4] }), tr('gCombinaT'), tr('gCombinaD'), tr('gCombinaH'));
  h += item(svgGrid([[0,2],[1,2],[2,2],[3,2]], A), tr('gCascT'), tr('gCascD'), tr('gCascH'));
  h += item(svgGema({ col: PAL[2], glyph: 'estrella' }), tr('gObjT'), tr('gObjD'), tr('gObjH'));
  h += '<div class="glos-item"><svg class="glos-ic" viewBox="0 0 46 46"><text x="23" y="32" font-size="30" text-anchor="middle">⭐</text></svg><div class="glos-tx"><b>' + tr('gEstrT') + '</b><span>' + tr('gEstrD') + '<span class="how">' + tr('gEstrH') + '</span></span></div></div>';
  h += '</div>';

  h += '<div class="glos-sec"><h3>' + tr('gDiam') + '</h3>';
  h += item(svgGema({ col: PAL[0], hard: 2 }), tr('gDuroT'), tr('gDuroD'), tr('gDuroH'));
  h += item(svgGema({ col: PAL[5], hard: 3 }), tr('gRefT'), tr('gRefD'), '');
  h += '</div>';

  h += '<div class="glos-sec"><h3>' + tr('gPow') + '</h3>';
  h += item(svgGema({ col: PAL[4], glyph: 'rayoH' }), tr('gRayoT'), tr('gRayoD'), tr('gRayoH'));
  h += item(svgGema({ col: PAL[3], glyph: 'bomba' }), tr('gBombaT'), tr('gBombaD'), tr('gBombaH'));
  h += item(svgGema({ glyph: 'estrella', col: ['#f8fafc', '#cbd5e1'] }), tr('gEstrellaT'), tr('gEstrellaD'), tr('gEstrellaH'));
  h += item(svgGema({ col: PAL[1], glyph: 'cometa' }), tr('gCometaT'), tr('gCometaD'), tr('gCometaH'));
  h += '<div class="glos-item" style="border:none"><svg class="glos-ic" viewBox="0 0 46 46"></svg><div class="glos-tx"><span>' + tr('gActivar') + '</span></div></div>';
  h += '</div>';

  h += '<div class="glos-sec"><h3>' + tr('gComb') + '</h3>';
  h += item(svgGrid(cruzG(), A), tr('gC1T'), tr('gC1D'), '');
  h += item(svgGrid(filaG(1).concat(filaG(2),filaG(3),colG(1),colG(2),colG(3)), A), tr('gC2T'), tr('gC2D'), '');
  h += item(svgGrid(areaG(2,2,2), '#fde68a'), tr('gC3T'), tr('gC3D'), '');
  h += item(svgGrid([[1,1],[3,1],[2,3],[0,2],[4,2]], '#bae6fd'), tr('gC4T'), tr('gC4D'), '');
  h += item(svgGrid([[0,0],[4,0],[2,2],[0,4],[4,4],[3,1]], '#bae6fd'), tr('gC5T'), tr('gC5D'), '');
  h += item(svgGema({ wide: true, cols: [['#f8fafc','#cbd5e1'], PAL[3]], glyph: ['estrella','bomba'] }), tr('gC6T'), tr('gC6D'), '');
  h += item(svgGrid(todoG(), '#a5f3fc'), tr('gC7T'), tr('gC7D'), '');
  h += '</div>';

  $('glosBody').innerHTML = h;
}

export function abrirGlosario () {
  if (!S.glosListo) { construirGlosario(); S.glosListo = true; }
  $('modalGlosario').classList.add('abierto');
}
