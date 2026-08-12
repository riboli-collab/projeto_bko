import { test, expect } from '@playwright/test'
import {
  CNPJ_DE_TESTE, criarClienteIncompleto, lerCliente, limparPedidosDeTeste, preencherPedido,
} from './apoio'

// Este spec cria pelo formulário: começa sempre com a base sem o cliente dele.
test.beforeEach(limparPedidosDeTeste)

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

/**
 * Critério 2 do PRD: três erros de formato aparecendo de uma vez.
 *
 * Sem clicar em nada. O componente trava o envio por conta própria quando o
 * documento ou o telefone estão fora do formato — esperar a resposta do
 * servidor seria esperar um envio que nunca acontece. As mensagens saem da
 * mesma `validarPedido` que o Server Action usa, rodando na tela enquanto a
 * pessoa digita.
 */
test('os erros de formato aparecem todos de uma vez, não um a um', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page)
  await page.locator('#campo-cnpjCpf').fill('112223330001')
  await page.locator('#campo-telefone').fill('4999')
  await page.locator('#campo-emailFinanceiro').fill('financeiro@')

  const resumo = page.getByRole('alert').filter({ hasText: 'campos impedem o envio' })
  await expect(resumo).toContainText('3 campos impedem o envio')
  await expect(resumo).toContainText('CNPJ tem 14 dígitos e CPF tem 11 — você digitou 12')
  await expect(resumo).toContainText('Telefone com DDD tem 10 ou 11 dígitos — você digitou 4')
  await expect(resumo).toContainText('E-mail financeiro em formato inválido')

  // E nada do que foi digitado se perde: a tela nomeia o erro, não limpa o campo.
  await expect(page.locator('#campo-razaoSocial')).toHaveValue('Comércio Exemplo Ltda')
  await expect(page.getByText(/PED-\d{4}-\d{4}/)).toHaveCount(0)
})

test('campo em branco é falta contada, não erro nomeado', async ({ page }) => {
  await page.goto('/pedidos/novo')
  // Formulário vazio: 17 campos em branco e nenhum erro. Abrir a tela cheia de
  // vermelho ensina a ignorar o vermelho.
  await expect(page.getByRole('alert').filter({ hasText: 'impedem o envio' })).toHaveCount(0)
  await expect(page.getByText(/campos obrigatórios em branco/)).toBeVisible()
})

test('o contato corrigido volta para a base; a razão social divergente não', async ({ page }) => {
  // A base traz "CLAUDIA" — primeiro nome só, marcado como incompleto.
  await criarClienteIncompleto('Comércio Antigo Ltda')

  await page.goto('/pedidos/novo')
  await page.locator('#campo-cnpjCpf').fill(CNPJ_DE_TESTE)
  // Espera o cadastro chegar: é ele que preenche o contato incompleto na tela.
  await expect(page.locator('#campo-contato')).toHaveValue('CLAUDIA')

  // O Comercial completa o nome e digita outra razão social.
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '49.90' })
  await page.locator('#campo-contato').fill('Claudia Menezes')
  await page.getByRole('button', { name: 'Criar pedido' }).click()
  await expect(page.getByText(/PED-\d{4}-\d{4}/)).toBeVisible()

  const cliente = await lerCliente()
  // 4b: a correção fecha o ciclo — a próxima venda já encontra o nome inteiro.
  expect(cliente.contato).toBe('Claudia Menezes')
  expect(cliente.contato_incompleto).toBe(false)
  // Razão social divergente NÃO é sobrescrita em silêncio: vira registro (Tarefa 16).
  expect(cliente.razao_social).toBe('Comércio Antigo Ltda')
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
