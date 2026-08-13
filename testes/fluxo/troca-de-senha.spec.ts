import { test, expect, type Page } from '@playwright/test'
import {
  criarUsuariosDeTeste, lerUsuario, marcarSenhaDeEstreia,
} from './apoio'
import { OUTRO_USUARIO, SENHA_DO_TESTE } from './constantes'

/**
 * A senha de estreia deixa de existir na primeira entrada.
 *
 * Quem administra define uma senha para a pessoa entrar. A partir daí, essa
 * senha não abre mais nada: ou ela é trocada, ou nenhuma outra tela abre. É o
 * que devolve valor ao autor no histórico — enquanto a mesma senha serve para
 * todo mundo, qualquer um assina como qualquer um.
 *
 * Roda no projeto `acesso`, sem sessão guardada.
 */
const NOVA = 'chapeco-2026-sc'

test.beforeEach(async () => {
  await criarUsuariosDeTeste()
  await marcarSenhaDeEstreia(OUTRO_USUARIO)
})

test.afterEach(async () => {
  // Devolve a conta ao estado que os outros specs esperam.
  await criarUsuariosDeTeste()
})

const entrar = async (page: Page, usuario: string, senha: string) => {
  await page.goto('/entrar')
  await page.getByLabel('Usuário').fill(usuario)
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('entrar com a senha de estreia leva direto para a troca', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)

  await expect(page).toHaveURL(/\/trocar-senha$/)
  await expect(page.getByRole('heading', { name: 'Crie a sua senha' })).toBeVisible()
  // Sem navegação: oferecer menu que o proxy vai recusar em seguida seria mentir.
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
})

test('nenhuma outra tela abre enquanto a senha não for trocada', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)
  await expect(page).toHaveURL(/\/trocar-senha$/)

  for (const rota of ['/painel', '/pedidos', '/pedidos/novo']) {
    await page.goto(rota)
    await expect(page).toHaveURL(/\/trocar-senha$/)
  }
})

test('a senha nova não pode ser a de estreia nem uma fraca', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)
  await page.getByLabel('Senha de estreia').fill(SENHA_DO_TESTE)

  const nova = page.getByLabel('Senha nova', { exact: true })
  const repetir = page.getByLabel('Repita a senha nova')
  const salvar = page.getByRole('button', { name: /Salvar a senha nova/ })

  // `123456` tropeça no tamanho antes de chegar na lista — uma regra por vez,
  // e a primeira que falta é a que interessa a quem está digitando.
  await nova.fill('123456')
  await repetir.fill('123456')
  await expect(page.getByText(/pelo menos 8 caracteres/)).toBeVisible()
  await expect(salvar).toBeDisabled()

  // Com oito caracteres, a lista é que barra.
  await nova.fill('password')
  await repetir.fill('password')
  await expect(page.getByText(/listas que qualquer varredura tenta/)).toBeVisible()
  await expect(salvar).toBeDisabled()

  // E só números, mesmo longos: data de nascimento é o caso comum.
  await nova.fill('20031995')
  await repetir.fill('20031995')
  await expect(page.getByText(/Só números é fácil demais/)).toBeVisible()
  await expect(salvar).toBeDisabled()
})

test('a confirmação precisa bater', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)

  await page.getByLabel('Senha de estreia').fill(SENHA_DO_TESTE)
  await page.getByLabel('Senha nova', { exact: true }).fill(NOVA)
  await page.getByLabel('Repita a senha nova').fill(`${NOVA}-diferente`)

  await expect(page.getByText('As duas senhas não são iguais.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Salvar a senha nova/ })).toBeDisabled()
})

test('errar a senha de estreia não deixa trocar — computador aberto não vira conta roubada', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)

  await page.getByLabel('Senha de estreia').fill('chute')
  await page.getByLabel('Senha nova', { exact: true }).fill(NOVA)
  await page.getByLabel('Repita a senha nova').fill(NOVA)
  await page.getByRole('button', { name: /Salvar a senha nova/ }).click()

  await expect(page.locator('#troca-erro')).toHaveText('A senha atual não confere.')
  await expect(page).toHaveURL(/\/trocar-senha$/)
  expect((await lerUsuario(OUTRO_USUARIO)).precisa_trocar_senha).toBe(true)
})

test('trocada, a Esteira abre — e a senha de estreia não serve mais', async ({ page }) => {
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)

  await page.getByLabel('Senha de estreia').fill(SENHA_DO_TESTE)
  await page.getByLabel('Senha nova', { exact: true }).fill(NOVA)
  await page.getByLabel('Repita a senha nova').fill(NOVA)
  await page.getByRole('button', { name: /Salvar a senha nova/ }).click()

  // Cai no painel, com a navegação de volta — sem precisar entrar outra vez.
  await expect(page).toHaveURL(/\/painel$/)
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  expect((await lerUsuario(OUTRO_USUARIO)).precisa_trocar_senha).toBe(false)

  // A senha de estreia morreu: quem administra não entra mais como essa pessoa.
  await page.goto('/entrar')
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)
  await expect(page.locator('#entrada-erro')).toHaveText('Usuário ou senha incorretos.')

  // E a nova funciona.
  await entrar(page, OUTRO_USUARIO, NOVA)
  await expect(page).toHaveURL(/\/painel$/)
})

test('quem já trocou pode trocar de novo, e tem por onde voltar', async ({ page }) => {
  await criarUsuariosDeTeste()          // sem marca de estreia
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)
  await expect(page).toHaveURL(/\/painel$/)

  await page.goto('/trocar-senha')
  await expect(page.getByRole('heading', { name: 'Trocar a senha' })).toBeVisible()
  // Voluntária: dá para desistir. Obrigatória não tem esta saída.
  await expect(page.getByRole('link', { name: /Voltar ao painel/ })).toBeVisible()
})
