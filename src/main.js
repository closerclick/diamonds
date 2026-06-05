// Punto de entrada de Diamonds (Vite). Inicializa el estado (canvas, progreso,
// nivel), engancha la interacción y los listeners de UI, arranca el loop, registra
// el Service Worker y cablea la navegación "volver" unificada del ecosistema.
import './main.css';

// Botón "Instalar App" (PWA) unificado: solo importar registra <closer-click-install>.
import '@closerclick/closer-click-install';
// Navegación "volver" unificada: registra <closer-click-back> + captura el botón
// físico de Android / gesto de iOS / atrás del navegador.
import { createBackNav } from '@closerclick/closer-click-nav';

import { $ } from './dom.js';
import { S } from './state.js';
import { defNivel } from './rng.js';
import { cargarProg } from './progress.js';
import { loop } from './loop.js';
import { registerInput } from './input.js';
import { medir } from './render.js';
import { mostrarVista, renderMapa, irAlMapa } from './ui/map.js';
import { abrirGlosario } from './ui/glossary.js';
import { toggleIdioma } from './ui/hud.js';
import { iniciarNivel, entrarEndless, compartirNivel } from './levels.js';
import { syncProgressFromStore } from './progress.js';
import { handleInviteHash, startReferrals, onReferralsChange, inviteLink } from './referrals.js';

/* ===================== Init estado ===================== */
S.cv = $('board');
S.ctx = S.cv.getContext('2d');
S.prog = cargarProg();
S.def = defNivel(1);

registerInput();

/* ===================== Eventos UI ===================== */
$('btnMapaTop').addEventListener('click', irAlMapa);
$('btnMapa2').addEventListener('click', irAlMapa);
$('btnGlosario').addEventListener('click', abrirGlosario);
$('btnIdioma').addEventListener('click', toggleIdioma);
$('btnGlosCerrar').addEventListener('click', () => $('modalGlosario').classList.remove('abierto'));
$('modalGlosario').addEventListener('click', e => { if (e.target === $('modalGlosario')) $('modalGlosario').classList.remove('abierto'); });
$('btnMapaModal').addEventListener('click', irAlMapa);
$('btnSiguiente').addEventListener('click', () => { $('modalFin').classList.remove('abierto'); iniciarNivel(S.def.n + 1); });
$('btnReintentar').addEventListener('click', () => { $('modalFin').classList.remove('abierto'); iniciarNivel(S.def.n); });
$('btnEndless').addEventListener('click', entrarEndless);
$('btnCompartir').addEventListener('click', compartirNivel);

window.addEventListener('resize', () => { if (S.vista === 'juego') medir(); else if (S.vista === 'mapa') renderMapa(); });

/* ===================== Arranque ===================== */
mostrarVista('mapa');
renderMapa();
requestAnimationFrame(loop);

/* ===================== PWA ===================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ===================== Ecosistema: store + referidos ===================== */
// Si abriste un enlace de invitación (#i=...), avisar al invitador (best-effort).
handleInviteHash().catch(() => {});

// Progreso durable: fusionar lo que haya en el store con lo local y re-pintar.
syncProgressFromStore().then(ch => { if (ch && S.vista === 'mapa') renderMapa(); }).catch(() => {});

// Referidos: escuchar acuses y, al cambiar el contador, re-pintar el mapa (las
// estrellas-bonus desbloquean mundos). El enlace de invitación se enchufa al
// share de la moneda de support una vez que hay identidad.
onReferralsChange(() => { if (S.vista === 'mapa') renderMapa(); });
startReferrals().catch(() => {});
inviteLink().then(link => {
  if (!link) return;
  const sup = document.querySelector('closer-click-support');
  if (sup) sup.setAttribute('share-url', link);
}).catch(() => {});

/* ===================== Navegación "volver" ===================== */
// chevron del header + botón físico de Android / gesto iOS / atrás del navegador →
// cierra modal, vuelve del juego al mapa; si no hay nada → closer.click.
const nav = createBackNav();
// Capa por modal (se abren/cierran con la clase `abierto`).
const bindModal = (id) => {
  const el = document.getElementById(id); if (!el) return;
  let handle = null;
  const sync = () => {
    const open = el.classList.contains('abierto');
    if (open && !handle) handle = nav.open(() => el.classList.remove('abierto'));
    else if (!open && handle) { const h = handle; handle = null; h.close(); }
  };
  new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['class'] });
  sync();
};
['modalGlosario', 'modalFin'].forEach(bindModal);
// Vista de juego como "página" sobre el mapa: volver regresa al mapa.
const vj = document.getElementById('vistaJuego');
if (vj) {
  let vh = null;
  const syncV = () => {
    const on = vj.classList.contains('activa');
    if (on && !vh) vh = nav.open(() => document.getElementById('btnMapaTop')?.click());
    else if (!on && vh) { const h = vh; vh = null; h.close(); }
  };
  new MutationObserver(syncV).observe(vj, { attributes: true, attributeFilter: ['class'] });
  syncV();
}
