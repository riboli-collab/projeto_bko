import { situacao } from './situacoes'
import type { SituacaoId } from './tipos'
import type { TransicaoDisponivel } from '@/design/secoes/status-do-pedido/types'

/**
 * Quem pode o quê.
 *
 * Camada separada da máquina de estados de propósito. `maquina-de-estados.ts`
 * responde "o processo permite ir daqui para ali?"; este arquivo responde
 * "**esta pessoa** pode?". Misturar as duas faria a regra do processo mudar
 * conforme quem está olhando, e a regra do processo não muda.
 *
 * A divisão vem da tabela de perfis do PRD (§2), com uma decisão que o PRD
 * deixou em aberto: ele pergunta "quem cobre cada trilha em caso de ausência?"
 * e não responde. A resposta escolhida foi **o BKO cobre o BKO** — Tamara,
 * Gabrielle e Hiago compartilham a faixa 2–13 e se substituem. A divisão
 * Contrato/Execução continua valendo como combinado de equipe; ela só não é
 * imposta pelo sistema, para a falta de uma pessoa não parar a esteira.
 */
export type Papel = 'Comercial' | 'BKO' | 'Liderança' | 'Supervisão'

export const PAPEIS: Papel[] = ['Comercial', 'BKO', 'Liderança', 'Supervisão']

export function ehPapel(valor: string): valor is Papel {
  return (PAPEIS as string[]).includes(valor)
}

/**
 * Converte o texto do banco num papel, caindo no **mais restrito** quando não
 * reconhece.
 *
 * `papel` é `text` livre: a CLI aceita o que for digitado, e um dia alguém vai
 * criar um usuário com papel "bko" minúsculo ou "Financeiro". Um `as Papel`
 * cru faria esse valor escorregar para o ramo permissivo de cada função —
 * ficaria com mais poder por causa de um erro de digitação. Aqui ele vira
 * Comercial, que é quem menos pode.
 */
export function papelDe(valor: string | null | undefined): Papel {
  return valor && ehPapel(valor) ? valor : 'Comercial'
}

/** Cobrem qualquer faixa. O PRD dá a Raquel "suporte quando necessário" e ao
 *  Supervisor "correção de todo o processo" — os dois já são a válvula. */
const COBREM_TUDO: Papel[] = ['Liderança', 'Supervisão']

/** A entrada, conferida pela Liderança antes de o pedido andar. */
const CONFERENCIA: SituacaoId = 'PEDIDO_DO_COMERCIAL'

/** O fechamento, que é lançar no Custos. Também da Liderança. */
const FECHAMENTO: SituacaoId = 'PEDIDO_FINALIZADO'

export interface Veredito {
  pode: boolean
  /** Escrito para quem leu, não para quem programou. Vai direto para a tela. */
  motivo: string | null
}

const SIM: Veredito = { pode: true, motivo: null }
const nao = (motivo: string): Veredito => ({ pode: false, motivo })

/**
 * Mover um pedido de uma situação para outra.
 *
 * Quem manda é a situação de **origem** — é onde o pedido está agora, e
 * portanto de quem é o trabalho. A única exceção é o fechamento: entrar em
 * PEDIDO FINALIZADO é lançar no Custos, e isso é da Liderança mesmo vindo de
 * ENTREGUE, que é faixa do BKO.
 */
export function podeMudarSituacao(a: {
  papel: Papel
  de: SituacaoId
  para: SituacaoId
}): Veredito {
  if (COBREM_TUDO.includes(a.papel)) return SIM

  if (a.papel === 'Comercial') {
    return nao(
      'O Comercial abre o pedido e acompanha; quem move é o BKO. ' +
      'Se algo está errado na entrada, registre uma pendência.',
    )
  }

  // A partir daqui, só BKO.
  if (a.de === CONFERENCIA) {
    return nao(
      `A conferência da entrada é da Liderança — é ela que decide se o pedido ` +
      `passa ou volta. Peça a quem tem o papel Liderança.`,
    )
  }
  if (a.para === FECHAMENTO) {
    return nao(
      'Finalizar é lançar a venda no Custos, e isso é da Liderança. ' +
      'Deixe em ENTREGUE que ela fecha.',
    )
  }
  return SIM
}

/**
 * Aplica o papel sobre o que a máquina de estados já ofereceu.
 *
 * Nunca **libera** o que o processo bloqueou: só fecha o que o papel não
 * alcança. A ordem importa — a regra do processo vem primeiro, e a mensagem
 * dela é mais específica ("Devolução só acontece em PEDIDO DO COMERCIAL") do
 * que a de papel.
 */
export function aplicarPapel(
  transicoes: TransicaoDisponivel[], papel: Papel, de: SituacaoId,
): TransicaoDisponivel[] {
  return transicoes.map((t) => {
    if (!t.permitida) return t
    const veredito = podeMudarSituacao({ papel, de, para: t.situacaoId as SituacaoId })
    return veredito.pode
      ? t
      : { ...t, permitida: false, motivoDoBloqueio: veredito.motivo }
  })
}

/**
 * Pendência é conversa de dentro do BKO.
 *
 * O Comercial fica de fora porque nenhuma pessoa do Comercial aparece na lista
 * de donos possíveis: abrir uma pendência que ninguém pode receber é criar um
 * item que não vai ser respondido.
 */
export function podeMexerEmPendencia(papel: Papel): Veredito {
  return papel === 'Comercial'
    ? nao('Pendência é registro de trabalho do BKO. O Comercial acompanha pelo pedido.')
    : SIM
}

/**
 * Criar pedido fica **aberto a todos**, de propósito.
 *
 * A tentação é fechar em Comercial, já que o PRD dá a origem a ele. Não fecha:
 * criar não é a ação arriscada — é a entrada da esteira, e ela nasce em
 * PEDIDO DO COMERCIAL, onde a Liderança confere tudo antes de o pedido andar.
 * Quem cria fica assinado no histórico. Bloquear só criaria o caso de alguém do
 * BKO receber um pedido por e-mail e não ter como registrá-lo — que é
 * exatamente o hábito que a Esteira existe para acabar.
 */
export function podeCriarPedido(_papel: Papel): Veredito {
  return SIM
}
