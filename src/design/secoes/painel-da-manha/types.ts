/**
 * Contratos de dados da seção Painel da manhã.
 * Estes tipos descrevem o que os componentes esperam receber por props —
 * não são o modelo de dados da implementação.
 */

/** As quatro perguntas do ritual de 15 minutos, na ordem em que aparecem. */
export type PerguntaId =
  | 'prazo-estourado'
  | 'portabilidade-amanha'
  | 'entregue-nao-finalizado'
  | 'chegou-hoje'

/** A cor do cartão. Vermelho é exclusivo de `prazo-estourado`. */
export type TomDoCartao = 'vermelho' | 'ambar' | 'azul' | 'neutro'

export interface PedidoDoPainel {
  numero: string
  razaoSocial: string
  responsavel: string
  situacaoRotulo: string
  /**
   * O dado que importa para a pergunta em que este pedido aparece:
   * "12 dias parados", "portabilidade às 14h", "R$ 880,60", "faltam 3 campos".
   */
  destaque: string
  /** true quando o destaque deve ser lido como alarme, e não como informação. */
  destaqueEmAlerta: boolean
}

export interface Pergunta {
  id: PerguntaId
  /** A pergunta como a liderança a faz: "O que estourou o prazo?". */
  titulo: string
  /** O que fazer com este grupo, em uma frase. */
  acao: string
  tom: TomDoCartao
  /** Total de pedidos na pergunta. Pode ser maior que o tamanho de `pedidos`. */
  total: number
  /** Os primeiros pedidos, já ordenados pela urgência da pergunta. */
  pedidos: PedidoDoPainel[]
  /** A frase exibida quando o total é zero. Dita como notícia boa. */
  mensagemVazia: string
}

export interface ResumoDoPainel {
  /** Soma das quatro perguntas — quantos pedidos pedem ação hoje. */
  totalParaAgir: number
  /** Data por extenso, já formatada: "terça-feira, 11 de agosto". */
  dataPorExtenso: string
  atualizadoEm: string
}

export interface PainelDaManhaProps {
  perguntas: Pergunta[]
  resumo: ResumoDoPainel
  isLoading?: boolean

  /** Abre o Status do Pedido. É a única saída do painel — nada muda de situação aqui. */
  onAbrirPedido?: (numero: string) => void
  /** Leva à Lista de pedidos já filtrada pela pergunta, a partir do "e mais N". */
  onVerTodos?: (perguntaId: PerguntaId) => void
}
