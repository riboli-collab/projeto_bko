import { test, expect } from '@playwright/test'
import {
  abrirPeloNumero, criarPedidoNoBanco, lerAnexos, lerHistorico,
  limparPedidosDeTeste, preencherPedido,
} from './apoio'
import { NOME_DO_TESTE } from './constantes'

/**
 * O que a autenticação por pessoa existe para garantir.
 *
 * A senha compartilhada protegia o acesso e nada mais: o histórico gravava a
 * constante `QUEM = 'Carlos'`, e registrava *quando* e *o quê*, nunca *quem*.
 * É o *quem* que torna o checklist auditável, e é ele que estes testes cobram.
 *
 * Roda no projeto `fluxo`, logado como a pessoa de teste.
 */
test.beforeEach(async () => {
  await limparPedidosDeTeste()
})

test('o pedido nasce assinado por quem estava logado', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page)
  await page.getByRole('button', { name: 'Criar pedido' }).click()
  await expect(page.getByText('Pedido criado')).toBeVisible()

  const numero = (await page.getByText(/PED-\d{4}-\d{4}/).first().textContent())!.trim()
  const historico = await lerHistorico(numero)

  expect(historico).toHaveLength(1)
  expect(historico[0].quem).toBe(NOME_DO_TESTE)
  // E não a constante antiga, que assinava tudo com o mesmo nome.
  expect(historico[0].quem).not.toBe('Carlos')
})

test('a transição de situação grava quem a fez', async ({ page }) => {
  const numero = await criarPedidoNoBanco()
  await page.goto('/pedidos')
  await abrirPeloNumero(page, numero)

  await page.getByRole('button', { name: /Avançar para/i }).click()
  await page.getByRole('button', { name: /Confirmar mudança/i }).click()
  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')

  const historico = await lerHistorico(numero)
  const ultima = historico[historico.length - 1]
  expect(ultima.para).toBe('AGUARDANDO_CONFECCAO')
  expect(ultima.quem).toBe(NOME_DO_TESTE)
})

test('o anexo guarda quem anexou, mesmo sem campo na tela para isso', async ({ page }) => {
  await page.goto('/pedidos/novo')
  await preencherPedido(page)

  const anexos = await lerAnexos()
  expect(anexos.length).toBeGreaterThan(0)
  // `anexado_por` vinha de um campo do FormData, montado pelo navegador.
  for (const a of anexos) expect(a.anexado_por).toBe(NOME_DO_TESTE)
})

test('o menu lateral mostra a pessoa, não um nome fixo', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByRole('button', { name: new RegExp(NOME_DO_TESTE) })).toBeVisible()
  await expect(page.getByRole('button', { name: /^R Raquel/ })).toHaveCount(0)
})
