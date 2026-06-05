// Referidos con recompensa (mecánica "por diversión", sin anti-trampa: es
// autohosteado y los puntos viven en el store del propio usuario).
//
// - Compartís tu enlace de invitación `#i=<pack(tu pubkey)>`.
// - Quien lo abre te manda un acuse `kind:'referral'` por la cola del proxy.
// - Vos acumulás las pubkeys ÚNICAS de quienes abrieron (dedup por contacto) en
//   el store; cada referido te suma estrellas-bonus que desbloquean mundos antes.
//
// Reusa el motor común @closerclick/closer-click-notifications (createShareReceipts
// + onReceipt + packPubkey/unpackPubkey).
import { createShareReceipts, packPubkey, unpackPubkey } from '@closerclick/closer-click-notifications';
import { ensureConnected, getProxyClient, getMyPublickey } from './connection.js';
import { getIdentity } from './identity.js';
import { getNotificationsController } from './notifications.js';
import { loadDoc, saveDoc, REFERRALS_THREAD, CONSUMED_THREAD } from './store.js';

const BASE = 'https://diamonds.closer.click/';
const LS_REF = 'diamonds_referrals';       // cache: pubkeys que abrieron MI link (invitador)
const LS_CONSUMED = 'diamonds_consumed';   // cache: pubkeys de links que YO abrí (consumidor)
const LS_REPORTED = 'diamonds_invited_by'; // (legacy) invitadores ya reportados → migra a consumed

// Recompensa en estrellas-bonus (cuentan para desbloquear mundos):
//  - invitar (que abran tu link) premia más, porque difunde el juego.
//  - consumir (abrir el link de otro) también premia, pero un poco menos.
export const ESTRELLAS_POR_REFERIDO = 3;
export const ESTRELLAS_POR_CONSUMIDO = 1;

let _set = new Set();        // referidos (invitador)
let _consumed = new Set();   // links consumidos (consumidor)
let _onChange = () => {};
let _receipts = null;

export function referralCount () { return _set.size; }
export function consumedCount () { return _consumed.size; }
export function referralBonusStars () { return _set.size * ESTRELLAS_POR_REFERIDO; }
export function consumedBonusStars () { return _consumed.size * ESTRELLAS_POR_CONSUMIDO; }
export function onReferralsChange (fn) { _onChange = fn || (() => {}); }

function emit () { try { _onChange({ referidos: _set.size, consumidos: _consumed.size }); } catch {} }

function loadLocal () {
  try { const a = JSON.parse(localStorage.getItem(LS_REF)); if (Array.isArray(a)) _set = new Set(a); } catch {}
  try { const a = JSON.parse(localStorage.getItem(LS_CONSUMED)); if (Array.isArray(a)) _consumed = new Set(a); } catch {}
  // Migración del flag legacy de invitadores reportados → set de consumidos.
  try { const a = JSON.parse(localStorage.getItem(LS_REPORTED)); if (Array.isArray(a)) for (const pk of a) _consumed.add(pk); } catch {}
}
function saveSet () { try { localStorage.setItem(LS_REF, JSON.stringify([..._set])); } catch {} }
function saveConsumed () { try { localStorage.setItem(LS_CONSUMED, JSON.stringify([..._consumed])); } catch {} }

function addReferral (pk) {
  if (!pk || _set.has(pk)) return;
  _set.add(pk);
  saveSet();
  saveDoc(REFERRALS_THREAD, [..._set]).catch(() => {});
  emit();
}

// Marca un link de OTRO como consumido (me da estrellas-bonus). Dedup por pubkey.
function addConsumed (pk) {
  if (!pk || _consumed.has(pk)) return false;
  _consumed.add(pk);
  saveConsumed();
  saveDoc(CONSUMED_THREAD, [..._consumed]).catch(() => {});
  emit();
  return true;
}

function receipts () {
  if (!_receipts) {
    _receipts = createShareReceipts({
      proxyClient: () => getProxyClient(),
      identity: () => getIdentity(),
      notifications: getNotificationsController(),
      category: 'referrals',
      onReceipt: (env) => { if (env.kind === 'referral' && env.from && env.from.pubkey) addReferral(env.from.pubkey); },
    });
  }
  return _receipts;
}

/** Mi enlace de invitación (`#i=<pubkey empacada>`), o null si no hay identidad. */
export async function inviteLink () {
  const id = await getIdentity();
  const pk = id && id.me && id.me.publickey;
  if (!pk) return null;
  return BASE + '#i=' + packPubkey(pk);
}

/**
 * Lado AUTOR: cargar el set (local + store), escuchar acuses entrantes. Idempotente.
 */
export async function startReferrals () {
  loadLocal();
  emit();
  await ensureConnected();
  receipts().start();
  try {
    const remote = await loadDoc(REFERRALS_THREAD);
    if (Array.isArray(remote)) {
      let ch = false;
      for (const pk of remote) if (!_set.has(pk)) { _set.add(pk); ch = true; }
      if (ch) { saveSet(); emit(); }
    }
  } catch {}
  try {
    const rc = await loadDoc(CONSUMED_THREAD);
    if (Array.isArray(rc)) {
      let ch = false;
      for (const pk of rc) if (!_consumed.has(pk)) { _consumed.add(pk); ch = true; }
      if (ch) { saveConsumed(); emit(); }
    }
  } catch {}
}

/**
 * Lado del que ABRE/CONSUME: si la URL trae `#i=<pubkey>`, cuenta el link como
 * CONSUMIDO (te da estrellas-bonus, dedup por contacto) y avisa al invitador
 * (best-effort). Limpia el hash. No-op si es tu propia invitación.
 */
export async function handleInviteHash () {
  const m = (location.hash || '').match(/[#&]i=([^&]+)/);
  if (!m) return;
  const inviter = unpackPubkey(m[1]);
  try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  if (!inviter) return;
  loadLocal();
  const mine = getMyPublickey() || (await getIdentity().then(id => id && id.me && id.me.publickey).catch(() => null));
  if (mine && mine === inviter) return;   // no auto-consumirse
  if (_consumed.has(inviter)) return;     // ya consumido: no recuenta ni re-reporta
  // 1) Beneficio del consumidor: cuenta local (no necesita red).
  addConsumed(inviter);
  // 2) Avisar al invitador (best-effort; aunque falle, el consumo ya contó).
  try { await ensureConnected(); await receipts().report({ toPubkey: inviter, kind: 'referral', url: BASE }); } catch {}
}
