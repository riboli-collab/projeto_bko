import type { SituacaoId, TipoDePedido, TipoDeChip, FormaDeEntrega } from './tipos'

export interface Situacao {
  id: SituacaoId
  rotulo: string
  rotuloCurto: string
  ordem: number | null
  prazoRotulo: string
  prazoDiasUteis: number | null
  encerra: boolean
  ehExcecao: boolean
  soPortabilidade: boolean
}

const normal = (
  id: SituacaoId, rotulo: string, rotuloCurto: string, ordem: number,
  prazoRotulo: string, prazoDiasUteis: number | null,
  extras: Partial<Situacao> = {},
): Situacao => ({
  id, rotulo, rotuloCurto, ordem, prazoRotulo, prazoDiasUteis,
  encerra: false, ehExcecao: false, soPortabilidade: false, ...extras,
})

const excecao = (
  id: SituacaoId, rotulo: string, rotuloCurto: string,
  prazoRotulo: string, encerra = false,
): Situacao => ({
  id, rotulo, rotuloCurto, ordem: null, prazoRotulo, prazoDiasUteis: null,
  encerra, ehExcecao: true, soPortabilidade: false,
})

/**
 * TRANSCRITO DE `product-plan/sections/lista-de-pedidos/sample-data.json`.
 *
 * Cada rótulo, prazo e número aqui é cópia literal do pacote de design — que é
 * quem manda no vocabulário e no que aparece na tela. Não reescreva "a partir
 * do que faz sentido": o teste de deriva compara este array com o arquivo de
 * origem e falha na primeira letra diferente.
 *
 * Duas leituras que não são óbvias e vieram de lá:
 * - `4 horas` é `0.5` dia útil. Meio dia é o que faz o alerta disparar no dia
 *   útil seguinte, e não dois dias depois.
 * - `mesmo dia` é `1`, não `0`. Com zero, o pedido entraria em `atencao` no
 *   instante em que chega no status — âmbar antes de haver qualquer atraso.
 */
export const SITUACOES: readonly Situacao[] = [
  normal('PEDIDO_DO_COMERCIAL', 'PEDIDO DO COMERCIAL', 'COMERCIAL', 1, '4 horas', 0.5),
  normal('AGUARDANDO_CONFECCAO', 'AGUARDANDO CONFECÇÃO DE CONTRATO', 'CONFECÇÃO', 2, '1 dia útil', 1),
  normal('CONTRATO_ENVIADO', 'CONTRATO ENVIADO PARA ASSINATURA', 'ENVIADO P/ ASSINAR', 3, '2 dias úteis', 2),
  normal('CONTRATO_ASSINADO', 'CONTRATO ASSINADO', 'ASSINADO', 4, 'mesmo dia', 1),
  normal('ENVIADO_PARA_OPERADORA', 'ENVIADO PEDIDO PARA OPERADORA', 'NA OPERADORA', 5, '2 dias úteis', 2),
  normal('CONTRATO_DA_OPERADORA', 'CONTRATO ENVIADO PELA OPERADORA', 'CONTRATO RECEBIDO', 6, '1 dia útil', 1),
  normal('AGUARDANDO_ASSINATURA_OPERADORA', 'AGUARDANDO ASSINATURA DO CONTRATO DA OPERADORA', 'ASSINATURA OPERADORA', 7, '2 dias úteis', 2),
  normal('CONTRATO_ASSINADO_INPUT', 'CONTRATO ASSINADO / INPUT', 'ASSINADO / INPUT', 8, '3 dias úteis', 3),
  normal('FATURADO_NA_OPERADORA', 'CONTRATO FATURADO NA OPERADORA', 'FATURADO OPERADORA', 9, '3 dias úteis', 3),
  normal('ENVIO_SMS', 'ENVIO DO SMS E AGENDAMENTO DE PORTABILIDADE', 'SMS / AGENDAMENTO', 10, 'mesmo dia', 1, { soPortabilidade: true }),
  normal('AGUARDANDO_PORTABILIDADE', 'AGUARDANDO PORTABILIDADE', 'PORTABILIDADE', 11, 'até a data agendada', null, { soPortabilidade: true }),
  normal('PRONTO_PRA_ENTREGA', 'PRONTO PRA ENTREGA', 'PRA ENTREGA', 12, '1 dia útil', 1),
  normal('ENTREGUE', 'ENTREGUE', 'ENTREGUE', 13, '1 dia útil', 1),
  normal('PEDIDO_FINALIZADO', 'PEDIDO FINALIZADO', 'FINALIZADO', 14, '—', null, { encerra: true }),
  // O prazoRotulo das exceções não é um prazo: é o motivo de não haver relógio.
  excecao('DEVOLVIDO', 'DEVOLVIDO', 'DEVOLVIDO', 'relógio parado'),
  excecao('PARADO', 'PARADO', 'PARADO', 'decisão do Comercial'),
  excecao('CANCELADO', 'CANCELADO', 'CANCELADO', '—', true),
]

const porId = new Map(SITUACOES.map((s) => [s.id, s]))

export function situacao(id: SituacaoId): Situacao {
  const achada = porId.get(id)
  if (!achada) throw new Error(`Situação desconhecida: ${id}`)
  return achada
}

/** O caminho do pedido. Em quem não é portabilidade, as etapas 10 e 11 não existem. */
export function caminhoNormal(tipo: TipoDePedido): Situacao[] {
  return SITUACOES.filter(
    (s) => !s.ehExcecao && (!s.soPortabilidade || tipo === 'Portabilidade'),
  )
}

/** D2: eSIM é tipo de chip, mas a Lista e o Status o exibem na coluna de entrega. */
export function formaDeEntregaExibida(p: {
  tipoDeChip: TipoDeChip
  formaDeEntrega: FormaDeEntrega | null
}): string {
  return p.tipoDeChip === 'eSIM' ? 'eSIM' : (p.formaDeEntrega ?? '—')
}
