import { ArrowRight, Flag } from 'lucide-react'
import type {
  Situacao,
  SituacaoId,
  TransicaoDoHistorico,
} from '../types'
import { CARTAO, MICRO_ROTULO, MONO, formatarDataHora } from './estilos'

interface LinhaDoTempoProps {
  historico: TransicaoDoHistorico[]
  situacoes: Situacao[]
}

/**
 * O histórico completo, do mais recente ao mais antigo.
 *
 * É o que torna o fluxo auditável: hoje alguém marca "feito" e não há como conferir.
 * O tempo em cada situação fica visível para mostrar onde a esteira trava de verdade.
 */
export function LinhaDoTempo({ historico, situacoes }: LinhaDoTempoProps) {
  const rotuloDe = (id: SituacaoId) => situacoes.find((item) => item.id === id)?.rotuloCurto ?? id

  return (
    <section className={CARTAO}>
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Histórico</h2>
        <span className={MICRO_ROTULO}>
          <span className="tabular-nums" style={{ fontFamily: MONO }}>
            {historico.length}
          </span>{' '}
          {historico.length === 1 ? 'transição' : 'transições'}
        </span>
      </header>

      <ol data-testid="historico" className="flex flex-col px-4 py-4">
        {historico.map((item, indice) => {
          const ultimo = indice === historico.length - 1

          return (
            <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
              {/* Trilho vertical ligando os pontos */}
              {!ultimo && (
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-4 h-full w-px bg-slate-200 dark:bg-slate-800"
                />
              )}

              <span
                aria-hidden="true"
                className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-950 ${
                  item.estourouOPrazo
                    ? 'bg-red-600 dark:bg-red-400'
                    : indice === 0
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                  {item.de ? (
                    <>
                      <span className="text-slate-400 dark:text-slate-500">{rotuloDe(item.de)}</span>
                      <ArrowRight
                        className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-700"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    <Flag
                      className="h-3 w-3 shrink-0 text-slate-400"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {rotuloDe(item.para)}
                  </span>
                </p>

                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="tabular-nums" style={{ fontFamily: MONO }}>
                    {formatarDataHora(item.quando)}
                  </span>{' '}
                  · {item.quem}
                  {item.de && (
                    <>
                      {' · '}
                      <span
                        className={
                          item.estourouOPrazo
                            ? 'font-medium text-red-700 dark:text-red-400'
                            : undefined
                        }
                      >
                        <span className="tabular-nums" style={{ fontFamily: MONO }}>
                          {item.diasNaSituacao}
                        </span>{' '}
                        {item.diasNaSituacao === 1 ? 'dia' : 'dias'} em {rotuloDe(item.de)}
                        {item.estourouOPrazo ? ' — estourou' : ''}
                      </span>
                    </>
                  )}
                </p>

                {item.motivo && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.motivo}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
