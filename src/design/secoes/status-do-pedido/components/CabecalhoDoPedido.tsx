import { ArrowLeft } from 'lucide-react'
import type { Pedido, Situacao } from '../types'
import { FOCO, MICRO_ROTULO, MONO, PRAZO } from './estilos'

interface CabecalhoDoPedidoProps {
  pedido: Pedido
  situacao: Situacao
  onVoltarParaLista?: () => void
}

/** Número, cliente, situação e o relógio — as quatro coisas que se olha primeiro. */
export function CabecalhoDoPedido({ pedido, situacao, onVoltarParaLista }: CabecalhoDoPedidoProps) {
  const prazo = PRAZO[pedido.estadoDoPrazo]

  return (
    <header className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onVoltarParaLista}
        className={`flex w-fit items-center gap-1.5 rounded text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${FOCO}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        Voltar para a fila
      </button>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1
              className="text-xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
              style={{ fontFamily: MONO }}
            >
              {pedido.numero}
            </h1>
            <span
              data-testid="situacao-atual"
              className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${prazo.capsula}`}
            >
              {situacao.rotulo}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
            {pedido.cliente.razaoSocial}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={MICRO_ROTULO}>Parado há</p>
            <p className="mt-0.5 flex items-baseline justify-end gap-1">
              <span
                data-testid="dias-parados"
                className={`text-2xl font-semibold tabular-nums ${prazo.texto}`}
                style={{ fontFamily: MONO }}
              >
                {pedido.diasParados}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {pedido.diasParados === 1 ? 'dia útil' : 'dias úteis'}
              </span>
            </p>
            <p className={`mt-0.5 text-[11px] ${prazo.texto}`}>
              {prazo.descricao} · prazo de {situacao.prazoRotulo}
            </p>
          </div>

          <span
            aria-hidden="true"
            className={`h-14 w-1 shrink-0 rounded-full ${prazo.ponto}`}
          />
        </div>
      </div>
    </header>
  )
}
