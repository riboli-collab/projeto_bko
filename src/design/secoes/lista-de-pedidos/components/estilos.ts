import type { EstadoDoPrazo } from '../types'

/** JetBrains Mono, do design system. Números que precisam alinhar em coluna usam isto. */
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

interface EstiloDePrazo {
  /** Cápsula do número de dias parados. */
  capsula: string
  /** Trilho vertical à esquerda do grupo e da linha. */
  trilho: string
  /** Texto do rótulo no cabeçalho do grupo. */
  texto: string
  descricao: string
}

/**
 * O semáforo. Vermelho é reservado ao prazo estourado — nenhum outro elemento
 * desta seção usa vermelho. Tom 600 no claro, 400 no escuro: red-500 sobre
 * slate-950 perde contraste e o alarme deixa de saltar.
 */
export const PRAZO: Record<EstadoDoPrazo, EstiloDePrazo> = {
  estourado: {
    capsula:
      'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/70 dark:text-red-300 dark:ring-red-900/80',
    trilho: 'bg-red-600 dark:bg-red-400',
    texto: 'text-red-700 dark:text-red-400',
    descricao: 'prazo estourado',
  },
  atencao: {
    capsula:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900/80',
    trilho: 'bg-amber-500 dark:bg-amber-400',
    texto: 'text-amber-700 dark:text-amber-400',
    descricao: 'perto de estourar',
  },
  'em-dia': {
    capsula:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900/80',
    trilho: 'bg-emerald-500 dark:bg-emerald-400',
    texto: 'text-emerald-700 dark:text-emerald-400',
    descricao: 'em dia',
  },
  pausado: {
    capsula:
      'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
    trilho: 'bg-slate-300 dark:bg-slate-600',
    texto: 'text-slate-500 dark:text-slate-400',
    descricao: 'relógio parado — a bola está com o Comercial',
  },
  encerrado: {
    capsula:
      'bg-transparent text-slate-400 ring-1 ring-slate-200 dark:text-slate-500 dark:ring-slate-800',
    trilho: 'bg-slate-200 dark:bg-slate-800',
    texto: 'text-slate-400 dark:text-slate-500',
    descricao: 'encerrado',
  },
}

/**
 * As grades da tabela. Cada linha e o cabeçalho usam a mesma string, o que garante
 * que as colunas alinhem entre grupos diferentes.
 *
 * Ordem no DOM: número · cliente · [situação] · responsável · operadora · empresa · linhas · dias.
 * Entre 768px e 1024px, operadora/empresa/linhas ficam ocultas e a grade cai para 4 (ou 5) colunas.
 */
export const GRADE_AGRUPADA =
  'md:grid-cols-[8rem_minmax(0,1fr)_8rem_5rem] lg:grid-cols-[8.5rem_minmax(0,1fr)_8.5rem_5rem_4.5rem_3.5rem_5rem]'

export const GRADE_PLANA =
  'md:grid-cols-[8rem_minmax(0,1fr)_10rem_8rem_5rem] lg:grid-cols-[8.5rem_minmax(0,1fr)_11.5rem_8.5rem_5rem_4.5rem_3.5rem_5rem]'

/** Micro-rótulo em caixa alta: cabeçalho de coluna, rótulo de campo no cartão. */
export const MICRO_ROTULO =
  'text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500'

export const FOCO =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'
