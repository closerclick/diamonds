import { test, expect } from '@playwright/test'

// Verifica el enlace de invitación de los referidos: con un vault de prueba
// inyectado, inviteLink() arma `#i=<pubkey empacada>` y el token desempaqueta a la
// MISMA pubkey (lo que garantiza el ruteo del acuse por el proxy). El conteo
// arranca en 0 (sin bonus). El flujo cross-peer real (A invita, B abre, A suma) se
// valida con 2 identidades contra el proxy en vivo; la entrega onReceipt está
// cubierta por el smoke del paquete.
test('enlace de invitación: #i= round-trip de la pubkey', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch {}
    globalThis.__TEST_VAULT_PROMISE__ = Promise.resolve({
      me: { publickey: 'PKTEST', nickname: 'tester' },
      signData: async () => ({ signature: 'x', publickey: 'PKTEST' }),
    })
  })
  await page.goto('/')

  const r = await page.evaluate(async () => {
    const ref = await import('/src/referrals.js')
    const link = await ref.inviteLink()
    return { link, count: ref.referralCount(), bonus: ref.referralBonusStars() }
  })

  expect(r.link).toContain('https://diamonds.closer.click/#i=')
  const token = r.link.split('#i=')[1]
  const decoded = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  expect(decoded).toBe('PKTEST')
  expect(r.count).toBe(0)
  expect(r.bonus).toBe(0)
})
