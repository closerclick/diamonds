// Persistencia durable vía @closerclick/closer-click-store (store.closer.click,
// §4). Modelo de hilos (appendMessage/listThread). Guardamos "documentos" (último
// estado) por hilo: progreso y set de referidos. Si el store no carga, caemos a un
// shim sobre localStorage para que el juego ande offline.
let backendPromise = null;

function shimBackend () {
  const key = t => 'diamonds.shim.' + t;
  const read = t => { try { return JSON.parse(localStorage.getItem(key(t))) || []; } catch { return []; } };
  const write = (t, a) => { try { localStorage.setItem(key(t), JSON.stringify(a)); } catch {} };
  return {
    kind: 'localstorage',
    async appendMessage (t, e) { const a = read(t); a.push(e); write(t, a); },
    async listThread (t) { return read(t); },
    async removeThread (t) { try { localStorage.removeItem(key(t)); } catch {} },
  };
}

async function getBackend () {
  if (backendPromise) return backendPromise;
  backendPromise = (async () => {
    try {
      const mod = await import('@closerclick/closer-click-store');
      const store = await mod.Store.connect();
      if (store && typeof store.appendMessage === 'function' && typeof store.listThread === 'function') {
        return { kind: 'store',
          appendMessage: (t, e) => store.appendMessage(t, e),
          listThread: (t, o) => store.listThread(t, o),
          removeThread: t => store.removeThread(t) };
      }
      throw new Error('store API mismatch');
    } catch (e) {
      console.warn('[diamonds] store no disponible, usando localStorage:', (e && e.message) || e);
      return shimBackend();
    }
  })();
  return backendPromise;
}

export async function storeKind () { return (await getBackend()).kind; }

// Lee el último "documento" de un hilo (o null).
export async function loadDoc (thread) {
  const b = await getBackend();
  try {
    const entries = await b.listThread(thread, {});
    if (entries && entries.length) { const last = entries[entries.length - 1]; return (last && last.doc != null) ? last.doc : null; }
  } catch {}
  return null;
}
// Sobrescribe el documento de un hilo (último estado).
export async function saveDoc (thread, doc) {
  const b = await getBackend();
  try { await b.removeThread(thread); } catch {}
  await b.appendMessage(thread, { id: 'doc', ts: Date.now(), doc });
}

export const PROGRESS_THREAD = 'diamonds.progress';
export const REFERRALS_THREAD = 'diamonds.referrals';   // pubkeys que abrieron MI link (invitador)
export const CONSUMED_THREAD = 'diamonds.consumed';     // pubkeys de links que YO abrí (consumidor)
