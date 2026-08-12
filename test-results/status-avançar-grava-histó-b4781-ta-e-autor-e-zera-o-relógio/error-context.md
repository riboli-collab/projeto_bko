# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: status.spec.ts >> avançar grava histórico com data e autor, e zera o relógio
- Location: testes/fluxo/status.spec.ts:30:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.focus: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Abrir o pedido PED-/ }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: E
        - generic [ref=e6]: Esteira
      - navigation "Navegação principal" [ref=e7]:
        - list [ref=e8]:
          - listitem [ref=e9]:
            - button "Painel" [ref=e10]
          - listitem [ref=e19]:
            - button "Pedidos" [ref=e20]
          - listitem [ref=e27]:
            - button "Novo pedido" [ref=e28]
      - button "R Raquel Liderança" [ref=e35]:
        - generic [ref=e36]: R
        - generic [ref=e37]:
          - generic [ref=e38]: Raquel
          - generic [ref=e39]: Liderança
      - button "Recolher menu" [ref=e42]
    - main [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]:
            - heading "Pedidos" [level=1] [ref=e51]
            - paragraph [ref=e52]:
              - generic [ref=e53]: 0 em aberto
          - paragraph [ref=e54]: atualizado às 17:05
        - generic [ref=e55]:
          - generic [ref=e56]:
            - searchbox "Buscar por número do pedido, cliente ou CNPJ/CPF" [ref=e58]
            - group "Modo de exibição" [ref=e59]:
              - button "Por situação" [pressed] [ref=e60]
              - button "Por dias parados" [ref=e64]
          - generic [ref=e67]:
            - button "Situação" [ref=e70]
            - button "Responsável" [ref=e76]
            - button "Operadora" [ref=e82]
            - button "Empresa" [ref=e88]
            - button "Incluir encerrados" [ref=e92]
        - group "Filtrar por situação" [ref=e95]:
          - button "COMERCIAL 0" [ref=e96]:
            - text: COMERCIAL
            - generic [ref=e97]: "0"
          - button "CONFECÇÃO 0" [ref=e98]:
            - text: CONFECÇÃO
            - generic [ref=e99]: "0"
          - button "ENVIADO P/ ASSINAR 0" [ref=e100]:
            - text: ENVIADO P/ ASSINAR
            - generic [ref=e101]: "0"
          - button "ASSINADO 0" [ref=e102]:
            - text: ASSINADO
            - generic [ref=e103]: "0"
          - button "NA OPERADORA 0" [ref=e104]:
            - text: NA OPERADORA
            - generic [ref=e105]: "0"
          - button "CONTRATO RECEBIDO 0" [ref=e106]:
            - text: CONTRATO RECEBIDO
            - generic [ref=e107]: "0"
          - button "ASSINATURA OPERADORA 0" [ref=e108]:
            - text: ASSINATURA OPERADORA
            - generic [ref=e109]: "0"
          - button "ASSINADO / INPUT 0" [ref=e110]:
            - text: ASSINADO / INPUT
            - generic [ref=e111]: "0"
          - button "FATURADO OPERADORA 0" [ref=e112]:
            - text: FATURADO OPERADORA
            - generic [ref=e113]: "0"
          - button "SMS / AGENDAMENTO 0" [ref=e114]:
            - text: SMS / AGENDAMENTO
            - generic [ref=e115]: "0"
          - button "PORTABILIDADE 0" [ref=e116]:
            - text: PORTABILIDADE
            - generic [ref=e117]: "0"
          - button "PRA ENTREGA 0" [ref=e118]:
            - text: PRA ENTREGA
            - generic [ref=e119]: "0"
          - button "ENTREGUE 0" [ref=e120]:
            - text: ENTREGUE
            - generic [ref=e121]: "0"
          - button "FINALIZADO 0" [ref=e122]:
            - text: FINALIZADO
            - generic [ref=e123]: "0"
          - button "DEVOLVIDO 0" [ref=e124]:
            - text: DEVOLVIDO
            - generic [ref=e125]: "0"
          - button "PARADO 0" [ref=e126]:
            - text: PARADO
            - generic [ref=e127]: "0"
          - button "CANCELADO 0" [ref=e128]:
            - text: CANCELADO
            - generic [ref=e129]: "0"
        - generic [ref=e131]:
          - paragraph [ref=e135]: Nenhum pedido em aberto
          - paragraph [ref=e136]: A fila está limpa. Nada parado, nada para cobrar.
  - button "Open Next.js Dev Tools" [ref=e142] [cursor=pointer]
  - alert [ref=e146]
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test'
  2  | import postgres from 'postgres'
  3  | 
  4  | /**
  5  |  * Cada teste move o mesmo pedido. Sem devolver ele ao início, o segundo teste
  6  |  * começa onde o primeiro parou — e a falha aparece longe da causa.
  7  |  *
  8  |  * Voltar situação é coisa que a Esteira **não** faz por regra (RN12): por isso
  9  |  * a volta acontece aqui, no SQL do teste, e não por nenhuma porta do sistema.
  10 |  */
  11 | test.beforeEach(async () => {
  12 |   const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  13 |   await sql`delete from pendencias`
  14 |   await sql`delete from historico_de_situacao where id not in (select min(id) from historico_de_situacao group by numero_do_pedido)`
  15 |   await sql`update pedidos set situacao_id = 'PEDIDO_DO_COMERCIAL', data_situacao = now()`
  16 |   await sql`update historico_de_situacao set para = 'PEDIDO_DO_COMERCIAL', de = null`
  17 |   await sql.end()
  18 | })
  19 | 
  20 | async function abrirPrimeiroPedido(page: Page) {
  21 |   await page.goto('/pedidos')
  22 |   // A linha é um botão com nome acessível, acionado pelo teclado: o cabeçalho
  23 |   // fixo do grupo cobre o alvo do mouse (ver lista.spec.ts).
  24 |   const linha = page.getByRole('button', { name: /Abrir o pedido PED-/ }).first()
> 25 |   await linha.focus()
     |               ^ Error: locator.focus: Test timeout of 30000ms exceeded.
  26 |   await page.keyboard.press('Enter')
  27 |   await expect(page).toHaveURL(/\/pedidos\/PED-\d{4}-\d{4}$/)
  28 | }
  29 | 
  30 | test('avançar grava histórico com data e autor, e zera o relógio', async ({ page }) => {
  31 |   await abrirPrimeiroPedido(page)
  32 |   // Escopo no histórico: a página inteira tem outros <li> (navegação, pendências).
  33 |   const historico = page.getByTestId('historico').getByRole('listitem')
  34 |   const antes = await historico.count()
  35 | 
  36 |   await page.getByRole('button', { name: /Avançar para/i }).click()
  37 |   await page.getByRole('button', { name: /Confirmar mudança/i }).click()
  38 | 
  39 |   // O rótulo aparece na tag, na régua e na barra: a tag é a fonte da verdade.
  40 |   await expect(page.getByTestId('situacao-atual')).toHaveText('AGUARDANDO CONFECÇÃO DE CONTRATO')
  41 |   await expect(historico).toHaveCount(antes + 1)
  42 |   await expect(historico.first()).toContainText(/\d{2}\/\d{2}\/\d{4}/)   // data
  43 |   await expect(page.getByTestId('dias-parados')).toHaveText('0')
  44 | })
  45 | 
  46 | test('transição de problema exige motivo e o botão é vermelho', async ({ page }) => {
  47 |   await abrirPrimeiroPedido(page)
  48 |   await page.getByRole('button', { name: 'Todas as situações' }).click()
  49 |   const parado = page.getByRole('button').filter({ hasText: /^\s*—?\s*PARADO/ }).first()
  50 |   await parado.focus()
  51 |   await page.keyboard.press('Enter')
  52 | 
  53 |   await expect(page.getByText(/Motivo \(obrigatório\)/)).toBeVisible()
  54 |   const confirmar = page.getByRole('button', { name: /Confirmar mudança/i })
  55 |   await expect(confirmar).toBeDisabled()
  56 | 
  57 |   await page.getByLabel(/Motivo/i).fill('Operadora não respondeu em cinco dias.')
  58 |   await expect(confirmar).toBeEnabled()
  59 |   await confirmar.click()
  60 |   await expect(page.getByText('Operadora não respondeu em cinco dias.')).toBeVisible()
  61 | })
  62 | 
  63 | test('transição bloqueada aparece visível, com cadeado e motivo, e não é clicável', async ({ page }) => {
  64 |   await abrirPrimeiroPedido(page)
  65 |   await page.getByRole('button', { name: 'Todas as situações' }).click()
  66 | 
  67 |   // O degrau proibido continua na escada, desabilitado e com o motivo escrito —
  68 |   // é assim que a tela ensina a regra em vez de só recusar. O motivo depende de
  69 |   // onde o pedido está: no começo do fluxo, o que falta são as etapas do meio.
  70 |   const bloqueada = page.getByRole('button').filter({ hasText: 'PEDIDO FINALIZADO' }).first()
  71 |   await expect(bloqueada).toBeVisible()
  72 |   await expect(bloqueada).toBeDisabled()
  73 |   await expect(bloqueada).toContainText(/Passa por|Só depois de ENTREGUE/)
  74 | })
  75 | 
  76 | test('pendência sem dono não grava', async ({ page }) => {
  77 |   await abrirPrimeiroPedido(page)
  78 |   await page.getByRole('button', { name: /^Abrir$/ }).click()
  79 |   await page.getByLabel(/Pergunta/i).fill('A operadora aceita portabilidade parcial?')
  80 |   await expect(page.getByRole('button', { name: /Abrir pendência/i })).toBeDisabled()
  81 | 
  82 |   await page.getByLabel(/Dono/i).selectOption('Supervisor')
  83 |   await expect(page.getByRole('button', { name: /Abrir pendência/i })).toBeEnabled()
  84 | })
  85 | 
  86 | test('a mudança sobrevive ao reload — persistência real, não estado de tela', async ({ page }) => {
  87 |   await abrirPrimeiroPedido(page)
  88 |   const situacao = await page.getByTestId('situacao-atual').textContent()
  89 |   await page.reload()
  90 |   await expect(page.getByTestId('situacao-atual')).toHaveText(situacao!)
  91 | })
  92 | 
```