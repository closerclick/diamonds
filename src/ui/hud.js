// HUD del juego (marcador), combo flotante y aplicación del idioma a la UI.
// Verbatim del juego original.
import { $ } from '../dom.js';
import { S } from '../state.js';
import { tr, getLang, setLang } from '../i18n.js';
import { renderMapa } from './map.js';

export function actualizarHUD () {
  const def = S.def;
  $('hudNivel').textContent = def.w + '·' + def.em;
  $('moves').textContent = Math.max(0, S.movs);
  $('score').textContent = S.score;
  const ov = $('objVal');
  if (def.tipo === 'puntos') { $('objLbl').textContent = 'Meta'; ov.textContent = S.score + '/' + def.objetivoPuntos; ov.classList.remove('romper'); }
  else { $('objLbl').textContent = 'Romper'; ov.textContent = Math.max(0, S.objRestante) + ' 💎'; ov.classList.add('romper'); }
}

export function mostrarCombo (n) {
  const el = $('combo');
  el.textContent = '¡Combo ×' + n + '!';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

export function aplicarIdioma () {
  const LANG = getLang();
  document.documentElement.lang = LANG;
  $('btnIdioma').textContent = LANG === 'es' ? 'EN' : 'ES';
  $('btnMapaTop').textContent = tr('mapa');
  $('btnMapa2').textContent = tr('mapa');
  $('mapaRecenter').textContent = tr('nivelActual');
  $('libroTxt').textContent = tr('guia');
  $('mapaHint').textContent = tr('hint');
  $('glosTitulo').textContent = tr('guiaTitulo');
  $('lblNivel').textContent = tr('lvl');
  $('lblMov').textContent = tr('mov');
  $('lblPuntos').textContent = tr('puntos');
  $('btnSiguiente').textContent = tr('siguiente');
  $('btnReintentar').textContent = tr('reintentar');
  $('btnEndless').textContent = tr('endless');
  $('btnCompartir').textContent = tr('compartir');
  $('btnMapaModal').textContent = tr('irMapa');
  S.glosListo = false;                 // forzar reconstrucción del glosario
  if (S.def) actualizarHUD();
  if (S.vista === 'mapa') { try { renderMapa(); } catch (e) {} }
}

export function toggleIdioma () {
  setLang(getLang() === 'es' ? 'en' : 'es');
  aplicarIdioma();
}
