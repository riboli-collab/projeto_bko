import { defineConfig } from '@playwright/test'
// O processo de teste também fala com o banco: ele limpa a própria fixture.
import './testes/carregar-env'
import { SENHA_DO_TESTE, ARQUIVO_DE_SESSAO } from './testes/fluxo/constantes'

/**
 * A suíte roda com a tranca **ligada**, como em produção.
 *
 * O projeto `autenticar` entra uma vez e guarda a sessão; os specs do fluxo a
 * reusam e nem sabem que existe senha. `acesso` roda por último, sem sessão
 * nenhuma, porque é ele que testa a porta trancada.
 */
export default defineConfig({
  testDir: './testes/fluxo',
  // Um Postgres para todos: rodar specs em paralelo faz um limpar a base do
  // outro. Serial é mais lento e é o que corresponde à realidade do ambiente.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://localhost:3100' },
  projects: [
    { name: 'autenticar', testMatch: /autenticar\.setup\.ts/ },
    {
      name: 'acesso',
      testMatch: /acesso\.spec\.ts/,
      // Contexto limpo de propósito: é a porta fechada que está sendo medida.
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: 'fluxo',
      testIgnore: [/acesso\.spec\.ts/, /autenticar\.setup\.ts/],
      dependencies: ['autenticar'],
      use: { storageState: ARQUIVO_DE_SESSAO },
    },
  ],
  webServer: {
    command: `SENHA_DE_ACESSO='${SENHA_DO_TESTE}' npm run dev -- --port 3100`,
    // Pela saúde, que é a única rota aberta: esperar por `/painel` daria 307
    // para `/entrar`, e o Playwright desistiria antes de o app subir.
    url: 'http://localhost:3100/saude',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
