// Notificaciones del ecosistema para Diamonds: controlador con scope 'diamonds' y
// la categoría 'referrals' (avisos de que un amigo entró con tu invitación), más el
// provider de Web Push ligado al vault. Singleton.
import { createNotifications, createVaultPushProvider } from '@closerclick/closer-click-notifications';
import { getProxyClient } from './connection.js';
import { getIdentity } from './identity.js';

const provider = createVaultPushProvider({
  proxyClient: () => getProxyClient(),
  identity: () => getIdentity(),
  storageKey: 'diamonds',
});

const controller = createNotifications({
  storageKey: 'diamonds',
  categories: [
    {
      key: 'referrals',
      label: { es: 'Amigos que entran con tu invitación', en: 'Friends joining with your invite' },
      hint: { es: 'Avisa cuando un contacto abre un enlace de invitación tuyo.', en: 'Notify when a contact opens one of your invite links.' },
    },
  ],
  push: provider,
});

export function getNotificationsController () { return controller; }
export function ensurePushSubscribed () { return provider.ensureSubscribed ? provider.ensureSubscribed() : Promise.resolve(); }
