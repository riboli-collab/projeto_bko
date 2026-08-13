import {
  pgTable, text, integer, numeric, boolean, timestamp, date, serial, uniqueIndex, jsonb,
} from 'drizzle-orm/pg-core'
import type { Endereco, EnderecoDeEntrega } from '@/dominio/tipos'

/**
 * Quem pode entrar, e quem assina o que faz.
 *
 * `nome` é o que vai para `historico_de_situacao.quem`, `pendencias.aberta_por`
 * e `anexos.anexado_por` — por texto, não por chave estrangeira, de propósito:
 * o histórico registra quem era a pessoa **naquele dia**. Apagar o usuário não
 * pode reescrever a prova de auditoria, e é isso que uma FK faria.
 *
 * `senhaHash` guarda scrypt com sal, nunca a senha. Ver `dominio/senha.ts`.
 */
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  /** Curto e sem espaço: é o que se digita no login. Único. */
  usuario: text('usuario').notNull().unique(),
  nome: text('nome').notNull(),
  /** Etiqueta exibida no menu lateral. Ainda não restringe nada. */
  papel: text('papel').notNull(),
  senhaHash: text('senha_hash').notNull(),
  /**
   * Senha definida por quem administra, e que a pessoa ainda não trocou.
   *
   * Enquanto for `true`, entrar leva direto para a troca e nenhuma outra tela
   * abre. É o que faz uma senha de estreia ser de estreia: quem administra
   * conhece a senha até a primeira entrada, e não depois dela.
   */
  precisaTrocarSenha: boolean('precisa_trocar_senha').notNull().default(true),
  /** Desativar em vez de apagar: o histórico continua apontando para o nome. */
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  ultimoAcesso: timestamp('ultimo_acesso', { withTimezone: true }),
})

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
  // A forma é a que a tela coleta. Nasce nulo: não existe na base de origem,
  // e o Comercial preenche no primeiro pedido do cliente (R10 do PRD).
  enderecoFiscal: jsonb('endereco_fiscal').$type<Endereco>(),
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
  // Nulo em eSIM e em retirada no escritório — não é entrega que se endereça.
  enderecoDeEntrega: jsonb('endereco_de_entrega').$type<EnderecoDeEntrega>(),
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

/**
 * Um arquivo anexado. O binário vive no disco, fora do repositório: contrato
 * social, RG e comprovante de residência são dado pessoal em estado puro.
 *
 * `rascunhoId` existe porque o anexo chega **antes** do pedido — o Comercial anexa
 * enquanto preenche, e o número só nasce no envio. Criado o pedido, `numeroDoPedido`
 * é preenchido e os arquivos mudam de pasta.
 */
export const anexos = pgTable('anexos', {
  id: serial('id').primaryKey(),
  rascunhoId: text('rascunho_id').notNull(),
  numeroDoPedido: text('numero_do_pedido').references(() => pedidos.numero),
  documentoId: text('documento_id').notNull(),
  nome: text('nome').notNull(),
  tamanho: integer('tamanho').notNull(),
  tipoMime: text('tipo_mime').notNull(),
  caminho: text('caminho').notNull(),
  anexadoPor: text('anexado_por').notNull(),
  anexadoEm: timestamp('anexado_em', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Fila de trabalho humano, como as de `dados/`. A Esteira não corrige cadastro
 * sozinha: registra que digitado e base discordam, e alguém decide.
 */
export const divergenciasDeCadastro = pgTable('divergencias_de_cadastro', {
  id: serial('id').primaryKey(),
  cnpjCpf: text('cnpj_cpf').notNull().references(() => clientes.cnpjCpf),
  numeroDoPedido: text('numero_do_pedido'),
  campoId: text('campo_id').notNull(),
  valorDaBase: text('valor_da_base').notNull(),
  valorDigitado: text('valor_digitado').notNull(),
  registradaPor: text('registrada_por').notNull(),
  registradaEm: timestamp('registrada_em', { withTimezone: true }).notNull().defaultNow(),
  resolvidaEm: timestamp('resolvida_em', { withTimezone: true }),
})

export const sequenciaDePedido = pgTable(
  'sequencia_de_pedido',
  { ano: integer('ano').primaryKey(), ultimo: integer('ultimo').notNull().default(0) },
  (t) => ({ anoUnico: uniqueIndex('sequencia_ano_unico').on(t.ano) }),
)
