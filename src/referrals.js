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
import { loadDoc, saveDoc, REFERRALS_THREAD } from './store.js';

const BASE = 'https://diamonds.closer.click/';
const LS_REF = 'diamonds_referrals';       // cache local del set de pubkeys referidas
const LS_REPORTED = 'diamonds_invited_by'; // invitadores a los que ya reporté (anti-doble)

// Cada referido único = +3 estrellas-bonus (≈ un nivel) hacia el desbloqueo.
export const ESTRELLAS_POR_REFERIDO = 3;

let _set = new Set();
let _onChange = () => {};
let _receipts = null;

export function referralCount () { return _set.size; }
export function referralBonusStars () { return _set.size * ESTRELLAS_POR_REFERIDO; }
export function onReferralsChange (fn) { _onChange = fn || (() => {}); }

function emit () { try { _onChange(referralCount()); } catch {} }

function loadLocal () { try { const a = JSON.parse(localStorage.getItem(LS_REF)); if (Array.isArray(a)) _set = new Set(a); } catch {} }
function saveLocal () { try { localStorage.setItem(LS_REF, JSON.stringify([..._set])); } catch {} }

function addReferral (pk) {
  if (!pk || _set.has(pk)) return;
  _set.add(pk);
  saveLocal();
  saveDoc(REFERRALS_THREAD, [..._set]).catch(() => {});
  emit();
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
      if (ch) { saveLocal(); emit(); }
    }
  } catch {}
}

/**
 * Lado del que ABRE: si la URL trae `#i=<pubkey>`, reportar al invitador (una sola
 * vez por invitador). Limpia el hash. No-op si es tu propia invitación.
 */
export async function handleInviteHash () {
  const m = (location.hash || '').match(/[#&]i=([^&]+)/);
  if (!m) return;
  const inviter = unpackPubkey(m[1]);
  try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  if (!inviter) return;
  await ensureConnected();
  const mine = getMyPublickey() || (await getIdentity().then(id => id && id.me && id.me.publickey).catch(() => null));
  if (mine && mine === inviter) return;   // no auto-referirse
  let reported = [];
  try { reported = JSON.parse(localStorage.getItem(LS_REPORTED)) || []; } catch {}
  if (reported.includes(inviter)) return;
  const ok = await receipts().report({ toPubkey: inviter, kind: 'referral', url: BASE });
  if (ok) { reported.push(inviter); try { localStorage.setItem(LS_REPORTED, JSON.stringify(reported)); } catch {} }
}
