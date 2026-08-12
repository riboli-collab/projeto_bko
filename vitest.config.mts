import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: { environment: 'node', setupFiles: ['./testes/carregar-env.ts'] },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
