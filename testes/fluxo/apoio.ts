import { expect, type Page } from '@playwright/test'
import postgres from 'postgres'
import { gerarHash } from '@/dominio/senha'
import {
  USUARIO_DO_TESTE, SENHA_DO_TESTE, NOME_DO_TESTE, PAPEL_DO_TESTE,
  OUTRO_USUARIO, OUTRO_NOME,
} from './constantes'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

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

/**
 * As pessoas que os testes usam.
 *
 * O hash é gerado pelo mesmo `gerarHash` da aplicação — não um hash colado no
 * arquivo: colado, ele continuaria valendo depois de alguém trocar o algoritmo,
 * e a suíte diria que o login funciona quando não funciona mais.
 */
export async function criarUsuariosDeTeste() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const hash = await gerarHash(SENHA_DO_TESTE)
  for (const [usuario, nome] of [
    [USUARIO_DO_TESTE, NOME_DO_TESTE], [OUTRO_USUARIO, OUTRO_NOME],
  ]) {
    await sql`
      insert into usuarios (usuario, nome, papel, senha_hash, ativo, precisa_trocar_senha)
      values (${usuario}, ${nome}, ${PAPEL_DO_TESTE}, ${hash}, true, false)
      on conflict (usuario) do update set
        nome = excluded.nome, senha_hash = excluded.senha_hash, ativo = true,
        -- Já trocaram: os specs do fluxo testam o trabalho, não a estreia.
        -- Quem testa a estreia é troca-de-senha.spec.ts, que marca de volta.
        precisa_trocar_senha = false`
  }
  await sql.end()
}

/** Devolve a conta ao estado de estreia: senha definida por quem administra. */
export async function marcarSenhaDeEstreia(usuario: string) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`update usuarios set precisa_trocar_senha = true where usuario = ${usuario}`
  await sql.end()
}

/** Lê o estado da conta direto do banco: a tela não prova o que foi gravado. */
export async function lerUsuario(usuario: string) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const [u] = await sql`select * from usuarios where usuario = ${usuario}`
  await sql.end()
  return u
}

export async function desativarUsuario(usuario: string) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`update usuarios set ativo = false where usuario = ${usuario}`
  await sql.end()
}

/** Lê o histórico do pedido: é onde a assinatura de quem agiu tem de aparecer. */
export async function lerHistorico(numero: string) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const linhas = await sql`
    select de, para, quem, motivo from historico_de_situacao
    where numero_do_pedido = ${numero} order by id`
  await sql.end()
  return linhas
}

/** Devolve a base ao estado da carga: sem pedido de teste, sem cliente de teste. */
export async function limparPedidosDeTeste() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`delete from pendencias`
  await sql`delete from anexos`
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
export async function criarPedidoNoBanco(
  numero = 'PED-2026-0001',
  { precoVenda = 49.9, valorDoChip = 0, qtdLinhas = 4 } = {},
) {
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
      'IG', 'vivo-ilimitado-6-gb', ${qtdLinhas}, ${precoVenda}, ${valorDoChip}, 'Linha nova',
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

/**
 * Um cliente com o cadastro inteiro preenchido — os 18 de 1.126 que vieram assim.
 *
 * O nome é propositalmente improvável: a base de desenvolvimento tem os
 * clientes de verdade carregados, e um teste de busca por nome que casasse com
 * eles passaria a depender de dado real para continuar verde.
 */
export const NOME_DE_TESTE = 'Zebra Telecomunicações Fictícia Ltda'

export async function criarClienteCompleto() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql`
    insert into clientes (
      cnpj_cpf, tipo, razao_social, contato, contato_incompleto,
      email_financeiro, email_assinatura, telefone, endereco_fiscal
    ) values (
      ${CNPJ_DE_TESTE}, 'PJ', ${NOME_DE_TESTE}, 'Fernando Ribeiro', false,
      'financeiro@exemplo.com.br', 'assina@exemplo.com.br', '(49) 98888-7777',
      ${sql.json({
        logradouro: 'Rua das Palmeiras', numero: '120', complemento: '',
        bairro: 'Centro', cidade: 'Chapecó', estado: 'SC', cep: '89801-000',
      })}
    )
    on conflict (cnpj_cpf) do update set
      razao_social = excluded.razao_social,
      contato = excluded.contato,
      contato_incompleto = false,
      email_assinatura = excluded.email_assinatura,
      telefone = excluded.telefone,
      endereco_fiscal = excluded.endereco_fiscal`
  await sql.end()
}

/** Lê o cadastro direto do banco: o que a tela mostra não prova o que foi gravado. */
export async function lerCliente() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const [c] = await sql`select * from clientes where cnpj_cpf = ${CNPJ_DE_TESTE}`
  await sql.end()
  return c
}

/** Os anexos gravados, direto do banco. O caminho prova onde o arquivo foi parar. */
export async function lerAnexos() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const linhas = await sql`select * from anexos order by id`
  await sql.end()
  return linhas
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
  opcoes: {
    operadora?: string; plano?: string; valor?: string; empresa?: string | null
    /** Valor do chip. Vai com ponto, pelo mesmo motivo do preço. */
    chip?: string
    /** Anexa os dois obrigatórios do CNPJ. Sem eles o pedido não é criado (RN4). */
    anexos?: boolean
  } = {},
) {
  const {
    operadora = 'Claro', plano = 'ilimitado 1 GB', valor = '49.90', empresa = 'IG',
    chip = '0', anexos = true,
  } = opcoes

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
  await page.locator('#campo-valorDoChip').fill(chip)

  if (empresa !== null) {
    await page.getByRole('radiogroup', { name: 'Empresa faturadora' })
      .getByRole('radio', { name: empresa }).click()
  }
  await page.getByRole('radiogroup', { name: 'Tipo de ação' })
    .getByRole('radio', { name: 'Linha nova' }).click()
  await page.getByRole('radiogroup', { name: 'Chip' })
    .getByRole('radio', { name: 'eSIM' }).click()

  // O CNPJ de teste é PJ: contrato social e documento do representante. A fatura
  // é opcional e fica de fora — ela só é pedida quando existe.
  if (anexos) {
    await campoDoAnexo(page, 'Contrato social').setInputFiles(pdfTemporario('contrato.pdf'))
    await campoDoAnexo(page, 'Documento do representante legal')
      .setInputFiles(pdfTemporario('rg.pdf'))
    await expect(page.getByText('rg.pdf')).toBeVisible()
  }
}

/** Um PDF mínimo, gerado na hora. Nenhum arquivo real entra no repositório. */
export function pdfTemporario(nome: string): string {
  const destino = path.join(os.tmpdir(), nome)
  fs.writeFileSync(destino, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF')
  return destino
}

/** O `input` do componente é `hidden`, mas tem nome acessível — e basta. */
export const campoDoAnexo = (page: Page, rotulo: string) => page.getByLabel(`Anexar ${rotulo}`)

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
