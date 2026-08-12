import { expect, type Page } from '@playwright/test'
import postgres from 'postgres'

/**
 * O que os testes de fluxo compartilham.
 *
 * Os seletores são os do componente exportado, não os que a gente gostaria que
 * ele tivesse: os campos têm `id="campo-<CampoId>"`, o preço se chama "Valor",
 * as listas fechadas são `role="radiogroup"` com botões `role="radio"`, e a
 * linha da fila é um `<button>` com nome acessível.
 */

/** CNPJ inválido por dígito verificador, como os do pacote de design. */
export const CNPJ_DE_TESTE = '11222333000181'

/** Devolve a base ao estado da carga: sem pedido de teste, sem cliente de teste. */
export async function limparPedidosDeTeste() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`delete from pendencias`
  await sql`delete from historico_de_situacao`
  await sql`delete from pedidos`
  // Antes do cliente: a divergência aponta para ele por chave estrangeira.
  await sql`delete from divergencias_de_cadastro where cnpj_cpf = ${CNPJ_DE_TESTE}`
  await sql`delete from clientes where cnpj_cpf = ${CNPJ_DE_TESTE}`
  await sql`delete from sequencia_de_pedido`
  await sql.end()
}

/**
 * Um pedido conhecido, escrito direto no banco.
 *
 * Os specs que **leem** a fila não devem depender do pedido que outro spec
 * criou pela tela: rodando em paralelo, quem limpa a base derruba o vizinho, e
 * a falha aparece longe da causa. Aqui o dado é explícito e igual toda vez.
 */
export async function criarPedidoNoBanco(numero = 'PED-2026-0001') {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`
    insert into clientes (cnpj_cpf, tipo, razao_social, contato, email_financeiro)
    values (${CNPJ_DE_TESTE}, 'PJ', 'Comércio Exemplo Ltda', 'Fernando Ribeiro', 'financeiro@exemplo.com.br')
    on conflict (cnpj_cpf) do nothing`
  await sql`
    insert into pedidos (
      numero, cnpj_cpf, situacao_id, responsavel, operadora, empresa_faturadora,
      canal_de_venda, plano_id, qtd_linhas, preco_venda, valor_do_chip, tipo,
      tipo_de_chip, vendedor, data_entrada, data_situacao
    ) values (
      ${numero}, ${CNPJ_DE_TESTE}, 'PEDIDO_DO_COMERCIAL', 'Gabrielle Souza', 'Vivo', 'IG',
      'IG', 'vivo-ilimitado-6-gb', 4, 49.90, 0, 'Linha nova',
      'eSIM', 'Carlos', now(), now()
    ) on conflict (numero) do nothing`
  await sql`
    insert into historico_de_situacao (numero_do_pedido, de, para, quem, motivo)
    values (${numero}, null, 'PEDIDO_DO_COMERCIAL', 'Carlos', '')`
  await sql.end()
  return numero
}

/**
 * Um cliente como a base real os traz: só o primeiro nome no contato, marcado
 * como incompleto, sem telefone, sem e-mail de assinatura e sem endereço fiscal.
 * São 1.108 dos 1.126 assim.
 */
export async function criarClienteIncompleto(razaoSocial = 'Comércio Antigo Ltda') {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`
    insert into clientes (cnpj_cpf, tipo, razao_social, contato, contato_incompleto, email_financeiro)
    values (${CNPJ_DE_TESTE}, 'PJ', ${razaoSocial}, 'CLAUDIA', true, 'financeiro@exemplo.com.br')
    on conflict (cnpj_cpf) do update set
      razao_social = excluded.razao_social,
      contato = excluded.contato,
      contato_incompleto = true`
  await sql.end()
}

/** Lê o cadastro direto do banco: o que a tela mostra não prova o que foi gravado. */
export async function lerCliente() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const [c] = await sql`select * from clientes where cnpj_cpf = ${CNPJ_DE_TESTE}`
  await sql.end()
  return c
}

/** A fila de divergências de cadastro, direto do banco. */
export async function lerDivergencias() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const linhas = await sql`
    select * from divergencias_de_cadastro where cnpj_cpf = ${CNPJ_DE_TESTE} order by campo_id`
  await sql.end()
  return linhas
}

async function preencherEndereco(page: Page, prefixo: string) {
  await page.locator(`#${prefixo}-logradouro`).fill('Rua das Palmeiras')
  await page.locator(`#${prefixo}-numero`).fill('120')
  await page.locator(`#${prefixo}-bairro`).fill('Centro')
  await page.locator(`#${prefixo}-cidade`).fill('Chapecó')
  await page.locator(`#${prefixo}-estado`).fill('SC')
  await page.locator(`#${prefixo}-cep`).fill('89801000')
}

/**
 * Preenche o pedido inteiro. `valor` vai com ponto: `input[type=number]` não
 * aceita vírgula — ela é da formatação de saída, não da digitação.
 */
export async function preencherPedido(
  page: Page,
  opcoes: { operadora?: string; plano?: string; valor?: string; empresa?: string | null } = {},
) {
  const { operadora = 'Claro', plano = 'ilimitado 1 GB', valor = '49.90', empresa = 'IG' } = opcoes

  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
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

/**
 * Abre a ficha do pedido pela fila, acionando a linha pelo teclado: o cabeçalho
 * fixo do grupo cobre o alvo do mouse — defeito de layout anotado para a
 * revisão de design.
 */
export async function abrirPeloNumero(page: Page, numero: string) {
  const linha = page.getByRole('button', { name: new RegExp(`Abrir o pedido ${numero}`) }).first()
  await linha.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/pedidos/${numero}$`))
}
