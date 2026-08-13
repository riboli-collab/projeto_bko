import { test, expect, type Locator, type Page } from '@playwright/test'
import {
  criarPedidoNoBanco, criarUsuariosDeTeste, lerHistorico, limparPedidosDeTeste,
} from './apoio'
import {
  SENHA_DO_TESTE, USUARIO_DO_TESTE, OUTRO_USUARIO, USUARIO_COMERCIAL,
} from './constantes'

/**
 * O papel restringe de verdade.
 *
 * Vem da tabela de perfis do PRD (§2), com a cobertura decidida à parte: o BKO
 * cobre o BKO na faixa 2–13, a conferência da entrada e o fechamento são da
 * Liderança, e o Comercial abre o pedido e não move nenhum.
 *
 * Roda no projeto `acesso`, sem sessão guardada — cada teste entra como a
 * pessoa que precisa.
 */
const NUMERO = 'PED-2026-0001'

test.beforeEach(async () => {
  await limparPedidosDeTeste()
  await criarUsuariosDeTeste()
  await criarPedidoNoBanco(NUMERO)
})

async function entrarComo(page: Page, usuario: string) {
  await page.goto('/entrar')
  await page.getByLabel('Usuário').fill(usuario)
  await page.getByLabel('Senha', { exact: true }).fill(SENHA_DO_TESTE)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/painel$/)
}

const avancar = (page: Page) => page.getByRole('button', { name: /Avançar para/i })

/**
 * O motivo mora dentro de "Todas as situações".
 *
 * O componente só oferece o botão "Avançar para" quando a próxima do caminho
 * está liberada; bloqueada, ele diz que nada está liberado e guarda o porquê de
 * cada degrau no menu, com cadeado. Nenhuma situação some — é o desenho: quem
 * não pode precisa ver que existe e por quê.
 */
async function abrirTodasAsSituacoes(page: Page) {
  await page.getByRole('button', { name: /Todas as situações/i }).click()
  // Escopado no menu: a régua do fluxo, no alto da página, repete os mesmos
  // rótulos, e um seletor solto casaria com os dois.
  return page.getByTestId('menu-de-situacoes')
}

/**
 * Um degrau do menu, pela ordem e pelo rótulo.
 *
 * Duas armadilhas juntas. A explicação de cada degrau cita os anteriores pelo
 * nome ("Passa por AGUARDANDO CONFECÇÃO DE CONTRATO antes"), então procurar o
 * rótulo solto casa com onze botões — daí a âncora no número da ordem. E o
 * nome acessível não é o `textContent`: o navegador insere espaço entre os
 * elementos, então "2AGUARDANDO" no DOM vira "2 AGUARDANDO" na árvore de
 * acessibilidade, que é o que o Playwright compara.
 */
const degrau = (menu: Locator, ordem: string, rotulo: string) =>
  menu.getByRole('button', { name: new RegExp(`^${ordem}\\s*${rotulo}`) })

test('o BKO não confere a entrada — a situação aparece travada, com o motivo', async ({ page }) => {
  await entrarComo(page, OUTRO_USUARIO)          // BKO
  await page.goto(`/pedidos/${NUMERO}`)

  // Sem botão de avançar, e a tela diz isso em vez de sumir com tudo.
  await expect(avancar(page)).toHaveCount(0)
  await expect(page.getByText('Nenhuma transição do caminho normal está liberada agora.')).toBeVisible()

  const menu = await abrirTodasAsSituacoes(page)
  const confeccao = degrau(menu, '2', 'AGUARDANDO CONFECÇÃO DE CONTRATO')
  // Visível e travada, não escondida: quem não pode precisa saber a quem pedir.
  await expect(confeccao).toBeDisabled()
  await expect(confeccao).toContainText('A conferência da entrada é da Liderança')

  // E o banco não mudou.
  expect(await lerHistorico(NUMERO)).toHaveLength(1)
})

