import { defineConfig, devices } from '@playwright/test'

// E2E sobre el servidor de DEV de Vite: así los tests pueden importar los módulos
// fuente (`/src/...`) para validar el motor determinista, además de la UI.
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3300',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 3300 --strictPort',
    port: 3300,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
