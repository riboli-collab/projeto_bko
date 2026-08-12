import { test, expect } from '@playwright/test'

// Os itens da navegação são `<button>` com `aria-current`, não `<a>`: o `MainNav`
// não conhece rota nem router, avisa por callback. Procurar por `link` aqui
// falharia contra o componente real.
test('a navegação leva às três telas e marca a ativa', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByRole('button', { name: /Painel/ })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('button', { name: /^Pedidos/ }).click()
  await expect(page).toHaveURL(/\/pedidos$/)

  await page.getByRole('button', { name: /Novo pedido/ }).click()
  await expect(page).toHaveURL(/\/pedidos\/novo$/)
})

test('o badge vermelho não aparece quando nada estourou', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByTestId('badge-estourados')).toHaveCount(0)
})

test('abaixo de 768px vira barra superior com hambúrguer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/painel')
  await expect(page.getByRole('button', { name: /abrir menu/i })).toBeVisible()
})

test('nenhum vermelho na tela além do alarme', async ({ page }) => {
  await page.goto('/painel')
  const vermelhos = await page.locator('[class*="bg-red-"], [class*="text-red-"]').count()
  expect(vermelhos).toBe(0)
})
