import type { Situacao, SituacaoId } from '../types'
import { FOCO, MONO } from './estilos'

interface ChipsDeSituacaoProps {
  situacoes: Situacao[]
  selecionadas: SituacaoId[]
  onAlternar: (id: SituacaoId) => void
}

/**
 * A forma da esteira numa faixa: os 17 status com a contagem de cada um,
 * inclusive os que estão em zero. Clicar filtra; clicar de novo desfaz.
 *
 * Os chips quebram em várias linhas em vez de rolar na horizontal: com 17 status,
 * o que sai da borda direita não é encontrado — a faixa existe justamente para
 * mostrar a esteira inteira de uma vez.
 */
export function ChipsDeSituacao({ situacoes, selecionadas, onAlternar }: ChipsDeSituacaoProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por situação"
      className="flex flex-wrap gap-1.5"
    >
      {situacoes.map((situacao) => {
        const ativo = selecionadas.includes(situacao.id)
        const vazio = situacao.quantidade === 0

        return (
          <button
            key={situacao.id}
            type="button"
            onClick={() => onAlternar(situacao.id)}
            aria-pressed={ativo}
            className={`flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-1 text-[10px] font-medium uppercase transition-colors ${FOCO} ${
              ativo
                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                : vazio
                  ? 'border-slate-200 bg-transparent text-slate-300 hover:text-slate-400 dark:border-slate-800 dark:text-slate-600 dark:hover:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {situacao.rotuloCurto}
            <span
              className={`tabular-nums ${
                ativo ? 'text-blue-100' : vazio ? 'opacity-70' : 'text-slate-400 dark:text-slate-500'
              }`}
              style={{ fontFamily: MONO }}
            >
              {situacao.quantidade}
            </span>
          </button>
        )
      })}
    </div>
  )
}
