import { test, expect } from '@playwright/test'

test('mostra as quatro perguntas na ordem, em grade 2x2 sem rolagem', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/painel')

  const titulos = await page.getByRole('heading', { level: 2 }).allTextContents()
  expect(titulos).toHaveLength(4)
  expect(titulos[0]).toMatch(/estourou o prazo/i)
  expect(titulos[1]).toMatch(/portabilidade/i)
  expect(titulos[2]).toMatch(/entregue/i)
  expect(titulos[3]).toMatch(/chegou hoje/i)

  const rolagem = await page.evaluate(() => document.body.scrollHeight > window.innerHeight)
  expect(rolagem).toBe(false)
})

/**
 * O cartão é um `<section>` sem nome acessível — não dá para pegá-lo por
 * `role=region`. Escopo pelo título, que é a copy travada contra o pacote de
 * design em `copy-do-painel.test.ts`.
 */
const cartaoDe = (page: import('@playwright/test').Page, titulo: string) =>
  page.locator('section').filter({ hasText: titulo })

test('o pedido criado hoje aparece em "chegou hoje"', async ({ page }) => {
  await page.goto('/painel')
  const cartao = cartaoDe(page, 'O que chegou hoje para conferir?')
  await expect(cartao.getByText(/PED-\d{4}-\d{4}/).first()).toBeVisible()
})

test('cartão zerado é notícia boa: mensagem própria, sem vermelho', async ({ page }) => {
  await page.goto('/painel')
  const cartao = cartaoDe(page, 'Quais portabilidades são amanhã?')

  // Sem portabilidade marcada, o cartão continua no quadrante e diz a boa
  // notícia com as palavras do pacote — nunca uma lista vazia, nunca alarme.
  await expect(cartao.getByText('Nenhuma portabilidade marcada para amanhã.')).toBeVisible()
  await expect(cartao.locator('[class*="red-"]')).toHaveCount(0)
})

test('nenhuma transição de situação acontece no painel', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByRole('button', { name: /Avançar|Confirmar mudança/i })).toHaveCount(0)
})

test('clicar num pedido abre o Status do Pedido', async ({ page }) => {
  await page.goto('/painel')
  const linha = page.getByRole('button').filter({ hasText: /PED-\d{4}-\d{4}/ }).first()
  await linha.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
})

test('abaixo de 1024px vira coluna única na ordem de urgência', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/painel')
  const titulos = await page.getByRole('heading', { level: 2 }).allTextContents()
  expect(titulos[0]).toMatch(/estourou o prazo/i)
})
