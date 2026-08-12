import type { TomDoCartao } from '../types'

/** JetBrains Mono, do design system. As contagens dos quatro cartões alinham por causa disto. */
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export const MICRO_ROTULO =
  'text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500'

export const FOCO =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'

interface EstiloDoTom {
  /** Borda e fundo do cartão. */
  cartao: string
  /** Faixa colorida no topo do cartão — é ela que dá o reconhecimento por cor. */
  faixa: string
  /** A contagem grande. */
  numero: string
  /** O destaque de cada linha quando está em alerta. */
  destaque: string
}

/**
 * Uma cor por pergunta, constante entre as sessões: a liderança aprende o quadrante
 * pela posição e pela cor. Vermelho é exclusivo do prazo estourado.
 */
export const TOM: Record<TomDoCartao, EstiloDoTom> = {
  vermelho: {
    cartao: 'border-red-200 bg-white dark:border-red-900/70 dark:bg-slate-950',
    faixa: 'bg-red-600 dark:bg-red-500',
    numero: 'text-red-700 dark:text-red-400',
    destaque: 'text-red-700 dark:text-red-400',
  },
  ambar: {
    cartao: 'border-amber-200 bg-white dark:border-amber-900/70 dark:bg-slate-950',
    faixa: 'bg-amber-500 dark:bg-amber-400',
    numero: 'text-amber-700 dark:text-amber-400',
    destaque: 'text-amber-700 dark:text-amber-400',
  },
  azul: {
    cartao: 'border-blue-200 bg-white dark:border-blue-900/70 dark:bg-slate-950',
    faixa: 'bg-blue-600 dark:bg-blue-500',
    numero: 'text-blue-700 dark:text-blue-400',
    destaque: 'text-blue-700 dark:text-blue-400',
  },
  neutro: {
    cartao: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
    faixa: 'bg-slate-300 dark:bg-slate-700',
    numero: 'text-slate-900 dark:text-slate-100',
    destaque: 'text-slate-600 dark:text-slate-400',
  },
}
