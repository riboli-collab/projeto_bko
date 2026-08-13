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
cp .env.example .env.local    # ajuste DATABASE_URL e SEGREDO_DA_SESSAO
npm install
npm run migrar                # cria as dez tabelas
npm run carregar              # carrega clientes e planos de ../dados
npm run usuarios criar voce "Seu Nome" BKO    # a senha aparece uma vez
npm run dev                   # http://localhost:3000
```

Sem usuário não se entra — nem local. É de propósito: um modo aberto que só
existe na máquina de quem desenvolve é um modo que ninguém testa e que um dia
vai para produção por engano.

`npm run carregar` lê `../dados`, que **não faz parte deste repositório**: são
CSVs com CPF, e-mail e telefone de clientes reais. Para subir só o catálogo de
planos, que é dado de negócio, use `npx tsx scripts/carregar-planos.ts`.

## Como verificar

```bash
npm run verificar             # 168 testes de unidade + 69 de fluxo
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

## Quatro coisas que parecem detalhe e não são

**A empresa faturadora nunca é deduzida.** A relação com a operadora existe e é
estável, e ainda assim o campo é digitado: deduzir apaga a declaração que o BKO
confere (DEC-2026-04). Há um teste que falha se alguém "melhorar" isso.

**Datas não são ISO.** Os componentes esperam `2026-08-12` e `2026-08-12 19:05`.
Mandar `toISOString()` não dá erro nenhum — só escreve `2026-08-12T22:13:10.006Z`
na tela. `src/dominio/datas.ts` tem os formatadores, e um teste os tranca contra
o `sample-data` do pacote de design.

**`valorVenda` quer dizer duas coisas diferentes.** Na ficha do pedido é o preço
**por linha** — o componente escreve "por linha" ao lado, e o `sample-data` da
seção traz 62,90 com 8 linhas. Na fila é o **total** do pedido: 1.259,86 com 14
linhas. Mesmo nome, duas seções do mesmo pacote. `src/consultas/pedido.ts`
multiplicava, e a ficha dizia que a linha custava oito vezes o que custa.

**O chip é cobrado uma vez; o plano, todo mês.** Somar os dois num "valor do
pedido" faz quem projeta receita mensal carregar o valor de todos os chips para
sempre. `src/dominio/cobranca.ts` devolve os dois separados, e é ele que a
Entrada e a ficha mostram. `eSIM` **não** zera o chip por dedução: quem decide se
houve custo de ativação é quem vendeu, e zero digitado é cortesia declarada.

## Produção

Roda no Railway com Postgres e um volume em `/dados` para os anexos — contrato
social, RG e comprovante de residência, que nunca entram no repositório.

- `preDeployCommand` aplica as migrações antes de o app subir.
- `TZ=America/Sao_Paulo`: sem isso o servidor formata em UTC e um pedido criado
  às 19:12 aparece como 22:12, o que inutiliza o relógio de 4 horas.
- Todas as páginas são `force-dynamic`. O layout raiz consulta o banco para o
  contador da barra lateral, então nada sob ele pode ser pré-gerado.

## Quem entra, e como

Cada pessoa tem usuário e senha própria, na tabela `usuarios`. A senha é
guardada com scrypt e sal (`src/dominio/senha.ts`) — nunca em texto. Não há
tela de administração: são seis pessoas num escritório, e a gestão é por CLI.

```bash
npm run usuarios listar
npm run usuarios criar hiago "Hiago Ferreira" BKO
npm run usuarios senha hiago          # sorteia outra e mostra uma vez
npm run usuarios desativar hiago      # tira o acesso, preserva o histórico
```

A senha sorteada aparece **uma vez** e não há como recuperá-la — só sortear
outra. Um banco de onde se lê a senha de volta é um banco que vaza a senha
junto.

O cookie é `id.validade.assinatura`, assinado com `SEGREDO_DA_SESSAO`. Ele diz
**quem** entrou: é daí que sai o autor de cada transição. Dura oito horas — um
turno. Trocar o segredo derruba todas as sessões de todo mundo, e é o botão de
pânico; trocar a senha de uma pessoa **não** derruba a sessão dela, porque a
assinatura não usa a senha.

`/saude` fica fora da tranca de propósito. É por onde o Railway pergunta se o
app subiu, e ele não digita senha: protegendo, todo deploy seria reprovado no
healthcheck e revertido, com a aplicação funcionando.

### O autor nunca vem do navegador

`src/app/acoes/sessao.ts` resolve quem está agindo a partir do cookie, no
servidor. Antes, `mudarSituacao` recebia `quem` e `criarPedido` recebia
`vendedor` como argumento — e argumento de Server Action vem do navegador:
qualquer um com o console aberto assinava a transição com o nome de um colega.
Se algum dia uma ação de escrita voltar a aceitar o autor como parâmetro, o
histórico deixa de ser prova.

## O que ainda não existe

**Papel que restringe alguma coisa.** `papel` é etiqueta no menu lateral e nada
mais: quem entra pode fazer tudo o que a máquina de estados permite. Aprovar
exceção de preço, por exemplo, devia ser do Supervisor e hoje é de qualquer um.

**Trocar a própria senha pela tela.** Hoje passa por quem tem acesso à CLI.

**A busca por nome e o resumo da cobrança moram fora do design.**
`src/telas/LocalizarCliente.tsx` e `src/telas/ResumoDaCobranca.tsx` são compostos
por fora do pacote porque `src/design/` é cópia intocada. Eles usam os tokens do
próprio design, mas o lugar certo é dentro da Entrada e da ficha — o que exige
redesenhar as seções e reexportar.

**A cópia do design está atrás do projeto de design em contraste.** O
`MICRO_ROTULO` de `src/design/` ainda é `text-slate-400 dark:text-slate-500`
(2,6:1 no claro, reprovado); `esteira-design/` já foi corrigido para
`text-slate-500 dark:text-slate-400`. A correção chega quando o export rodar.
