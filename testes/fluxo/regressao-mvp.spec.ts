import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { abrirPeloNumero, limparPedidosDeTeste, preencherPedido } from './apoio'
import { NOME_DO_TESTE } from './constantes'

/**
 * A regressão do fluxo principal da Etapa A.
 *
 * Percorre o caminho inteiro num teste só — nasce, aparece na fila, anda com
 * histórico gravado, sobrevive ao reload e aparece no painel — e deixa as
 * capturas em `evidencias/`. A regressão dos 19 critérios do PRD é a Tarefa 24.
 */

test.beforeAll(async () => {
  await limparPedidosDeTeste()
  fs.mkdirSync('evidencias', { recursive: true })
})

test('fluxo principal ponta a ponta: nasce, anda, aparece', async ({ page }) => {
  // 1. NASCE — o Comercial cria o pedido
  await page.goto('/pedidos/novo')
  await preencherPedido(page, { operadora: 'Vivo', plano: 'ilimitado 6 GB', valor: '24.99' })

  // O roteamento sai da operadora e a empresa faturadora continua em branco.
  await expect(page.getByText('Gabrielle Souza').first()).toBeVisible()

  await page.getByRole('button', { name: 'Criar pedido' }).click()

  const numero = (await page.getByText(/PED-\d{4}-\d{4}/).first().textContent())!.trim()
  expect(numero).toMatch(/^PED-\d{4}-\d{4}$/)
  await page.screenshot({ path: 'evidencias/01-pedido-criado.png', fullPage: true })

  // 2. APARECE NA FILA, no grupo da situação certa
  await page.goto('/pedidos')
  // `visible=true`: a fila renderiza o pedido duas vezes — cartão no mobile,
  // linha na tabela no desktop — e o CSS esconde uma das duas.
  await expect(page.getByText(numero).locator('visible=true').first()).toBeVisible()
  await expect(page.getByText('PEDIDO DO COMERCIAL').locator('visible=true').first()).toBeVisible()
  await page.screenshot({ path: 'evidencias/02-fila.png', fullPage: true })

  // 3. APARECE NO PAINEL, na pergunta certa — antes de andar
  await page.goto('/painel')
  const chegouHoje = page.locator('section').filter({ hasText: 'O que chegou hoje para conferir?' })
  await expect(chegouHoje.getByText(numero)).toBeVisible()
  await page.screenshot({ path: 'evidencias/03-painel-chegou-hoje.png', fullPage: true })

  // 4. ANDA — uma transição, com histórico gravado
  await page.goto('/pedidos')
  await abrirPeloNumero(page, numero)
  const historico = page.getByTestId('historico').getByRole('listitem')
  const historicoAntes = await historico.count()

  await page.getByRole('button', { name: /Avançar para/ }).click()
  await page.getByRole('button', { name: 'Confirmar mudança' }).click()

  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')
  await expect(historico).toHaveCount(historicoAntes + 1)
  await expect(page.getByTestId('dias-parados')).toHaveText('0')
  // Data e autor na linha nova: é isso que torna o checklist auditável. O autor
  // é a pessoa logada — antes esta linha aceitava qualquer um de cinco nomes
  // fixos, porque nenhum deles tinha relação com quem estava usando o sistema.
  await expect(historico.first()).toContainText(/\d{2}\/\d{2}\/\d{4}/)
  await expect(historico.first()).toContainText(NOME_DO_TESTE)
  await page.screenshot({ path: 'evidencias/04-status-apos-transicao.png', fullPage: true })

  // 5. PERSISTE — sobrevive ao reload, porque está no Postgres
  await page.reload()
  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')

  // 6. E SAI DO PAINEL — que é o comportamento certo, não uma falta.
  // O painel responde quatro perguntas; "aguardando confecção" não é nenhuma
  // delas. Conferido pela Raquel, o pedido some da lista do dia e volta a
  // aparecer quando estourar prazo, quando for entregue ou na véspera da
  // portabilidade. Esperar o contrário é esperar um painel que nunca esvazia.
  await page.goto('/painel')
  await expect(chegouHoje.getByText(numero)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'O que estourou o prazo?' })).toBeVisible()
  await page.screenshot({ path: 'evidencias/05-painel-apos-conferencia.png', fullPage: true })

  fs.writeFileSync('evidencias/pedido-da-regressao.txt', numero)
})

test('as três larguras não quebram nenhuma das quatro telas', async ({ page }) => {
  for (const largura of [375, 768, 1440]) {
    await page.setViewportSize({ width: largura, height: 900 })
    for (const rota of ['/painel', '/pedidos', '/pedidos/novo']) {
      await page.goto(rota)
      const corpo = await page.evaluate(() => document.body.scrollWidth)
      // Rolagem lateral é o sintoma clássico de layout quebrado no telefone.
      expect(corpo, `${rota} em ${largura}px`).toBeLessThanOrEqual(largura)
    }
  }
})

test('vermelho aparece só onde é alarme', async ({ page }) => {
  // Sem prazo estourado e sem bloqueio de preço, nenhuma tela usa vermelho.
  for (const rota of ['/painel', '/pedidos', '/pedidos/novo']) {
    await page.goto(rota)
    const vermelhos = await page.locator('[class*="bg-red-"], [class*="text-red-"]')
      .locator('visible=true').count()
    expect(vermelhos, `vermelho em ${rota}`).toBe(0)
  }
})
