import { test as setup, expect } from '@playwright/test'
import { SENHA_DO_TESTE, ARQUIVO_DE_SESSAO } from './constantes'

/**
 * Entra uma vez e guarda a sessão para todos os specs.
 *
 * A alternativa seria rodar a suíte com a tranca desligada, mas aí ela testaria
 * uma aplicação que não é a que vai para produção. Aqui a proteção fica ligada
 * o tempo todo, como no Railway, e os specs do fluxo nem sabem que ela existe.
 */
setup('entra e guarda a sessão', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel('Senha de acesso').fill(SENHA_DO_TESTE)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/painel$/)
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()

  await page.context().storageState({ path: ARQUIVO_DE_SESSAO })
})
