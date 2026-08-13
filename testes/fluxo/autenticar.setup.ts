import { test as setup, expect } from '@playwright/test'
import { criarUsuariosDeTeste } from './apoio'
import { USUARIO_DO_TESTE, SENHA_DO_TESTE, NOME_DO_TESTE, ARQUIVO_DE_SESSAO } from './constantes'

/**
 * Cria as pessoas de teste, entra uma vez e guarda a sessão para todos os specs.
 *
 * A alternativa seria rodar a suíte com a porta destrancada, mas aí ela testaria
 * uma aplicação que não é a que vai para produção. Aqui a autenticação fica
 * ligada o tempo todo, como no Railway, e os specs do fluxo nem sabem que ela
 * existe — trabalham logados, como a equipe trabalha.
 */
setup('entra como pessoa e guarda a sessão', async ({ page }) => {
  await criarUsuariosDeTeste()

  await page.goto('/entrar')
  await page.getByLabel('Usuário').fill(USUARIO_DO_TESTE)
  await page.getByLabel('Senha').fill(SENHA_DO_TESTE)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/painel$/)
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  // O nome de quem entrou aparece no menu — é o sinal de que há uma pessoa, e
  // não só uma sessão anônima válida.
  await expect(page.getByRole('button', { name: new RegExp(NOME_DO_TESTE) })).toBeVisible()

  await page.context().storageState({ path: ARQUIVO_DE_SESSAO })
})
