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

// Consumir un link de OTRO suma estrellas-bonus al que abre (dedup por contacto).
test('consumir #i= de otro suma estrellas-bonus', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch {}
    globalThis.__TEST_VAULT_PROMISE__ = Promise.resolve({
      me: { publickey: 'PKTEST', nickname: 'tester' },
      signData: async () => ({ signature: 'x', publickey: 'PKTEST' }),
    })
  })
  // Link de OTRO usuario (PKOTHER) → al abrirlo, handleInviteHash lo consume.
  const token = Buffer.from('PKOTHER', 'utf8').toString('base64url')
  await page.goto('/#i=' + token)

  // El consumo es local (no necesita red); poll hasta que cuente.
  await expect.poll(async () => page.evaluate(async () => (await import('/src/referrals.js')).consumedCount()))
    .toBe(1)
  const bonus = await page.evaluate(async () => (await import('/src/referrals.js')).consumedBonusStars())
  expect(bonus).toBe(1)
  // El hash se limpió.
  expect(await page.evaluate(() => location.hash)).toBe('')

  // Reprocesar el mismo link no recuenta (dedup por contacto, misma sesión).
  const still = await page.evaluate(async (tok) => {
    const ref = await import('/src/referrals.js')
    location.hash = '#i=' + tok
    await ref.handleInviteHash()
    return ref.consumedCount()
  }, token)
  expect(still).toBe(1)
})
