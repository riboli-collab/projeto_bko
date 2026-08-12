import { test, expect, type Page } from '@playwright/test'
import postgres from 'postgres'

/**
 * Os seletores aqui são os do componente exportado, não os que a gente
 * gostaria que ele tivesse: os campos têm `id="campo-<CampoId>"`, os rótulos
 * saem de `ROTULO_DO_CAMPO` (o preço se chama "Valor", não "Preço de venda")
 * e as listas fechadas são `role="radiogroup"` com botões `role="radio"`.
 */

const CNPJ_NOVO = '11222333000181'

/**
 * Cada teste começa com a base limpa do que ele mesmo cria.
 *
 * Sem isto, o segundo teste encontra o pedido do primeiro: o aviso de
 * duplicidade dispara, a busca acha o cliente e o formulário muda de estado —
 * e a falha aparece longe da causa.
 */
test.beforeEach(async () => {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`delete from historico_de_situacao where numero_do_pedido in (select numero from pedidos where cnpj_cpf = ${CNPJ_NOVO})`
  await sql`delete from pedidos where cnpj_cpf = ${CNPJ_NOVO}`
  await sql`delete from clientes where cnpj_cpf = ${CNPJ_NOVO}`
  await sql`delete from sequencia_de_pedido`
  await sql.end()
})

async function preencherEndereco(page: Page, prefixo: string) {
  await page.locator(`#${prefixo}-logradouro`).fill('Rua das Palmeiras')
  await page.locator(`#${prefixo}-numero`).fill('120')
  await page.locator(`#${prefixo}-bairro`).fill('Centro')
  await page.locator(`#${prefixo}-cidade`).fill('Chapecó')
  await page.locator(`#${prefixo}-estado`).fill('SC')
  await page.locator(`#${prefixo}-cep`).fill('89801000')
}

/**
 * Preenche o pedido inteiro. `plano` é o rótulo da opção no select, e `valor`
 * vai com ponto: `input[type=number]` não aceita vírgula — ela é da formatação
 * de saída, não da digitação.
 */
async function preencherPedido(
  page: Page,
  opcoes: { operadora?: string; plano?: string; valor?: string; empresa?: string | null } = {},
) {
  const { operadora = 'Claro', plano = 'ilimitado 1 GB', valor = '49.90', empresa = 'IG' } = opcoes

  await page.locator('#campo-cnpjCpf').fill(CNPJ_NOVO)
  await page.locator('#campo-razaoSocial').fill('Comércio Exemplo Ltda')
  await preencherEndereco(page, 'campo-enderecoFiscal')
  await page.locator('#campo-contato').fill('Fernando Ribeiro')
  await page.locator('#campo-telefone').fill('49988887777')
  await page.locator('#campo-emailAssinatura').fill('assina@exemplo.com.br')
  await page.locator('#campo-emailFinanceiro').fill('financeiro@exemplo.com.br')

  await page.locator('#campo-qtdLinhas').fill('4')
  await page.getByRole('radiogroup', { name: 'Venda' }).getByRole('radio', { name: 'IG' }).click()
  await page.locator('#campo-operadora').selectOption({ label: operadora })
  await page.locator('#campo-plano').selectOption({ label: plano })
  await page.locator('#campo-precoVenda').fill(valor)
  await page.locator('#campo-valorDoChip').fill('0')

  if (empresa !== null) {
    await page.getByRole('radiogroup', { name: 'Empresa faturadora' })
      .getByRole('radio', { name: empresa }).click()
  }
  await page.getByRole('radiogroup', { name: 'Tipo de ação' })
    .getByRole('radio', { name: 'Linha nova' }).click()
  await page.getByRole('radiogroup', { name: 'Chip' })
    .getByRole('radio', { name: 'eSIM' }).click()
}

test('a empresa faturadora NÃO se preenche sozinha a partir da operadora', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await page.locator('#campo-operadora').selectOption({ label: 'Vivo' })

  // A regra roteia o pedido...
  await expect(page.getByText('Gabrielle Souza')).toBeVisible()
  // ...e não preenche a declaração que o BKO precisa conferir (DEC-2026-04 v1.1).
  const empresa = page.getByRole('radiogroup', { name: 'Empresa faturadora' })
  await expect(empresa.getByRole('radio', { checked: true })).toHaveCount(0)
})

test('preço abaixo do custo trava o envio, com os três números na tela', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // ilimitado 6 GB na Vivo: R$ 14,99 por contrato.
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '12.00' })

  const painel = page.getByTestId('painel-de-preco')
  await expect(painel).toContainText('Preço abaixo do custo')
  await expect(painel).toContainText('14,99')
  await expect(painel).toContainText('12,00')
  await expect(painel).toContainText('2,99')
  await expect(page.getByRole('button', { name: 'Criar pedido' })).toBeDisabled()
})

/**
 * LACUNA DO PACOTE DE DESIGN, não do código.
 *
 * `BloqueioDePreco` não tem campo de procedência e `TravaDePreco` não tem onde
 * dizê-la: o painel mostra custo, preço e diferença, e cala sobre o custo ter
 * sido conferido com a operadora ou copiado da planilha. O critério 15 do PRD
 * exige a distinção, e ela vale para 67 das 86 combinações.
 *
 * Fica `fixme` — visível e falhando de propósito — até a Tarefa 14 desenhar.
 * Apagar o teste esconderia a dívida; deixá-lo vermelho pararia a Onda 1.
 */
test.fixme('bloqueio com custo lançado diz que o custo não foi conferido', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // ilimitado 1 GB na Claro: R$ 14,99 lançado na planilha, nunca conferido.
  await preencherPedido(page, { operadora: 'Claro', plano: 'ilimitado 1 GB', valor: '10.00' })

  const painel = page.getByTestId('painel-de-preco')
  await expect(painel).toContainText(/não conferido|planilha/i)
})

test('bloqueio com custo de contrato não carrega a ressalva', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '12.00' })

  const painel = page.getByTestId('painel-de-preco')
  await expect(painel).toContainText('Preço abaixo do custo')
  await expect(painel).not.toContainText(/não conferido/i)
})

test('nenhuma tela mostra R$ 0,00 como custo', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // markup 11 GB na Claro é a única combinação sem custo nenhum.
  await preencherPedido(page, { operadora: 'Claro', plano: 'markup 11 GB', valor: '1.00' })

  // Sem custo não há trava a exibir — e o que não pode acontecer é R$ 0,00
  // passar por custo conferido.
  await expect(page.getByText('R$ 0,00')).toHaveCount(0)
})

test('pedido incompleto não é criado e diz qual campo falta', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page, { empresa: null })

  // A tela não deixa nem tentar: o botão diz, em texto, o que falta.
  const botao = page.getByRole('button', { name: 'Criar pedido' })
  await expect(botao).toBeDisabled()
  await expect(page.getByText(/1 campo obrigatório|falta/i).first()).toBeVisible()
  await expect(page.getByText(/PED-2026-/)).toHaveCount(0)
})

test('cria um pedido e mostra número, responsável e status', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '49.90' })

  await page.getByRole('button', { name: 'Criar pedido' }).click()

  await expect(page.getByText(/PED-\d{4}-\d{4}/)).toBeVisible()
  await expect(page.getByText('Gabrielle Souza')).toBeVisible()
  // Aparece duas vezes: na tag da situação e na frase do relógio.
  await expect(page.getByText('PEDIDO DO COMERCIAL').first()).toBeVisible()
})
