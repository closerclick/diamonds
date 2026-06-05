// Singleton del vault de identidad id.closer.click. Best-effort: si no carga, el
// juego sigue jugándose offline (los referidos simplemente no se reportan).
import { Identity } from '@closerclick/closer-click-identity';

let _idPromise = null;

export function getIdentity () {
  // Hook SOLO para E2E: si la página inyectó un vault de prueba, se usa ese.
  const testVault = globalThis.__TEST_VAULT_PROMISE__;
  if (testVault) { _idPromise = testVault; return _idPromise; }
  if (!_idPromise) {
    _idPromise = Identity.connect()
      .then(id => id)
      .catch(e => { console.warn('Identity vault inalcanzable:', e); return null; });
  }
  return _idPromise;
}
