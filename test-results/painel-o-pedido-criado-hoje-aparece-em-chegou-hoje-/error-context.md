# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: painel.spec.ts >> o pedido criado hoje aparece em "chegou hoje"
- Location: testes/fluxo/painel.spec.ts:26:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('section').filter({ hasText: 'O que chegou hoje para conferir?' }).getByText(/PED-\d{4}-\d{4}/).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('section').filter({ hasText: 'O que chegou hoje para conferir?' }).getByText(/PED-\d{4}-\d{4}/).first()

```

```yaml
- complementary:
  - text: Esteira
  - navigation "Navegação principal":
    - list:
      - listitem:
        - button "Painel"
      - listitem:
        - button "Pedidos"
      - listitem:
        - button "Novo pedido"
  - button "R Raquel Liderança"
  - button "Recolher menu"
- main:
  - heading "Bom dia" [level=1]
  - paragraph: quarta-feira, 12 de agosto · 0 pedidos pedem ação hoje
  - paragraph: atualizado às 2026-08-12T20:05:27.650Z
  - heading "O que estourou o prazo?" [level=2]
  - paragraph: Cobrar quem cuida, hoje.
  - paragraph: "0"
  - paragraph: Nenhum prazo estourado hoje. A esteira está em dia.
  - heading "Quais portabilidades são amanhã?" [level=2]
  - paragraph: Confirmar o SMS e a janela agendada com o cliente.
  - paragraph: "0"
  - paragraph: Nenhuma portabilidade marcada para amanhã.
  - heading "O que foi entregue e não finalizado?" [level=2]
  - paragraph: Lançar no Custos e finalizar o pedido.
  - paragraph: "0"
  - paragraph: Nada entregue esperando finalização.
  - heading "O que chegou hoje para conferir?" [level=2]
  - paragraph: Conferir os 17 campos em até 4 horas.
  - paragraph: "0"
  - paragraph: Nenhum pedido novo até agora.
  - paragraph: O painel é só leitura. Clique num pedido para abrir o Status do Pedido — é lá que a situação muda, com data e autor gravados.
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('mostra as quatro perguntas na ordem, em grade 2x2 sem rolagem', async ({ page }) => {
  4  |   await page.setViewportSize({ width: 1280, height: 900 })
  5  |   await page.goto('/painel')
  6  | 
  7  |   const titulos = await page.getByRole('heading', { level: 2 }).allTextContents()
  8  |   expect(titulos).toHaveLength(4)
  9  |   expect(titulos[0]).toMatch(/estourou o prazo/i)
  10 |   expect(titulos[1]).toMatch(/portabilidade/i)
  11 |   expect(titulos[2]).toMatch(/entregue/i)
  12 |   expect(titulos[3]).toMatch(/chegou hoje/i)
  13 | 
  14 |   const rolagem = await page.evaluate(() => document.body.scrollHeight > window.innerHeight)
  15 |   expect(rolagem).toBe(false)
  16 | })
  17 | 
  18 | /**
  19 |  * O cartão é um `<section>` sem nome acessível — não dá para pegá-lo por
  20 |  * `role=region`. Escopo pelo título, que é a copy travada contra o pacote de
  21 |  * design em `copy-do-painel.test.ts`.
  22 |  */
  23 | const cartaoDe = (page: import('@playwright/test').Page, titulo: string) =>
  24 |   page.locator('section').filter({ hasText: titulo })
  25 | 
  26 | test('o pedido criado hoje aparece em "chegou hoje"', async ({ page }) => {
  27 |   await page.goto('/painel')
  28 |   const cartao = cartaoDe(page, 'O que chegou hoje para conferir?')
> 29 |   await expect(cartao.getByText(/PED-\d{4}-\d{4}/).first()).toBeVisible()
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  30 | })
  31 | 
  32 | test('cartão zerado é notícia boa: mensagem própria, sem vermelho', async ({ page }) => {
  33 |   await page.goto('/painel')
  34 |   const cartao = cartaoDe(page, 'Quais portabilidades são amanhã?')
  35 | 
  36 |   // Sem portabilidade marcada, o cartão continua no quadrante e diz a boa
  37 |   // notícia com as palavras do pacote — nunca uma lista vazia, nunca alarme.
  38 |   await expect(cartao.getByText('Nenhuma portabilidade marcada para amanhã.')).toBeVisible()
  39 |   await expect(cartao.locator('[class*="red-"]')).toHaveCount(0)
  40 | })
  41 | 
  42 | test('nenhuma transição de situação acontece no painel', async ({ page }) => {
  43 |   await page.goto('/painel')
  44 |   await expect(page.getByRole('button', { name: /Avançar|Confirmar mudança/i })).toHaveCount(0)
  45 | })
  46 | 
  47 | test('clicar num pedido abre o Status do Pedido', async ({ page }) => {
  48 |   await page.goto('/painel')
  49 |   const linha = page.getByRole('button').filter({ hasText: /PED-\d{4}-\d{4}/ }).first()
  50 |   await linha.focus()
  51 |   await page.keyboard.press('Enter')
  52 |   await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
  53 | })
  54 | 
  55 | test('abaixo de 1024px vira coluna única na ordem de urgência', async ({ page }) => {
  56 |   await page.setViewportSize({ width: 768, height: 1024 })
  57 |   await page.goto('/painel')
  58 |   const titulos = await page.getByRole('heading', { level: 2 }).allTextContents()
  59 |   expect(titulos[0]).toMatch(/estourou o prazo/i)
  60 | })
  61 | 
```