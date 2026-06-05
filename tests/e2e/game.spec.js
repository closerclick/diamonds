import { test, expect } from '@playwright/test'

// 1) UI: el mapa se renderiza, se entra a un nivel y el HUD es correcto.
test('mapa → entrar al nivel 1 → HUD', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.clear() } catch {} })
  await page.goto('/')

  // El mapa está activo y hay al menos un nodo de nivel jugable.
  await expect(page.locator('#vistaMapa')).toHaveClass(/activa/)
  const nodo = page.locator('.nivel-nodo:not(.bloq)').first()
  await expect(nodo).toBeVisible()

  // Tocar el nodo entra al juego (la lógica de "tap" del pan dispara su acción).
  // force: el nodo "actual" pulsa (animación) y nunca es "estable" para Playwright.
  await nodo.click({ force: true })
  await expect(page.locator('#vistaJuego')).toHaveClass(/activa/)
  await expect(page.locator('#hudNivel')).toHaveText('1·1')
  await expect(page.locator('#moves')).toHaveText('30')
  // Nivel 1 es de puntos: objetivo 1120 (600+320+200 redondeado a 10).
  await expect(page.locator('#objVal')).toHaveText('0/1120')
})

// 2) Motor determinista: generación sin matches iniciales, con jugadas posibles,
//    e idéntica para el mismo nivel (mismo seed) en dos corridas.
test('generación determinista del nivel (sin matches, hay jugadas, reproducible)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const { S } = await import('/src/state.js')
    const { defNivel } = await import('/src/rng.js')
    const { generarNivel } = await import('/src/engine/levelgen.js')
    const { tieneMatches, hayMovimientos } = await import('/src/engine/matching.js')

    const snapshot = () => S.grid.map(row => row.map(g => g.tipo))

    S.def = defNivel(1); generarNivel();
    const dims = [S.grid.length, S.grid[0].length]
    const sinMatches = !tieneMatches()
    const hayJugadas = hayMovimientos()
    const g1 = snapshot()

    S.def = defNivel(1); generarNivel();
    const g2 = snapshot()

    return { dims, sinMatches, hayJugadas, igual: JSON.stringify(g1) === JSON.stringify(g2) }
  })

  expect(r.dims).toEqual([8, 8])
  expect(r.sinMatches).toBe(true)
  expect(r.hayJugadas).toBe(true)
  expect(r.igual).toBe(true)
})