test('a Liderança confere a mesma entrada, no mesmo pedido', async ({ page }) => {
  await entrarComo(page, USUARIO_DO_TESTE)       // Liderança
  await page.goto(`/pedidos/${NUMERO}`)

  await expect(avancar(page)).toBeEnabled()
  await avancar(page).click()
  await page.getByRole('button', { name: /Confirmar mudança/i }).click()
  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')

  const historico = await lerHistorico(NUMERO)
  expect(historico).toHaveLength(2)
  expect(historico[1].quem).toBe('Pessoa de Teste')
})

test('o Comercial não move nada, em situação nenhuma', async ({ page }) => {
  await entrarComo(page, USUARIO_COMERCIAL)
  await page.goto(`/pedidos/${NUMERO}`)

  await expect(avancar(page)).toHaveCount(0)
  const menu = await abrirTodasAsSituacoes(page)
  const confeccao = degrau(menu, '2', 'AGUARDANDO CONFECÇÃO DE CONTRATO')
  await expect(confeccao).toBeDisabled()
  await expect(confeccao).toContainText('O Comercial abre o pedido e acompanha')

  // Nem as saídas de exceção, que para o BKO ficam abertas de qualquer ponto.
  await expect(degrau(menu, '—', 'CANCELADO')).toBeDisabled()
  await expect(degrau(menu, '—', 'PARADO')).toBeDisabled()
})

test('mas o Comercial continua abrindo pedido — é o trabalho dele', async ({ page }) => {
  await entrarComo(page, USUARIO_COMERCIAL)
  await page.goto('/pedidos/novo')
  await expect(page.getByRole('heading', { name: 'Novo pedido' })).toBeVisible()
  await expect(page.locator('#campo-cnpjCpf')).toBeEditable()
})

test('depois da conferência, o BKO toca o pedido normalmente', async ({ page }) => {
  // A Liderança confere...
  await entrarComo(page, USUARIO_DO_TESTE)
  await page.goto(`/pedidos/${NUMERO}`)
  await avancar(page).click()
  await page.getByRole('button', { name: /Confirmar mudança/i }).click()
  await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')

  // ...e agora o BKO consegue seguir dali.
  await entrarComo(page, OUTRO_USUARIO)
  await page.goto(`/pedidos/${NUMERO}`)
  await expect(avancar(page)).toBeEnabled()
  await avancar(page).click()
  await page.getByRole('button', { name: /Confirmar mudança/i }).click()
  await expect(page.getByTestId('situacao-atual')).toHaveText('CONTRATO ENVIADO PARA ASSINATURA')

  const historico = await lerHistorico(NUMERO)
  expect(historico[historico.length - 1].quem).toBe('Outra Pessoa')
})

test('o Comercial não abre pendência', async ({ page }) => {
  await entrarComo(page, USUARIO_COMERCIAL)
  await page.goto(`/pedidos/${NUMERO}`)

  await page.getByRole('button', { name: /^Abrir$/ }).click()
  await page.getByLabel(/Pergunta/i).fill('Posso seguir com este pedido?')
  await page.getByLabel(/Dono/i).selectOption('Supervisor')
  await page.getByRole('button', { name: /Abrir pendência/i }).click()

  await expect(page.getByText(/Pendência é registro de trabalho do BKO/)).toBeVisible()
})

test('a regra vale no servidor, não só no botão desabilitado', async ({ page }) => {
  await entrarComo(page, OUTRO_USUARIO)          // BKO
  await page.goto(`/pedidos/${NUMERO}`)
  const antes = await lerHistorico(NUMERO)

  const menu = await abrirTodasAsSituacoes(page)
  const travada = degrau(menu, '2', 'AGUARDANDO CONFECÇÃO DE CONTRATO')
  await expect(travada).toBeDisabled()

  // Botão desabilitado é decoração para quem tem o console aberto. Tiro o
  // `disabled` e clico: a trava de verdade está na ação, no servidor.
  await travada.evaluate((b: HTMLButtonElement) => b.removeAttribute('disabled'))
  await travada.click()

  // Se tivesse passado, a barra de confirmação apareceria. Ela não aparece,
  // porque o componente também recusa — e, acima de tudo, o banco não mudou.
  await expect(page.getByRole('button', { name: /Confirmar mudança/i })).toHaveCount(0)
  expect(await lerHistorico(NUMERO)).toHaveLength(antes.length)
})
