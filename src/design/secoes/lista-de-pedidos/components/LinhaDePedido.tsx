import type { Pedido, Situacao } from '../types'
import { FOCO, MONO, PRAZO } from './estilos'
import { SemaforoDePrazo } from './SemaforoDePrazo'

interface LinhaDePedidoProps {
  pedido: Pedido
  /** Grade compartilhada com o cabeçalho — é o que mantém as colunas alinhadas entre grupos. */
  gradeClasse: string
  /** No modo agrupado a situação é o próprio grupo, então a coluna some. */
  situacao?: Situacao
  onAbrir?: () => void
}

/**
 * Uma linha da fila. A linha inteira é clicável e só faz uma coisa: abrir o Status do Pedido.
 * Sem menu, sem checkbox, sem ação em massa — toda transição acontece no Status do Pedido,
 * onde o motivo é registrado.
 */
export function LinhaDePedido({ pedido, gradeClasse, situacao, onAbrir }: LinhaDePedidoProps) {
  const estilo = PRAZO[pedido.estadoDoPrazo]
  const esmaecido = pedido.encerrado ? 'opacity-55' : ''

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Abrir o pedido ${pedido.numero} — ${pedido.cliente.razaoSocial}`}
      className={`group relative block w-full border-b border-slate-100 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900 ${FOCO} ${esmaecido}`}
    >
      {/* Trilho de estado: só os estourados marcam a página, formando uma espinha vermelha */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] transition-opacity ${estilo.trilho} ${
          pedido.estadoDoPrazo === 'estourado' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        }`}
      />

      {/* Cartão — abaixo de 768px */}
      <div className="flex items-start gap-3 px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-medium text-slate-700 dark:text-slate-200"
              style={{ fontFamily: MONO }}
            >
              {pedido.numero}
            </span>
            {situacao && (
              <span className="truncate rounded bg-indigo-50 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {situacao.rotuloCurto}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-slate-900 dark:text-slate-100">
            {pedido.cliente.razaoSocial}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {pedido.responsavel} · {pedido.operadora} · {pedido.qtdLinhas}{' '}
            {pedido.qtdLinhas === 1 ? 'linha' : 'linhas'}
          </p>
        </div>
        <SemaforoDePrazo estado={pedido.estadoDoPrazo} dias={pedido.diasParados} />
      </div>

      {/* Grade — a partir de 768px */}
      <div className={`hidden items-center gap-x-3 px-4 py-2 md:grid ${gradeClasse}`}>
        <span
          className="truncate text-[13px] text-slate-600 dark:text-slate-300"
          style={{ fontFamily: MONO }}
        >
          {pedido.numero}
        </span>

        <span className="truncate text-sm text-slate-900 dark:text-slate-100">
          {pedido.cliente.razaoSocial}
        </span>

        {situacao && (
          <span className="truncate">
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {situacao.rotuloCurto}
            </span>
          </span>
        )}

        <span className="truncate text-sm text-slate-500 dark:text-slate-400">
          {pedido.responsavel}
        </span>

        <span className="hidden truncate text-sm text-slate-500 dark:text-slate-400 lg:block">
          {pedido.operadora}
        </span>

        <span className="hidden truncate text-sm text-slate-500 dark:text-slate-400 lg:block">
          {pedido.empresaFaturadora}
        </span>

        <span
          className="hidden text-right text-sm tabular-nums text-slate-500 dark:text-slate-400 lg:block"
          style={{ fontFamily: MONO }}
        >
          {pedido.qtdLinhas}
        </span>

        <span className="text-right">
          <SemaforoDePrazo estado={pedido.estadoDoPrazo} dias={pedido.diasParados} />
        </span>
      </div>
    </button>
  )
}
