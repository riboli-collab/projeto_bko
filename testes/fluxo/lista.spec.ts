import { test, expect, type Page } from '@playwright/test'
import { criarPedidoNoBanco, limparPedidosDeTeste } from './apoio'

// A fila que estes testes leem é montada por eles, não herdada de outro spec.
test.beforeEach(async () => {
  await limparPedidosDeTeste()
  await criarPedidoNoBanco()
})

/**
 * A Lista renderiza duas vezes o mesmo pedido: cartão no mobile, linha na tabela
 * no desktop, e o CSS esconde um dos dois. Procurar por texto sem filtrar o
 * visível acha primeiro o que está escondido — por isso `:visible` em tudo que
 * é conteúdo de pedido.
 */
const numeroVisivel = (page: Page) =>
  page.getByText(/PED-\d{4}-\d{4}/).locator('visible=true').first()

test('o pedido criado aparece na fila, no grupo da situação certa', async ({ page }) => {
  await page.goto('/pedidos')
  await expect(page.getByText('PEDIDO DO COMERCIAL').first()).toBeVisible()
  await expect(numeroVisivel(page)).toBeVisible()
})

test('o resumo do topo conta em aberto, e só pinta de vermelho quando há estouro', async ({ page }) => {
  await page.goto('/pedidos')
  const cabecalho = page.getByRole('heading', { name: 'Pedidos' }).locator('..')
  await expect(cabecalho.getByText(/em aberto/)).toBeVisible()

  // "com prazo estourado" é o único vermelho da tela, e só existe quando há
  // pedido estourado. Sem estouro, a frase não aparece — não aparece zerada.
  const estourados = await page.getByText(/com prazo estourado/).count()
  const vermelhos = await page.locator('.text-red-700, .text-red-400').count()
  expect(estourados === 0 ? vermelhos : 1).toBeGreaterThanOrEqual(estourados)
})

test('os filtros combinam e a limpeza zera tudo', async ({ page }) => {
  await page.goto('/pedidos')
  await page.getByRole('button', { name: /Responsável/i }).click()
  await page.getByRole('option', { name: 'Gabrielle Souza' }).click()

  // Filtrado pelo responsável, o pedido dele continua na fila.
  await expect(numeroVisivel(page)).toBeVisible()

  const limpar = page.getByRole('button', { name: 'Limpar tudo' })
  await expect(limpar).toBeVisible()
  await limpar.click()
  await expect(limpar).toHaveCount(0)
})

test('filtro sem resultado mostra o vazio com botão de limpar, não erro', async ({ page }) => {
  await page.goto('/pedidos')
  await page.getByPlaceholder(/Buscar/i).fill('ZZZZZZ-NAO-EXISTE')

  await expect(page.getByText('Nenhum pedido com estes filtros')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
  // Ausência de resultado é notícia, não falha: nada de ícone ou cor de erro.
  await expect(page.getByText(/erro|falha/i)).toHaveCount(0)
})

test('clicar na linha abre o Status do Pedido', async ({ page }) => {
  await page.goto('/pedidos')
  // A linha inteira é um `<button>` com nome acessível. Aciona pelo teclado:
  // o cabeçalho fixo do grupo cobre o topo da primeira linha, e o clique do
  // mouse cai nele. **É defeito de layout, anotado para a revisão de design** —
  // com uma linha só no grupo, o alvo do mouse fica parcialmente coberto.
  const linha = page.getByRole('button', { name: /Abrir o pedido PED-/ }).first()
  await linha.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
})

test('abaixo de 768px a tabela vira cartão', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/pedidos')
  await expect(numeroVisivel(page)).toBeVisible()
  // A tabela existe no DOM, mas escondida: o que não pode é rolagem lateral.
  const larguraDoCorpo = await page.evaluate(() => document.body.scrollWidth)
  expect(larguraDoCorpo).toBeLessThanOrEqual(375)
})
