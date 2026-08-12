/** JetBrains Mono, do design system. CNPJ, dinheiro e contagens usam isto. */
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export const MICRO_ROTULO =
  'text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500'

export const FOCO =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'

/**
 * Os estados visuais de um campo.
 * `daBase` marca o que veio do cadastro do cliente e ninguém redigitou.
 * `apontado` é campo que o BKO devolveu; `aceito` é campo que passou na conferência
 * e por isso não deve chamar atenção nenhuma no modo devolução.
 */
export type EstadoDoCampo = 'normal' | 'erro' | 'apontado' | 'daBase' | 'aceito' | 'bloqueado'

const CONTROLE_BASE =
  'w-full rounded-md border px-3 py-2 text-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70 dark:placeholder:text-slate-600'

/** Vermelho só em erro, apontamento e bloqueio — nunca em estado normal. */
const POR_ESTADO: Record<EstadoDoCampo, string> = {
  normal:
    'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
  erro: 'border-red-300 bg-red-50/60 text-slate-900 dark:border-red-900 dark:bg-red-950/30 dark:text-slate-100',
  apontado:
    'border-red-300 bg-red-50/60 text-slate-900 dark:border-red-900 dark:bg-red-950/30 dark:text-slate-100',
  bloqueado:
    'border-red-300 bg-red-50/60 text-slate-900 dark:border-red-900 dark:bg-red-950/30 dark:text-slate-100',
  daBase:
    'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100',
  aceito:
    'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400',
}

export function classeDoControle(estado: EstadoDoCampo = 'normal') {
  return `${CONTROLE_BASE} ${POR_ESTADO[estado]} ${FOCO}`
}

export const CARTAO =
  'rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
