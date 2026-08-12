import { test, expect } from '@playwright/test'
import { CNPJ_DE_TESTE, criarClienteIncompleto, lerCliente, lerDivergencias, limparPedidosDeTeste } from './apoio'

/**
 * Critério 4: o digitado que discorda da base vira **registro**, não correção
 * silenciosa nem bloqueio. A base é o que vale.
 */
test.beforeEach(async () => {
  await limparPedidosDeTeste()
  await criarClienteIncompleto('Comércio Antigo Ltda')
})

async function abrirComOCadastroCarregado(page: import('@playwright/test').Page) {
  await page.goto('/pedidos/novo')
  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
  // A busca preenche o formulário com o cadastro: é daí que a comparação parte.
  await expect(page.locator('#campo-razaoSocial')).toHaveValue('Comércio Antigo Ltda')
}

test('razão social diferente da base aparece lado a lado, sem travar nada', async ({ page }) => {
  await abrirComOCadastroCarregado(page)
  await page.locator('#campo-razaoSocial').fill('Comércio Novo ME')

  const painel = page.getByText('Um campo diverge do cadastro').locator('..')
  await expect(painel).toContainText('Comércio Novo ME')
  await expect(painel).toContainText('Comércio Antigo Ltda')
  // Divergência é notícia, não impedimento: nada aqui desabilita campo nenhum.
  await expect(page.locator('#campo-razaoSocial')).toBeEditable()
})

test('acento, caixa e espaço não são divergência', async ({ page }) => {
  await abrirComOCadastroCarregado(page)
  await page.locator('#campo-razaoSocial').fill('  comercio  ANTIGO ltda ')
  await expect(page.getByText(/campos? diverge/)).toHaveCount(0)
})

test('completar o contato que veio truncado não é divergir da base', async ({ page }) => {
  await abrirComOCadastroCarregado(page)
  // A base traz "CLAUDIA". Completar é o que a validação dos 17 campos exige.
  await expect(page.locator('#campo-contato')).toHaveValue('CLAUDIA')
  await page.locator('#campo-contato').fill('Claudia Menezes')
  await expect(page.getByText(/campos? diverge/)).toHaveCount(0)
})

test('registrar grava na fila e o formulário passa a valer o da base', async ({ page }) => {
  await abrirComOCadastroCarregado(page)
  await page.locator('#campo-razaoSocial').fill('Comércio Novo ME')

  await page.getByRole('button', { name: /Registrar divergência e seguir com o da base/ }).click()

  // O botão promete duas coisas. A segunda é esta: o campo volta ao da base.
  await expect(page.locator('#campo-razaoSocial')).toHaveValue('Comércio Antigo Ltda')
  await expect(page.getByText(/campos? diverge/)).toHaveCount(0)

  const fila = await lerDivergencias()
  expect(fila).toHaveLength(1)
  expect(fila[0].campo_id).toBe('razaoSocial')
  expect(fila[0].valor_digitado).toBe('Comércio Novo ME')
  expect(fila[0].valor_da_base).toBe('Comércio Antigo Ltda')
  expect(fila[0].resolvida_em).toBeNull()

  // E o cadastro continua intacto: quem decide é gente, não a tela.
  const cliente = await lerCliente()
  expect(cliente.razao_social).toBe('Comércio Antigo Ltda')
})
