import { test, expect } from '@playwright/test'

/**
 * A porta, testada com ela trancada.
 *
 * Roda no projeto `acesso`, que a config declara **sem** sessão guardada: os
 * outros specs entram uma vez e reusam o cookie, e testar a porta fechada com a
 * chave no bolso provaria exatamente nada.
 */
import { criarUsuariosDeTeste, desativarUsuario } from './apoio'
import {
  USUARIO_DO_TESTE, SENHA_DO_TESTE, NOME_DO_TESTE, OUTRO_USUARIO,
} from './constantes'

const BASE = 'http://localhost:3100'

test.beforeAll(async () => {
  await criarUsuariosDeTeste()
})

const entrar = async (page: import('@playwright/test').Page, usuario: string, senha: string) => {
  await page.getByLabel('Usuário').fill(usuario)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('sem entrar, toda tela leva para a entrada', async ({ page }) => {
  for (const rota of ['/painel', '/pedidos', '/pedidos/novo']) {
    await page.goto(rota)
    await expect(page).toHaveURL(new RegExp(`/entrar\\?de=${encodeURIComponent(rota)}`))
    await expect(page.getByLabel('Usuário')).toBeVisible()
  }
})

test('a tela de entrada não mostra a navegação nem consulta o banco', async ({ page }) => {
  await page.goto('/painel')
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Esteira' })).toBeVisible()
})

test('senha errada não entra, e a recusa não revela quem existe', async ({ page }) => {
  await page.goto('/entrar')
  await entrar(page, USUARIO_DO_TESTE, 'chute')

  const erro = page.locator('#entrada-erro')
  await expect(erro).toHaveText('Usuário ou senha incorretos.')
  await expect(page).toHaveURL(/\/entrar/)
  await expect(page.getByLabel('Usuário')).toHaveAttribute('aria-invalid', 'true')
})

test('usuário que não existe recebe a MESMA recusa — a tela não lista a equipe', async ({ page }) => {
  await page.goto('/entrar')
  await entrar(page, 'ninguem-com-esse-nome', 'chute')

  // Palavra por palavra igual à de senha errada. Diferente, bastaria digitar
  // nomes até parar de aparecer "não encontrado" para descobrir quem trabalha aqui.
  await expect(page.locator('#entrada-erro')).toHaveText('Usuário ou senha incorretos.')
})

test('quem foi desativado não entra mais, com a mesma mensagem', async ({ page }) => {
  await desativarUsuario(OUTRO_USUARIO)
  await page.goto('/entrar')
  await entrar(page, OUTRO_USUARIO, SENHA_DO_TESTE)

  await expect(page.locator('#entrada-erro')).toHaveText('Usuário ou senha incorretos.')
  await expect(page).toHaveURL(/\/entrar/)
  // Devolve o acesso: os outros specs contam com as duas pessoas ativas.
  await criarUsuariosDeTeste()
})

test('entrar devolve para onde a pessoa ia, e diz quem ela é', async ({ page }) => {
  await page.goto('/pedidos')
  await expect(page).toHaveURL(/\/entrar/)

  await entrar(page, USUARIO_DO_TESTE, SENHA_DO_TESTE)

  await expect(page).toHaveURL(/\/pedidos$/)
  await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
  // O nome no menu é o que separa "há uma sessão" de "há uma pessoa".
  await expect(page.getByRole('button', { name: new RegExp(NOME_DO_TESTE) })).toBeVisible()
})

test('o usuário não diferencia maiúscula nem espaço sobrando', async ({ page }) => {
  await page.goto('/entrar')
  await entrar(page, `  ${USUARIO_DO_TESTE.toUpperCase()} `, SENHA_DO_TESTE)
  await expect(page).toHaveURL(/\/painel$/)
})

test('a sessão sobrevive à navegação e o cookie não é legível por script', async ({ page }) => {
  await page.goto('/entrar')
  await entrar(page, USUARIO_DO_TESTE, SENHA_DO_TESTE)
  await expect(page).toHaveURL(/\/painel$/)

  await page.goto('/pedidos/novo')
  await expect(page.getByRole('heading', { name: 'Novo pedido' })).toBeVisible()

  // httpOnly: um XSS não consegue roubar a sessão lendo document.cookie.
  expect(await page.evaluate(() => document.cookie)).not.toContain('esteira_sessao')
})

test('sair apaga a sessão de verdade, não só navega', async ({ page }) => {
  await page.goto('/entrar')
  await entrar(page, USUARIO_DO_TESTE, SENHA_DO_TESTE)
  await expect(page).toHaveURL(/\/painel$/)

  await page.getByRole('button', { name: new RegExp(NOME_DO_TESTE) }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/entrar/)

  // O teste que importa: voltar para uma tela protegida não deve funcionar.
  // Antes, sair só navegava para a raiz e a sessão continuava aberta no
  // computador que ficou sem dono.
  await page.goto('/painel')
  await expect(page).toHaveURL(/\/entrar/)
})

test('o anexo também é protegido — não basta saber o id', async ({ request }) => {
  const semSessao = await request.get(`${BASE}/api/documentos/1`, { maxRedirects: 0 })
  expect([302, 307]).toContain(semSessao.status())
  expect(semSessao.headers()['location']).toContain('/entrar')
})

test('a saúde fica aberta, senão todo deploy seria reprovado', async ({ request }) => {
  const r = await request.get(`${BASE}/saude`)
  expect(r.status()).toBe(200)
  expect(await r.json()).toMatchObject({ ok: true })
})
