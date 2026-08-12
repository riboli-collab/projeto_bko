import { test, expect } from '@playwright/test'
import {
  CNPJ_DE_TESTE, NOME_DE_TESTE, abrirPeloNumero, criarClienteCompleto,
  criarPedidoNoBanco, limparPedidosDeTeste, preencherPedido,
} from './apoio'

/**
 * Duas coisas que o pedido novo precisa fazer:
 *
 * — achar o cliente pelo **nome**, não só pelo CNPJ, e trazer o cadastro inteiro;
 * — dizer o que o cliente paga na primeira fatura e o que ele paga todo mês,
 *   sabendo que o chip entra uma vez só.
 */

/**
 * Escopado na lista de propósito: `getByRole('option')` solto também casa com
 * os `<option>` dos `<select>` de operadora e plano, que são seis.
 */
const sugestoes = (page: import('@playwright/test').Page) =>
  page.getByRole('listbox', { name: 'Clientes encontrados' }).getByRole('option')

test.describe('localizar o cliente que já está na base', () => {
  test.beforeEach(async () => {
    await limparPedidosDeTeste()
    await criarClienteCompleto()
  })

  test('achar pelo nome preenche o formulário inteiro, inclusive o CNPJ', async ({ page }) => {
    await page.goto('/pedidos/novo')

    // Sem acento e em caixa baixa: quem digita rápido não acentua, e a base
    // guarda "Telecomunicações". O `translate` do Postgres resolve os dois lados.
    await page.getByLabel('Localizar cliente por nome ou CNPJ/CPF').fill('zebra telecomunicacoes')

    const opcao = sugestoes(page).filter({ hasText: NOME_DE_TESTE })
    await expect(opcao).toBeVisible()
    await opcao.click()

    // O documento que ninguém decora vem junto — é o ponto do campo de nome.
    await expect(page.locator('#campo-cnpjCpf')).toHaveValue(/11\.222\.333\/0001-81/)
    await expect(page.locator('#campo-razaoSocial')).toHaveValue(NOME_DE_TESTE)
    await expect(page.locator('#campo-contato')).toHaveValue('Fernando Ribeiro')
    await expect(page.locator('#campo-emailFinanceiro')).toHaveValue('financeiro@exemplo.com.br')
  })

  test('a busca traz os seis campos que a tela diz ter trazido', async ({ page }) => {
    await page.goto('/pedidos/novo')
    await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)

    // A tela afirma: "Nome, endereço fiscal, contato, telefone e os dois
    // e-mails vieram do cadastro". Eram três de seis.
    await expect(page.getByText(`${NOME_DE_TESTE} encontrado na base`)).toBeVisible()
    await expect(page.locator('#campo-razaoSocial')).toHaveValue(NOME_DE_TESTE)
    await expect(page.locator('#campo-contato')).toHaveValue('Fernando Ribeiro')
    await expect(page.locator('#campo-telefone')).toHaveValue('(49) 98888-7777')
    await expect(page.locator('#campo-emailAssinatura')).toHaveValue('assina@exemplo.com.br')
    await expect(page.locator('#campo-emailFinanceiro')).toHaveValue('financeiro@exemplo.com.br')
    await expect(page.locator('#campo-enderecoFiscal-cidade')).toHaveValue('Chapecó')
    await expect(page.locator('#campo-enderecoFiscal-cep')).toHaveValue('89801-000')
  })

  test('nome que não existe não inventa cliente', async ({ page }) => {
    await page.goto('/pedidos/novo')
    await page.getByLabel('Localizar cliente por nome ou CNPJ/CPF')
      .fill('Girafa Que Nao Existe SA')

    await expect(page.getByText(/Nenhum cliente com esse nome ou documento/)).toBeVisible()
    await expect(page.locator('#campo-cnpjCpf')).toHaveValue('')
  })

  test('menos de três caracteres não varre a base', async ({ page }) => {
    await page.goto('/pedidos/novo')
    await page.getByLabel('Localizar cliente por nome ou CNPJ/CPF').fill('ze')

    await expect(page.getByText('Digite pelo menos 3 caracteres.')).toBeVisible()
    await expect(sugestoes(page)).toHaveCount(0)
  })

  test('dá para escolher pelo teclado, sem tocar no mouse', async ({ page }) => {
    await page.goto('/pedidos/novo')
    const campo = page.getByLabel('Localizar cliente por nome ou CNPJ/CPF')
    await campo.fill('zebra telecomunicacoes')
    await expect(sugestoes(page).first()).toBeVisible()

    await campo.press('ArrowDown')
    await expect(sugestoes(page).first()).toHaveAttribute('aria-selected', 'true')
    await campo.press('Enter')

    await expect(page.locator('#campo-razaoSocial')).toHaveValue(NOME_DE_TESTE)
  })
})

test.describe('o chip é cobrado uma vez, o plano é cobrado todo mês', () => {
  test.beforeEach(async () => {
    await limparPedidosDeTeste()
  })

  test('o resumo separa a primeira fatura da mensalidade', async ({ page }) => {
    await page.goto('/pedidos/novo')
    // 4 linhas × R$ 89,90 = R$ 359,60 por mês. 4 chips × R$ 25,00 = R$ 100,00, uma vez.
    await preencherPedido(page, { valor: '89.90', chip: '25', anexos: false })

    const resumo = page.getByTestId('resumo-da-cobranca')
    await expect(resumo).toContainText('R$ 459,60')   // primeira fatura
    await expect(resumo).toContainText('R$ 359,60')   // todo mês
    await expect(resumo).toContainText('plano R$ 359,60 + chip R$ 100,00')
    await expect(resumo).toContainText('O chip é cobrado uma vez só')
  })

  test('chip cortesia deixa a primeira fatura igual às outras', async ({ page }) => {
    await page.goto('/pedidos/novo')
    await preencherPedido(page, { valor: '89.90', chip: '0', anexos: false })

    const resumo = page.getByTestId('resumo-da-cobranca')
    await expect(resumo).toContainText('Sem cobrança de chip — toda fatura é igual a esta.')
    // Um valor só, repetido nos dois lados: R$ 359,60.
    await expect(resumo.getByText('R$ 359,60')).toHaveCount(2)
  })

  test('sem preço nem quantidade, o resumo não aparece', async ({ page }) => {
    await page.goto('/pedidos/novo')
    await expect(page.getByTestId('resumo-da-cobranca')).toHaveCount(0)
  })

  test('a ficha do pedido mostra o preço POR LINHA, e a cobrança à parte', async ({ page }) => {
    // 4 linhas a R$ 49,90 com chip de R$ 30,00.
    const numero = await criarPedidoNoBanco('PED-2026-0001', {
      precoVenda: 49.9, valorDoChip: 30, qtdLinhas: 4,
    })
    await page.goto('/pedidos')
    await abrirPeloNumero(page, numero)

    // A ficha escreve "por linha" ao lado do número. Antes ela mostrava
    // R$ 199,60 — o total dos quatro — com o rótulo "por linha" do lado.
    const valor = page.getByText('Valor de venda').locator('..')
    await expect(valor).toContainText('R$ 49,90')
    await expect(valor).not.toContainText('R$ 199,60')

    const resumo = page.getByTestId('resumo-da-cobranca')
    await expect(resumo).toContainText('R$ 319,60')   // 199,60 + 120,00 de chip
    await expect(resumo).toContainText('R$ 199,60')   // todo mês
  })
})
