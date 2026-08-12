/**
 * Contratos de dados da seção Lista de pedidos.
 * Estes tipos descrevem o que os componentes esperam receber por props —
 * não são o modelo de dados da implementação.
 */

/**
 * O status do pedido. Uma por vez, nunca duas, nunca nenhuma (RN1).
 *
 * Os 14 primeiros são o caminho normal, na ordem. Os três últimos são saídas de
 * exceção, alcançáveis de qualquer ponto do caminho e fora da sequência.
 */
export type SituacaoId =
  // Caminho normal
  | 'PEDIDO_DO_COMERCIAL'
  | 'AGUARDANDO_CONFECCAO'
  | 'CONTRATO_ENVIADO'
  | 'CONTRATO_ASSINADO'
  | 'ENVIADO_PARA_OPERADORA'
  | 'CONTRATO_DA_OPERADORA'
  | 'AGUARDANDO_ASSINATURA_OPERADORA'
  | 'CONTRATO_ASSINADO_INPUT'
  | 'FATURADO_NA_OPERADORA'
  | 'ENVIO_SMS'
  | 'AGUARDANDO_PORTABILIDADE'
  | 'PRONTO_PRA_ENTREGA'
  | 'ENTREGUE'
  | 'PEDIDO_FINALIZADO'
  // Exceções, fora da sequência
  | 'DEVOLVIDO'
  | 'PARADO'
  | 'CANCELADO'

/**
 * O semáforo de prazo.
 * `pausado` é DEVOLVIDO: o relógio não conta enquanto a bola está com o Comercial.
 * `encerrado` não pinta semáforo nenhum — pedido encerrado não tem prazo correndo.
 */
export type EstadoDoPrazo = 'estourado' | 'atencao' | 'em-dia' | 'pausado' | 'encerrado'

export type TipoDePedido = 'Linha nova' | 'Portabilidade' | 'Troca'

export type Operadora = 'Vivo' | 'Claro' | '2BX' | 'TIM'

export type EmpresaFaturadora = 'IG' | 'MAN' | '2BX'

/** Como a lista está organizada na tela. */
export type ModoDeExibicao = 'por-situacao' | 'por-dias-parados'

export interface ClienteResumo {
  razaoSocial: string
  cnpjCpf: string
}

export interface Pedido {
  numero: string
  cliente: ClienteResumo
  situacaoId: SituacaoId
  responsavel: string
  operadora: Operadora
  empresaFaturadora: EmpresaFaturadora
  qtdLinhas: number
  tipo: TipoDePedido
  /** Dias úteis desde a última mudança de status. */
  diasParados: number
  estadoDoPrazo: EstadoDoPrazo
  dataEntrada: string
  dataSituacao: string
  /**
   * Nulo quando o pedido não envolve portabilidade.
   * Obrigatório em AGUARDANDO_PORTABILIDADE — é essa data que define o prazo do status.
   */
  dataPortabilidade: string | null
  valorVenda: number
  vendedor: string
  observacao: string
  encerrado: boolean
}

export interface Situacao {
  id: SituacaoId
  /** O nome por extenso, como aparece no Status do Pedido e no histórico. */
  rotulo: string
  /**
   * A versão curta, para chip e coluna de tabela.
   * Existe porque os rótulos completos chegam a 46 caracteres e não cabem na linha.
   */
  rotuloCurto: string
  /** Posição no caminho normal, de 1 a 14. Nula nas três exceções. */
  ordem: number | null
  /** Prazo em texto, como aparece no cabeçalho do grupo: "2 dias úteis", "4 horas". */
  prazoRotulo: string
  /**
   * Nulo quando a situação não tem relógio de duração fixa.
   * Em AGUARDANDO_PORTABILIDADE o prazo é a data agendada, guardada no próprio pedido.
   */
  prazoDiasUteis: number | null
  quantidade: number
  /** Situações que tiram o pedido da fila: PEDIDO_FINALIZADO e CANCELADO. */
  encerra: boolean
  /** true nas três exceções — elas não fazem parte da sequência. */
  ehExcecao: boolean
  /** true nos status que só existem em pedido de portabilidade. */
  soPortabilidade: boolean
}

export interface OpcoesDeFiltro {
  responsaveis: string[]
  operadoras: Operadora[]
  empresasFaturadoras: EmpresaFaturadora[]
}

export interface FiltrosAtivos {
  situacoes: SituacaoId[]
  responsaveis: string[]
  operadoras: Operadora[]
  empresasFaturadoras: EmpresaFaturadora[]
  /** Aceita número do pedido, razão social ou CNPJ/CPF. */
  busca: string
  incluirEncerrados: boolean
}

export interface ResumoDaLista {
  totalEmAberto: number
  totalEstourados: number
  atualizadoEm: string
}

export interface ListaDePedidosProps {
  pedidos: Pedido[]
  situacoes: Situacao[]
  opcoesDeFiltro: OpcoesDeFiltro
  filtrosAtivos: FiltrosAtivos
  resumo: ResumoDaLista
  modoDeExibicao?: ModoDeExibicao
  /** Ids das situações com o grupo aberto. Ausente = grupos com estouro abrem, os demais ficam fechados. */
  gruposAbertos?: SituacaoId[]
  isLoading?: boolean
  /** Mensagem de falha. Os filtros aplicados continuam na tela. */
  erro?: string | null

  /** Abre o Status do Pedido. É a única ação da linha — toda transição acontece lá. */
  onAbrirPedido?: (numero: string) => void
  /** Troca entre agrupar por situação e ordenar por dias parados. */
  onModoDeExibicaoChange?: (modo: ModoDeExibicao) => void
  /** Dobra ou desdobra o grupo de uma situação. */
  onAlternarGrupo?: (situacaoId: SituacaoId) => void
  /** Aplica qualquer alteração nos filtros, inclusive o clique num chip de situação. */
  onFiltrosChange?: (filtros: FiltrosAtivos) => void
  /** Limpa todos os filtros e a busca de uma vez. */
  onLimparFiltros?: () => void
  /** Tenta carregar de novo depois de um erro. */
  onTentarNovamente?: () => void
}
