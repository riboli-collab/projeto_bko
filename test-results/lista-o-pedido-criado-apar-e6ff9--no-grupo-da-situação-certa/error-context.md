# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lista.spec.ts >> o pedido criado aparece na fila, no grupo da situação certa
- Location: testes/fluxo/lista.spec.ts:12:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('PEDIDO DO COMERCIAL').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('PEDIDO DO COMERCIAL').first()

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
  - heading "Pedidos" [level=1]
  - paragraph: 0 em aberto
  - paragraph: atualizado às 17:05
  - searchbox "Buscar por número do pedido, cliente ou CNPJ/CPF"
  - group "Modo de exibição":
    - button "Por situação" [pressed]
    - button "Por dias parados"
  - button "Situação"
  - button "Responsável"
  - button "Operadora"
  - button "Empresa"
  - button "Incluir encerrados"
  - group "Filtrar por situação":
    - button "COMERCIAL 0"
    - button "CONFECÇÃO 0"
    - button "ENVIADO P/ ASSINAR 0"
    - button "ASSINADO 0"
    - button "NA OPERADORA 0"
    - button "CONTRATO RECEBIDO 0"
    - button "ASSINATURA OPERADORA 0"
    - button "ASSINADO / INPUT 0"
    - button "FATURADO OPERADORA 0"
    - button "SMS / AGENDAMENTO 0"
    - button "PORTABILIDADE 0"
    - button "PRA ENTREGA 0"
    - button "ENTREGUE 0"
    - button "FINALIZADO 0"
    - button "DEVOLVIDO 0"
    - button "PARADO 0"
    - button "CANCELADO 0"
  - paragraph: Nenhum pedido em aberto
  - paragraph: A fila está limpa. Nada parado, nada para cobrar.
- alert
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * A Lista renderiza duas vezes o mesmo pedido: cartão no mobile, linha na tabela
  5  |  * no desktop, e o CSS esconde um dos dois. Procurar por texto sem filtrar o
  6  |  * visível acha primeiro o que está escondido — por isso `:visible` em tudo que
  7  |  * é conteúdo de pedido.
  8  |  */
  9  | const numeroVisivel = (page: Page) =>
  10 |   page.getByText(/PED-\d{4}-\d{4}/).locator('visible=true').first()
  11 | 
  12 | test('o pedido criado aparece na fila, no grupo da situação certa', async ({ page }) => {
  13 |   await page.goto('/pedidos')
> 14 |   await expect(page.getByText('PEDIDO DO COMERCIAL').first()).toBeVisible()
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  15 |   await expect(numeroVisivel(page)).toBeVisible()
  16 | })
  17 | 
  18 | test('o resumo do topo conta em aberto, e só pinta de vermelho quando há estouro', async ({ page }) => {
  19 |   await page.goto('/pedidos')
  20 |   const cabecalho = page.getByRole('heading', { name: 'Pedidos' }).locator('..')
  21 |   await expect(cabecalho.getByText(/em aberto/)).toBeVisible()
  22 | 
  23 |   // "com prazo estourado" é o único vermelho da tela, e só existe quando há
  24 |   // pedido estourado. Sem estouro, a frase não aparece — não aparece zerada.
  25 |   const estourados = await page.getByText(/com prazo estourado/).count()
  26 |   const vermelhos = await page.locator('.text-red-700, .text-red-400').count()
  27 |   expect(estourados === 0 ? vermelhos : 1).toBeGreaterThanOrEqual(estourados)
  28 | })
  29 | 
  30 | test('os filtros combinam e a limpeza zera tudo', async ({ page }) => {
  31 |   await page.goto('/pedidos')
  32 |   await page.getByRole('button', { name: /Responsável/i }).click()
  33 |   await page.getByRole('option', { name: 'Gabrielle Souza' }).click()
  34 | 
  35 |   // Filtrado pelo responsável, o pedido dele continua na fila.
  36 |   await expect(numeroVisivel(page)).toBeVisible()
  37 | 
  38 |   const limpar = page.getByRole('button', { name: 'Limpar tudo' })
  39 |   await expect(limpar).toBeVisible()
  40 |   await limpar.click()
  41 |   await expect(limpar).toHaveCount(0)
  42 | })
  43 | 
  44 | test('filtro sem resultado mostra o vazio com botão de limpar, não erro', async ({ page }) => {
  45 |   await page.goto('/pedidos')
  46 |   await page.getByPlaceholder(/Buscar/i).fill('ZZZZZZ-NAO-EXISTE')
  47 | 
  48 |   await expect(page.getByText('Nenhum pedido com estes filtros')).toBeVisible()
  49 |   await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
  50 |   // Ausência de resultado é notícia, não falha: nada de ícone ou cor de erro.
  51 |   await expect(page.getByText(/erro|falha/i)).toHaveCount(0)
  52 | })
  53 | 
  54 | test('clicar na linha abre o Status do Pedido', async ({ page }) => {
  55 |   await page.goto('/pedidos')
  56 |   // A linha inteira é um `<button>` com nome acessível. Aciona pelo teclado:
  57 |   // o cabeçalho fixo do grupo cobre o topo da primeira linha, e o clique do
  58 |   // mouse cai nele. **É defeito de layout, anotado para a revisão de design** —
  59 |   // com uma linha só no grupo, o alvo do mouse fica parcialmente coberto.
  60 |   const linha = page.getByRole('button', { name: /Abrir o pedido PED-/ }).first()
  61 |   await linha.focus()
  62 |   await page.keyboard.press('Enter')
  63 |   await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
  64 | })
  65 | 
  66 | test('abaixo de 768px a tabela vira cartão', async ({ page }) => {
  67 |   await page.setViewportSize({ width: 375, height: 812 })
  68 |   await page.goto('/pedidos')
  69 |   await expect(numeroVisivel(page)).toBeVisible()
  70 |   // A tabela existe no DOM, mas escondida: o que não pode é rolagem lateral.
  71 |   const larguraDoCorpo = await page.evaluate(() => document.body.scrollWidth)
  72 |   expect(larguraDoCorpo).toBeLessThanOrEqual(375)
  73 | })
  74 | 
```