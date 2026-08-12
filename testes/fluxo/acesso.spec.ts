import { test, expect } from '@playwright/test'

/**
 * A tranca da porta, testada com ela ligada.
 *
 * Roda no projeto `acesso`, que a config declara **sem** sessão guardada: os
 * outros specs entram uma vez e reusam o cookie, e testar a porta fechada com a
 * chave no bolso provaria exatamente nada.
 */
import { SENHA_DO_TESTE as SENHA } from './constantes'

const BASE = 'http://localhost:3100'

test('sem senha, toda tela leva para a entrada', async ({ page }) => {
  for (const rota of ['/painel', '/pedidos', '/pedidos/novo']) {
    await page.goto(rota)
    await expect(page).toHaveURL(new RegExp(`/entrar\\?de=${encodeURIComponent(rota)}`))
    await expect(page.getByLabel('Senha de acesso')).toBeVisible()
  }
})

test('a tela de entrada não mostra a navegação nem consulta o banco', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Esteira' })).toBeVisible()
})

test('senha errada não entra, e diz isso sem revelar mais', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel('Senha de acesso').fill('chute')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Pelo id: o anunciador de rota do Next também é `role="alert"`.
  const erro = page.locator('#senha-erro')
  await expect(erro).toHaveText('Senha incorreta.')
  await expect(page).toHaveURL(/\/entrar/)
  // A mensagem não distingue "senha vazia" de "senha errada" nem cita a certa.
  await expect(erro).not.toContainText(/caracteres|começa|dica/i)
  // E o campo fica marcado como inválido, para quem ouve a tela.
  await expect(page.getByLabel('Senha de acesso')).toHaveAttribute('aria-invalid', 'true')
})

test('senha certa entra e devolve para onde a pessoa ia', async ({ page }) => {
  await page.goto('/pedidos')
  await expect(page).toHaveURL(/\/entrar/)

  await page.getByLabel('Senha de acesso').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/pedidos$/)
  await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
})

test('a sessão sobrevive à navegação e o cookie não é legível por script', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel('Senha de acesso').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/painel$/)

  await page.goto('/pedidos/novo')
  await expect(page.getByRole('heading', { name: 'Novo pedido' })).toBeVisible()

  // httpOnly: um XSS não consegue roubar a sessão lendo document.cookie.
  expect(await page.evaluate(() => document.cookie)).not.toContain('esteira_sessao')
})

test('o anexo também é protegido — não basta saber o id', async ({ request }) => {
  const semSessao = await request.get(`${BASE}/api/documentos/1`, { maxRedirects: 0 })
  expect([302, 307]).toContain(semSessao.status())
  expect(semSessao.headers()['location']).toContain('/entrar')
})

test('a saúde fica aberta, senão todo deploy seria reprovado', async ({ request }) => {
  const r = await request.get(`${BASE}/saude`)
  expect(r.status()).toBe(200)
  expect(await r.json()).toMatchObject({ ok: true })
})
