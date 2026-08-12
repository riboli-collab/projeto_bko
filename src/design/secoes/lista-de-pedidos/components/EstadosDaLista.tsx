import { CheckCircle2, RotateCcw, SearchX, TriangleAlert } from 'lucide-react'
import { FOCO } from './estilos'

/** Esqueleto que preserva a altura da tabela — o conteúdo não pula quando os dados chegam. */
export function EsqueletoDaLista() {
  return (
    <div aria-busy="true" aria-live="polite" className="divide-y divide-slate-100 dark:divide-slate-800/70">
      <span className="sr-only">Carregando pedidos</span>
      {Array.from({ length: 8 }).map((_, indice) => (
        <div key={indice} className="flex items-center gap-3 px-4 py-3">
          <div className="h-3.5 w-24 shrink-0 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div
            className="h-3.5 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
            style={{ width: `${30 + ((indice * 7) % 25)}%` }}
          />
          <div className="ml-auto h-5 w-11 shrink-0 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  )
}

interface ListaVaziaProps {
  temFiltros: boolean
  onLimparFiltros?: () => void
}

/**
 * Fila vazia sem filtro é notícia boa e é dita como tal — sem ícone de erro,
 * sem cor de alerta. Vazio por filtro é outra coisa: oferece a saída.
 */
export function ListaVazia({ temFiltros, onLimparFiltros }: ListaVaziaProps) {
  if (!temFiltros) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Nenhum pedido em aberto
        </p>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          A fila está limpa. Nada parado, nada para cobrar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <SearchX className="h-6 w-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Nenhum pedido com estes filtros
      </p>
      <button
        type="button"
        onClick={onLimparFiltros}
        className={`mt-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 ${FOCO}`}
      >
        Limpar filtros
      </button>
    </div>
  )
}

interface ErroDaListaProps {
  mensagem: string
  atualizadoEm?: string
  onTentarNovamente?: () => void
}

/** Erro nunca apaga o que estava na tela: os filtros continuam aplicados. */
export function ErroDaLista({ mensagem, atualizadoEm, onTentarNovamente }: ErroDaListaProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-6 py-16 text-center"
    >
      <TriangleAlert className="h-6 w-6 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{mensagem}</p>
      {atualizadoEm && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Última atualização: {atualizadoEm}
        </p>
      )}
      <button
        type="button"
        onClick={onTentarNovamente}
        className={`mt-1 flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 ${FOCO}`}
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
        Tentar de novo
      </button>
    </div>
  )
}
