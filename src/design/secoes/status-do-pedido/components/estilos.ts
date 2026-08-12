import type { EstadoDoPrazo } from '../types'

/** JetBrains Mono, do design system. Números que precisam alinhar usam isto. */
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export const MICRO_ROTULO =
  'text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500'

export const FOCO =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'

export const CARTAO =
  'rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'

interface EstiloDePrazo {
  capsula: string
  ponto: string
  texto: string
  descricao: string
}

/**
 * O mesmo semáforo da Lista de pedidos, repetido aqui de propósito: cada seção é
 * exportada por conta própria e não pode depender do arquivo da outra.
 * Tom 600 no claro, 400 no escuro — vermelho 500 sobre fundo escuro perde o alarme.
 */
export const PRAZO: Record<EstadoDoPrazo, EstiloDePrazo> = {
  estourado: {
    capsula:
      'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/70 dark:text-red-300 dark:ring-red-900/80',
    ponto: 'bg-red-600 dark:bg-red-400',
    texto: 'text-red-700 dark:text-red-400',
    descricao: 'prazo estourado',
  },
  atencao: {
    capsula:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900/80',
    ponto: 'bg-amber-500 dark:bg-amber-400',
    texto: 'text-amber-700 dark:text-amber-400',
    descricao: 'perto de estourar',
  },
  'em-dia': {
    capsula:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900/80',
    ponto: 'bg-emerald-500 dark:bg-emerald-400',
    texto: 'text-emerald-700 dark:text-emerald-400',
    descricao: 'em dia',
  },
  pausado: {
    capsula:
      'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
    ponto: 'bg-slate-300 dark:bg-slate-600',
    texto: 'text-slate-500 dark:text-slate-400',
    descricao: 'relógio parado — a bola está com o Comercial',
  },
  encerrado: {
    capsula:
      'bg-transparent text-slate-400 ring-1 ring-slate-200 dark:text-slate-500 dark:ring-slate-800',
    ponto: 'bg-slate-200 dark:bg-slate-800',
    texto: 'text-slate-400 dark:text-slate-500',
    descricao: 'encerrado',
  },
}

export function formatarDataHora(texto: string) {
  const [data, hora] = texto.split(' ')
  if (!data) return texto
  const partes = data.split('-')
  if (partes.length !== 3) return texto
  const [ano, mes, dia] = partes
  const formatada = `${dia}/${mes}/${ano}`
  return hora ? `${formatada} às ${hora}` : formatada
}

export function formatarData(iso: string) {
  const partes = iso.split('-')
  if (partes.length !== 3) return iso
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
