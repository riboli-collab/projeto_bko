import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './testes/fluxo',
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100/painel',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
