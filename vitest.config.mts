import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./testes/carregar-env.ts'],
    // Só a unidade. Sem isto o Vitest também recolhe os `.spec.ts` de
    // `testes/fluxo`, que são do Playwright e falham fora dele.
    include: ['testes/unidade/**/*.test.ts'],
  },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
