import { defineConfig } from '@playwright/test'
// O processo de teste também fala com o banco: ele limpa a própria fixture.
import './testes/carregar-env'

export default defineConfig({
  testDir: './testes/fluxo',
  // Um Postgres para todos: rodar specs em paralelo faz um limpar a base do
  // outro. Serial é mais lento e é o que corresponde à realidade do ambiente.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100/painel',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
