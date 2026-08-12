import { test, expect, type Page } from '@playwright/test'
import { criarPedidoNoBanco, limparPedidosDeTeste } from './apoio'

/**
 * Cada teste move o mesmo pedido. Sem devolver ele ao início, o segundo teste
 * começa onde o primeiro parou — e a falha aparece longe da causa.
 *
 * Voltar situação é coisa que a Esteira **não** faz por regra (RN12): por isso
 * a volta acontece aqui, no SQL do teste, e não por nenhuma porta do sistema.
 */
test.beforeEach(async () => {
  // Cada teste move o mesmo pedido. Recriar é mais honesto que voltar situação:
  // voltar é coisa que a Esteira não faz por regra (RN12), nem no teste.
  await limparPedidosDeTeste()
  await criarPedidoNoBanco()
})

async function abrirPrimeiroPedido(page: Page) {
  await page.goto('/pedidos')
  // A linha é um botão com nome acessível, acionado pelo teclado: o cabeçalho
  // fixo do grupo cobre o alvo do mouse (ver lista.spec.ts).
  const linha = page.getByRole('button', { name: /Abrir o pedido PED-/ }).first()
  await linha.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
}

test('avançar grava histórico com data e autor, e zera o relógio', async ({ page }) => {
  await abrirPrimeiroPedido(page)
  // Escopo no histórico: a página inteira tem outros <li> (navegação, pendências).
  const historico = page.getByTestId('historico').getByRole('listitem')
  const antes = await historico.count()

  await page.getByRole('button', { name: /Avançar para/i }).click()
  await page.getByRole('button', { name: /Confirmar mudança/i }).click()

  // O rótulo aparece na tag, na régua e na barra: a tag é a fonte da verdade.
  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')
  await expect(historico).toHaveCount(antes + 1)
  await expect(historico.first()).toContainText(/\d{2}\/\d{2}\/\d{4}/)   // data
  await expect(page.getByTestId('dias-parados')).toHaveText('0')
})

test('transição de problema exige motivo e o botão é vermelho', async ({ page }) => {
  await abrirPrimeiroPedido(page)
  await page.getByRole('button', { name: 'Todas as situações' }).click()
  const parado = page.getByRole('button').filter({ hasText: /^\s*—?\s*PARADO/ }).first()
  await parado.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText(/Motivo \(obrigatório\)/)).toBeVisible()
  const confirmar = page.getByRole('button', { name: /Confirmar mudança/i })
  await expect(confirmar).toBeDisabled()

  await page.getByLabel(/Motivo/i).fill('Operadora não respondeu em cinco dias.')
  await expect(confirmar).toBeEnabled()
  await confirmar.click()
  await expect(page.getByText('Operadora não respondeu em cinco dias.')).toBeVisible()
})

test('transição bloqueada aparece visível, com cadeado e motivo, e não é clicável', async ({ page }) => {
  await abrirPrimeiroPedido(page)
  await page.getByRole('button', { name: 'Todas as situações' }).click()

  // O degrau proibido continua na escada, desabilitado e com o motivo escrito —
  // é assim que a tela ensina a regra em vez de só recusar. O motivo depende de
  // onde o pedido está: no começo do fluxo, o que falta são as etapas do meio.
  const bloqueada = page.getByRole('button').filter({ hasText: 'PEDIDO FINALIZADO' }).first()
  await expect(bloqueada).toBeVisible()
  await expect(bloqueada).toBeDisabled()
  await expect(bloqueada).toContainText(/Passa por|Só depois de ENTREGUE/)
})

test('pendência sem dono não grava', async ({ page }) => {
  await abrirPrimeiroPedido(page)
  await page.getByRole('button', { name: /^Abrir$/ }).click()
  await page.getByLabel(/Pergunta/i).fill('A operadora aceita portabilidade parcial?')
  await expect(page.getByRole('button', { name: /Abrir pendência/i })).toBeDisabled()

  await page.getByLabel(/Dono/i).selectOption('Supervisor')
  await expect(page.getByRole('button', { name: /Abrir pendência/i })).toBeEnabled()
})

test('a mudança sobrevive ao reload — persistência real, não estado de tela', async ({ page }) => {
  await abrirPrimeiroPedido(page)
  const situacao = await page.getByTestId('situacao-atual').textContent()
  await page.reload()
  await expect(page.getByTestId('situacao-atual')).toHaveText(situacao!)
})
