# Esteira — BKO

Acompanhamento dos pedidos de telecom do back office do grupo IG/MAN/2BX.

Um pedido nasce no Comercial, atravessa 14 situações até ser finalizado, e em
cada uma tem um prazo em dias úteis, um responsável e um histórico de quem
mexeu. A Esteira existe para que ninguém precise perguntar "onde está o pedido"
— e para que a resposta seja auditável.

**No ar:** https://esteira-production-f713.up.railway.app

## Como rodar

Precisa de Docker e Node 20 ou mais novo.

```bash
docker compose up -d          # Postgres 17 em localhost:5432
cp .env.example .env.local    # ajuste DATABASE_URL
npm install
npm run migrar                # cria as nove tabelas
npm run carregar              # carrega clientes e planos de ../dados
npm run dev                   # http://localhost:3000
```

`npm run carregar` lê `../dados`, que **não faz parte deste repositório**: são
CSVs com CPF, e-mail e telefone de clientes reais. Para subir só o catálogo de
planos, que é dado de negócio, use `npx tsx scripts/carregar-planos.ts`.

## Como verificar

```bash
npm run verificar             # 133 testes de unidade + 43 de fluxo
```

Os testes de fluxo sobem o app na porta 3100 e rodam contra o Postgres de
verdade — não há banco falso. Eles limpam e recriam os próprios dados, então
rodam em série (`workers: 1`).

## As três camadas

| Pasta | Papel |
|---|---|
| `src/dominio/` | Regras puras: as 17 situações, o relógio de dias úteis, a máquina de estados, a validação dos 17 campos, a trava de preço. Sem banco, sem React. |
| `src/design/` | Cópia **intocada** dos componentes exportados do Design OS. Não edite aqui: a fonte é o projeto de design, e a cópia é regerada no export. |
| `src/telas/` | Os adaptadores. Traduzem entre o vocabulário do domínio e o que os componentes esperam — é a única camada que conhece os dois. |

Leitura passa por `src/consultas/`; escrita, por Server Actions em
`src/app/acoes/`. Só `import type` cruza a fronteira cliente/servidor: importar
um **valor** de `src/consultas/` para um Client Component arrasta o driver do
Postgres para o navegador.

## Duas coisas que parecem detalhe e não são

**A empresa faturadora nunca é deduzida.** A relação com a operadora existe e é
estável, e ainda assim o campo é digitado: deduzir apaga a declaração que o BKO
confere (DEC-2026-04). Há um teste que falha se alguém "melhorar" isso.

**Datas não são ISO.** Os componentes esperam `2026-08-12` e `2026-08-12 19:05`.
Mandar `toISOString()` não dá erro nenhum — só escreve `2026-08-12T22:13:10.006Z`
na tela. `src/dominio/datas.ts` tem os formatadores, e um teste os tranca contra
o `sample-data` do pacote de design.

## Produção

Roda no Railway com Postgres e um volume em `/dados` para os anexos — contrato
social, RG e comprovante de residência, que nunca entram no repositório.

- `preDeployCommand` aplica as migrações antes de o app subir.
- `TZ=America/Sao_Paulo`: sem isso o servidor formata em UTC e um pedido criado
  às 19:12 aparece como 22:12, o que inutiliza o relógio de 4 horas.
- Todas as páginas são `force-dynamic`. O layout raiz consulta o banco para o
  contador da barra lateral, então nada sob ele pode ser pré-gerado.

## O que ainda não existe

Autenticação. Quem abre a URL entra, e o autor das transições é uma constante
(`QUEM = 'Carlos'`). Está previsto, e até lá a URL não deve circular.
