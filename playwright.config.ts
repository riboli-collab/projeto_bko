import { defineConfig } from '@playwright/test'
// O processo de teste também fala com o banco: ele limpa a própria fixture.
import './testes/carregar-env'
import { SEGREDO_DO_TESTE, ARQUIVO_DE_SESSAO } from './testes/fluxo/constantes'

/**
 * A suíte roda **autenticada**, como em produção.
 *
 * O projeto `autenticar` cria as pessoas de teste, entra uma vez e guarda a
 * sessão; os specs do fluxo a reusam e nem sabem que existe login. `acesso`
 * roda sem sessão nenhuma, porque é ele que testa a porta trancada.
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
      testMatch: /(acesso|troca-de-senha|papeis)\.spec\.ts/,
      // Contexto limpo de propósito: é a porta fechada que está sendo medida.
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: 'fluxo',
      testIgnore: [/acesso\.spec\.ts/, /troca-de-senha\.spec\.ts/, /papeis\.spec\.ts/, /autenticar\.setup\.ts/],
      dependencies: ['autenticar'],
      use: { storageState: ARQUIVO_DE_SESSAO },
    },
  ],
  webServer: {
    // Chama o `next` direto, sem passar por `npm run dev`: o script de
    // desenvolvimento já fixa `--port 3300`, e encadear viraria
    // `--port 3300 --port 3100`, com o resultado dependendo de qual das duas o
    // parser escolhe. A suíte tem porta própria e não pode depender disso.
    command: `SEGREDO_DA_SESSAO='${SEGREDO_DO_TESTE}' npx next dev --port 3100`,
    // Pela saúde, que é a única rota aberta: esperar por `/painel` daria 307
    // para `/entrar`, e o Playwright desistiria antes de o app subir.
    url: 'http://localhost:3100/saude',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
