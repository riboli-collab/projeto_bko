# Evidências — Etapa A: o fluxo principal da Esteira

Data da execução: 12/08/2026
Commit anterior a este registro: `3c90e39`
Pedido da regressão: `PED-2026-0001`

## Fluxo principal, ponta a ponta

| Etapa | Evidência | Resultado |
|---|---|---|
| Pedido nasce pelo formulário | `evidencias/01-pedido-criado.png` | PED-2026-0001 · responsável Gabrielle Souza (operadora Vivo) · PEDIDO DO COMERCIAL |
| Aparece na fila | `evidencias/02-fila.png` | agrupado em PEDIDO DO COMERCIAL, com semáforo em dia |
| Aparece no painel | `evidencias/03-painel-chegou-hoje.png` | cartão "O que chegou hoje para conferir?" |
| Anda uma etapa | `evidencias/04-status-apos-transicao.png` | histórico +1 linha, com data e autor · dias parados = 0 |
| Persiste | reload da rota de detalhe | AGUARDANDO CONFECÇÃO DE CONTRATO mantida |
| Sai do painel | `evidencias/05-painel-apos-conferencia.png` | conferido, some do cartão do dia — é a regra, não uma falta |

## Persistência real

- Banco: Postgres 17 em container, volume `esteira-pgdata`
- **`docker compose restart` executado**: o pedido, o histórico e os 1.122 clientes continuam lá, e `npm run verificar` passa depois do reinício
- Nenhuma credencial no repositório: `DATABASE_URL` vive em `.env.local`, ignorado pelo git, conferido por teste

## Carga real

| Base | Números |
|---|---|
| Clientes carregados | **1.122** de 1.126 · 0 CNPJ duplicado |
| Rejeitados | **4** — documento fora do padrão, na fila de revisão com o motivo |
| Planos | **86** · custo de contrato **18** · só lançado **67** · sem custo **1** |

## Testes

| Suíte | Testes | Resultado |
|---|---|---|
| Unidade (vitest) | 93 | 93 passando |
| Fluxo (playwright) | 31 | 30 passando · 1 `fixme` declarado |
| Tipos | `tsc --noEmit` | limpo |

Comando único: `npm run verificar`.

O `fixme` é a lacuna do pacote de design: a trava de preço não tem onde dizer a
procedência do custo (critério 15 do PRD). Está registrado como teste que falha
de propósito, não apagado — fecha na Tarefa 14.

## Responsividade

375px, 768px e 1440px nas três telas, sem rolagem horizontal em nenhuma.
Capturas em `evidencias/responsivo-*.png`.

## Nada de dado simulado, nada de vazamento

Duas guardas automáticas, rodando em cada `npm run verificar`:

- nenhum `sample-data.json` importado ou lido por `src/`, e nenhum cliente ou plano fictício do pacote de design no banco;
- nenhum CPF, e-mail ou telefone em fixture commitada, e nenhuma credencial em `src/`, `testes/` ou `scripts/`.

## O que a Etapa A NÃO entrega, e onde fecha

| Fora | Fecha em |
|---|---|
| Upload dos documentos anexos — a trava "sem documento não cria" não está imposta | Tarefa 17 |
| Validação completa dos 17 campos (hoje são 7 regras) | Tarefa 15 |
| Divergência de cadastro | Tarefa 16 |
| Exceção de preço pedida e decidida | Tarefas 14 e 18 |
| Modo devolução com os itens apontados | Tarefas 14 e 19 |
| Pendência respondida virando regra da situação | Tarefa 20 |
| Comprovante de entrega como arquivo | Tarefas 14 e 21 |
| Autoria real no histórico — hoje o autor é constante declarada no código | Tarefa 22 |

## Ressalvas que continuam de pé

- **A trava de preço bloqueia contra custo não conferido em 67 das 86 combinações.** Só 18 têm custo de contrato. Pedir as tabelas às operadoras é trabalho da Onda 2.
- **O relógio desconta os 10 feriados nacionais de 2026 a 2028** — isso é lei. Horário de expediente, Carnaval, Corpus Christi e feriados municipais continuam `A CONFIRMAR` (regra P2 do PRD).
- **O baseline não foi medido.** Sem ele, em 30 dias não há como dizer se a Esteira funcionou.
