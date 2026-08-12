/**
 * Contratos de dados da seção Status do Pedido.
 * Estes tipos descrevem o que os componentes esperam receber por props —
 * não são o modelo de dados da implementação.
 */

/**
 * O status do pedido. Um por vez, nunca dois, nunca nenhum (RN1).
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

/** `pausado` é DEVOLVIDO: o relógio não conta enquanto a bola está com o Comercial. */
export type EstadoDoPrazo = 'estourado' | 'atencao' | 'em-dia' | 'pausado' | 'encerrado'

export type TipoDePedido = 'Linha nova' | 'Portabilidade' | 'Troca'

export type Operadora = 'Vivo' | 'Claro' | '2BX' | 'TIM'

export type EmpresaFaturadora = 'IG' | 'MAN' | '2BX'

export type FormaDeEntrega = 'Retirada no escritório' | 'Motoboy' | 'Correios' | 'eSIM'

export interface Cliente {
  razaoSocial: string
  cnpjCpf: string
  /** Endereço fiscal em uma linha — onde a empresa está registrada. */
  enderecoFiscal: string
  contato: string
  /** Telefone com WhatsApp. É por onde o cliente é avisado da portabilidade. */
  telefone: string
  /** Para onde o contrato vai assinar. */
  emailAssinatura: string
  /** Para onde vai a cobrança. */
  emailFinanceiro: string
}

export interface Situacao {
  id: SituacaoId
  /** O nome por extenso, como aparece no Status do Pedido e no histórico. */
  rotulo: string
  /** A versão curta, para chip e coluna de tabela. */
  rotuloCurto: string
  /** Posição no caminho normal, de 1 a 14. Nula nas três exceções. */
  ordem: number | null
  /** Prazo em texto, como aparece no Status do Pedido: "2 dias úteis", "4 horas". */
  prazoRotulo: string
  /**
   * Nulo quando a situação não tem relógio de duração fixa.
   * Em AGUARDANDO_PORTABILIDADE o prazo é a data agendada, guardada no próprio pedido.
   */
  prazoDiasUteis: number | null
  /** Situações que tiram o pedido da fila: PEDIDO_FINALIZADO e CANCELADO. */
  encerra: boolean
  /** true nas três exceções — elas não fazem parte da sequência. */
  ehExcecao: boolean
  /** true nos status que só existem em pedido de portabilidade. */
  soPortabilidade: boolean
}

export interface Pedido {
  numero: string
  cliente: Cliente
  situacaoId: SituacaoId
  responsavel: string
  operadora: Operadora
  empresaFaturadora: EmpresaFaturadora
  plano: string
  qtdLinhas: number
  tipo: TipoDePedido
  formaDeEntrega: FormaDeEntrega
  /** Endereço em uma linha. Vazio quando a entrega é retirada ou eSIM. */
  enderecoDeEntrega: string
  valorVenda: number
  vendedor: string
  dataEntrada: string
  /** Quando o pedido entrou na situação atual. É daqui que sai o relógio. */
  dataSituacao: string
  /** Dias úteis desde a última mudança de situação. */
  diasParados: number
  estadoDoPrazo: EstadoDoPrazo
  /** Nulo quando o pedido não envolve portabilidade. */
  dataPortabilidade: string | null
  observacao: string
}

/** Uma linha do histórico. É o que torna o fluxo auditável. */
export interface TransicaoDoHistorico {
  id: string
  /** Nulo na primeira linha: o pedido não veio de situação nenhuma, ele nasceu. */
  de: SituacaoId | null
  para: SituacaoId
  quando: string
  quem: string
  /** Obrigatório nas transições de problema, opcional nas do caminho normal. */
  motivo: string
  /** Dias úteis que o pedido passou na situação de origem. */
  diasNaSituacao: number
  /** true quando esse trecho passou do prazo da situação de origem. */
  estourouOPrazo: boolean
}

/**
 * Uma transição oferecida na tela.
 * Quando `permitida` é false, a opção aparece desabilitada com o motivo ao lado —
 * o bloqueio é dito antes do clique, nunca depois.
 *
 * A tela mostra a escada inteira: as 17 situações, na ordem, sempre. Mande um
 * veredito para cada uma (a atual é a única que pode faltar). Situação sem
 * veredito ainda aparece bloqueada, mas com um texto genérico deduzido da posição
 * — pior do que a regra de verdade, que só o backend conhece.
 */
export interface TransicaoDisponivel {
  situacaoId: SituacaoId
  permitida: boolean
  /** Preenchido apenas quando `permitida` é false. */
  motivoDoBloqueio: string | null
  /** A próxima situação do caminho normal. Só uma transição carrega isto. */
  ehProximaDoFluxo: boolean
  /** Transições de problema: DEVOLVIDO, PARADO e CANCELADO. Exigem motivo escrito. */
  exigeMotivo: boolean
}

export interface Pendencia {
  id: string
  pergunta: string
  /** A situação em que o pedido travou. A pendência mora nela, nunca num índice à parte. */
  situacaoId: SituacaoId
  /** Uma pessoa, nunca um setor. */
  dono: string
  abertaPor: string
  abertaEm: string
  /** Dias corridos sem resposta. Zero quando já foi respondida. */
  diasAberta: number
  resposta: string | null
  respondidaPor: string | null
  respondidaEm: string | null
  /** Respondida e marcada como regra, aparece a todos que chegarem nesta situação. */
  ehRegra: boolean
}

export interface StatusDoPedidoProps {
  pedido: Pedido
  situacoes: Situacao[]
  historico: TransicaoDoHistorico[]
  pendencias: Pendencia[]
  transicoes: TransicaoDisponivel[]
  /** Nomes que podem ser donos de uma pendência. */
  pessoas: string[]
  isLoading?: boolean
  erro?: string | null

  /** Muda a situação do pedido. O motivo é obrigatório nas transições de problema. */
  onMudarSituacao?: (situacaoId: SituacaoId, motivo: string) => void
  /** Abre uma pendência ancorada na situação atual. */
  onAbrirPendencia?: (pergunta: string, dono: string) => void
  /** Responde uma pendência aberta; `ehRegra` a promove a regra da situação. */
  onResponderPendencia?: (id: string, resposta: string, ehRegra: boolean) => void
  /** Volta para a fila de trabalho. */
  onVoltarParaLista?: () => void
}
