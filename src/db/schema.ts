import {
  pgTable, text, integer, numeric, boolean, timestamp, date, serial, uniqueIndex,
} from 'drizzle-orm/pg-core'

export const clientes = pgTable('clientes', {
  cnpjCpf: text('cnpj_cpf').primaryKey(),
  tipo: text('tipo').notNull(),                       // 'PF' | 'PJ'
  razaoSocial: text('razao_social').notNull(),
  contato: text('contato').notNull().default(''),
  // 1.108 dos 1.126 vieram só com o primeiro nome. A Entrada preenche, marca
  // como incompleto e exige a correção — nunca recusa em silêncio o que preencheu.
  contatoIncompleto: boolean('contato_incompleto').notNull().default(false),
  emailFinanceiro: text('email_financeiro').notNull().default(''),
  // Não existem na base de origem. O Comercial digita no primeiro pedido.
  emailAssinatura: text('email_assinatura').notNull().default(''),
  telefone: text('telefone').notNull().default(''),
  enderecoFiscal: text('endereco_fiscal').notNull().default(''),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})

// Fila de trabalho humano. Documento fora do padrão não é corrigido por dedução (RN7).
export const clientesRejeitados = pgTable('clientes_rejeitados', {
  id: serial('id').primaryKey(),
  documentoBruto: text('documento_bruto').notNull(),
  razaoSocial: text('razao_social').notNull(),
  motivo: text('motivo').notNull(),
})

export const planos = pgTable('planos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  operadora: text('operadora').notNull(),
  // Nulo só quando a origem é 'ausente' — 1 das 86 combinações.
  custoPorLinha: numeric('custo_por_linha', { precision: 10, scale: 2 }),
  // 'contrato' (18) · 'lancado' (67) · 'ausente' (1). Viaja junto até a tela.
  origemDoCusto: text('origem_do_custo').notNull(),
})

export const pedidos = pgTable('pedidos', {
  numero: text('numero').primaryKey(),
  cnpjCpf: text('cnpj_cpf').notNull().references(() => clientes.cnpjCpf),
  situacaoId: text('situacao_id').notNull(),
  responsavel: text('responsavel').notNull(),
  operadora: text('operadora').notNull(),
  empresaFaturadora: text('empresa_faturadora').notNull(),
  canalDeVenda: text('canal_de_venda').notNull(),
  planoId: text('plano_id').notNull().references(() => planos.id),
  qtdLinhas: integer('qtd_linhas').notNull(),
  precoVenda: numeric('preco_venda', { precision: 10, scale: 2 }).notNull(),
  valorDoChip: numeric('valor_do_chip', { precision: 10, scale: 2 }).notNull(),
  tipo: text('tipo').notNull(),
  tipoDeChip: text('tipo_de_chip').notNull(),
  formaDeEntrega: text('forma_de_entrega'),
  enderecoDeEntrega: text('endereco_de_entrega').notNull().default(''),
  dataPortabilidade: date('data_portabilidade'),
  vendedor: text('vendedor').notNull(),
  observacao: text('observacao').notNull().default(''),
  excecaoDePrecoStatus: text('excecao_de_preco_status').notNull().default('nao-solicitada'),
  excecaoDePrecoJustificativa: text('excecao_de_preco_justificativa').notNull().default(''),
  temComprovante: boolean('tem_comprovante').notNull().default(false),
  dataEntrada: timestamp('data_entrada', { withTimezone: true }).notNull().defaultNow(),
  dataSituacao: timestamp('data_situacao', { withTimezone: true }).notNull().defaultNow(),
})

export const historicoDeSituacao = pgTable('historico_de_situacao', {
  id: serial('id').primaryKey(),
  numeroDoPedido: text('numero_do_pedido').notNull().references(() => pedidos.numero),
  de: text('de'),                                     // nulo na primeira linha: o pedido nasceu
  para: text('para').notNull(),
  quando: timestamp('quando', { withTimezone: true }).notNull().defaultNow(),
  quem: text('quem').notNull(),
  motivo: text('motivo').notNull().default(''),
  diasNaSituacao: integer('dias_na_situacao').notNull().default(0),
  estourouOPrazo: boolean('estourou_o_prazo').notNull().default(false),
})

export const pendencias = pgTable('pendencias', {
  id: serial('id').primaryKey(),
  numeroDoPedido: text('numero_do_pedido').notNull().references(() => pedidos.numero),
  situacaoId: text('situacao_id').notNull(),
  pergunta: text('pergunta').notNull(),
  dono: text('dono').notNull(),
  abertaPor: text('aberta_por').notNull(),
  abertaEm: timestamp('aberta_em', { withTimezone: true }).notNull().defaultNow(),
  resposta: text('resposta'),
  respondidaPor: text('respondida_por'),
  respondidaEm: timestamp('respondida_em', { withTimezone: true }),
  ehRegra: boolean('eh_regra').notNull().default(false),
})

export const sequenciaDePedido = pgTable(
  'sequencia_de_pedido',
  { ano: integer('ano').primaryKey(), ultimo: integer('ultimo').notNull().default(0) },
  (t) => ({ anoUnico: uniqueIndex('sequencia_ano_unico').on(t.ano) }),
)
