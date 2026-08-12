import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import {
  CNPJ_DE_TESTE, campoDoAnexo, lerAnexos, limparPedidosDeTeste, pdfTemporario, preencherPedido,
} from './apoio'

/**
 * Critério 5 e RN4: sem os documentos obrigatórios do tipo de pessoa, o pedido
 * não é criado. O arquivo é de verdade — vai para o disco, fora do repositório,
 * e volta por uma rota que lê o caminho do banco, nunca da URL.
 */
test.beforeEach(limparPedidosDeTeste)

test('o CNPJ pede três documentos; o CPF pede outros três', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
  // Pelo nome acessível do campo, não pelo texto solto: "contrato social"
  // também aparece na frase que explica o bloco e na ajuda do documento vizinho.
  await expect(campoDoAnexo(page, 'Contrato social')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Documento do representante legal')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Fatura')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Documento pessoal')).toHaveCount(0)

  // 11 dígitos: pessoa física. O bloco troca inteiro.
  await page.locator('#campo-cnpjCpf').fill('11144477735')
  await expect(campoDoAnexo(page, 'Documento pessoal')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Comprovante de residência')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Fatura ou evidência de titularidade')).toHaveCount(1)
  await expect(campoDoAnexo(page, 'Contrato social')).toHaveCount(0)
})

test('sem contrato social o pedido não é criado, e a tela diz o que falta', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page, {
    operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '49.90', anexos: false,
  })

  // Só o documento do representante: falta o contrato social.
  await campoDoAnexo(page, 'Documento do representante legal')
    .setInputFiles(pdfTemporario('rg.pdf'))
  await expect(page.getByText('rg.pdf')).toBeVisible()

  const botao = page.getByRole('button', { name: 'Criar pedido' })
  await expect(page.getByText('1 documento obrigatório não foi anexado')).toBeVisible()
  await expect(botao).toBeDisabled()

  await campoDoAnexo(page, 'Contrato social').setInputFiles(pdfTemporario('contrato.pdf'))
  await expect(page.getByText(/documentos? obrigatórios? não fo/)).toHaveCount(0)
  await expect(botao).toBeEnabled()
})

test('a fatura do CNPJ em branco não impede o envio — ela só é pedida quando existe', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // `preencherPedido` já anexa os dois obrigatórios do CNPJ.
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '49.90' })

  // A fatura fica em branco de propósito, e continua na tela marcada "opcional".
  await expect(page.getByText('opcional')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Criar pedido' })).toBeEnabled()
})

test('o arquivo vai para o disco fora do repositório e volta pela rota', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
  await campoDoAnexo(page, 'Contrato social').setInputFiles(pdfTemporario('contrato.pdf'))
  await expect(page.getByText('contrato.pdf')).toBeVisible()

  const [anexo] = await lerAnexos()
  expect(anexo.nome).toBe('contrato.pdf')
  // Fora de `public/`: lá o Next serviria o arquivo por URL, sem passar por código.
  expect(anexo.caminho).toContain('/armazenamento/rascunhos/')
  expect(anexo.caminho).not.toContain('/public/')
  expect(fs.existsSync(anexo.caminho)).toBe(true)

  const resposta = await page.request.get(`/api/documentos/${anexo.id}`)
  expect(resposta.status()).toBe(200)
  expect(resposta.headers()['content-type']).toContain('pdf')
  // Dado pessoal não fica em cache de proxy.
  expect(resposta.headers()['cache-control']).toContain('no-store')

  // Id que não existe é 404, não erro de servidor nem leitura de caminho.
  expect((await page.request.get('/api/documentos/999999')).status()).toBe(404)
  expect((await page.request.get('/api/documentos/nao-e-numero')).status()).toBe(404)
})

test('criado o pedido, o anexo muda de pasta e ganha o número', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // `preencherPedido` já anexa os dois obrigatórios do CNPJ.
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '49.90' })

  await page.getByRole('button', { name: 'Criar pedido' }).click()
  const numero = (await page.getByText(/PED-\d{4}-\d{4}/).first().textContent())!.trim()

  const gravados = await lerAnexos()
  expect(gravados).toHaveLength(2)
  for (const a of gravados) {
    expect(a.numero_do_pedido).toBe(numero)
    expect(a.caminho).toContain(`/armazenamento/pedidos/${numero}/`)
    expect(fs.existsSync(a.caminho)).toBe(true)
  }
})

test('reanexar substitui em vez de empilhar', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
  await campoDoAnexo(page, 'Contrato social').setInputFiles(pdfTemporario('contrato.pdf'))
  await expect(page.getByText('contrato.pdf')).toBeVisible()

  await campoDoAnexo(page, 'Contrato social').setInputFiles(pdfTemporario('contrato-v2.pdf'))
  await expect(page.getByText('contrato-v2.pdf')).toBeVisible()
  await expect(page.getByText('contrato.pdf', { exact: true })).toHaveCount(0)

  const gravados = await lerAnexos()
  expect(gravados).toHaveLength(1)
  expect(gravados[0].nome).toBe('contrato-v2.pdf')
})
