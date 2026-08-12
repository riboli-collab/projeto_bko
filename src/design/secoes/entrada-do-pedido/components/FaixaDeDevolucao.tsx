import { Undo2 } from 'lucide-react'
import type { Devolucao } from '../types'
import { MONO } from './estilos'

interface FaixaDeDevolucaoProps {
  devolucao: Devolucao
  /** Quantos dos itens apontados — campos e documentos — já foram corrigidos. */
  corrigidos: number
}

/**
 * A faixa do pedido que voltou.
 *
 * Diz o número, quem devolveu, quando e quantos itens foram apontados — e mostra o
 * progresso da correção, porque o reenvio só libera quando todos forem mexidos.
 */
export function FaixaDeDevolucao({ devolucao, corrigidos }: FaixaDeDevolucaoProps) {
  const total = devolucao.apontamentos.length

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 dark:border-red-900/70 dark:bg-red-950/40">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex items-start gap-3">
          <Undo2
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
            strokeWidth={2}
            aria-hidden="true"
          />
          <div>
            <h2 className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-red-900 dark:text-red-200">
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {devolucao.numero}
              </span>
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Devolvido
              </span>
              {devolucao.vez > 1 && (
                <span className="rounded border border-red-300 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-800 dark:border-red-800 dark:text-red-300">
                  {devolucao.vez}ª devolução · Supervisor em cópia
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs text-red-800 dark:text-red-300">
              {devolucao.devolvidaPor} devolveu em {devolucao.devolvidaEm} ·{' '}
              <span className="font-semibold tabular-nums" style={{ fontFamily: MONO }}>
                {total}
              </span>{' '}
              {total === 1 ? 'item apontado' : 'itens apontados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="flex h-1.5 w-24 overflow-hidden rounded-full bg-red-200 dark:bg-red-900/60"
            role="progressbar"
            aria-valuenow={corrigidos}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Itens apontados já corrigidos"
          >
            <div
              className="h-full rounded-full bg-red-600 transition-all duration-300 dark:bg-red-400"
              style={{ width: `${total === 0 ? 0 : (corrigidos / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-red-800 dark:text-red-300">
            <span className="font-semibold tabular-nums" style={{ fontFamily: MONO }}>
              {corrigidos}/{total}
            </span>{' '}
            corrigidos
          </p>
        </div>
      </div>

      <p className="mt-3 border-l-2 border-red-300 pl-3 text-xs leading-relaxed text-red-900/90 dark:border-red-800 dark:text-red-200/90">
        {devolucao.mensagem}
      </p>
    </div>
  )
}
