import { ArrowUpRight, Copy } from 'lucide-react'
import type { AvisoDeDuplicidade as Aviso } from '../types'
import { FOCO, MONO } from './estilos'
import { formatarData } from './formato'

interface AvisoDeDuplicidadeProps {
  aviso: Aviso
  onAbrirPedidoExistente?: (numero: string) => void
  onIgnorar?: () => void
}

/**
 * Mesmo CNPJ, mesma quantidade de linhas, pedido ainda em aberto.
 *
 * Âmbar e não vermelho de propósito: isto é uma decisão do Comercial — reenvio ou
 * pedido novo — e não um erro. Vermelho continua reservado a bloqueio.
 */
export function AvisoDeDuplicidade({
  aviso,
  onAbrirPedidoExistente,
  onIgnorar,
}: AvisoDeDuplicidadeProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/70 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <Copy
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Já existe pedido em aberto para este cliente com a mesma quantidade de linhas
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
            <span className="font-semibold tabular-nums" style={{ fontFamily: MONO }}>
              {aviso.numero}
            </span>
            <span className="truncate">{aviso.razaoSocial}</span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              {aviso.situacaoRotulo}
            </span>
            <span>
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {aviso.qtdLinhas}
              </span>{' '}
              linhas
            </span>
            <span>
              parado há{' '}
              <span className="font-semibold tabular-nums" style={{ fontFamily: MONO }}>
                {aviso.diasParados}
              </span>{' '}
              dias
            </span>
            <span className="text-amber-700/80 dark:text-amber-300/70">
              entrou em {formatarData(aviso.dataEntrada)}
            </span>
          </div>

          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
            Se for reenvio do mesmo pedido, não crie um segundo — abra o que já existe.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAbrirPedidoExistente?.(aviso.numero)}
              className={`flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 dark:hover:bg-amber-500 ${FOCO}`}
            >
              Abrir {aviso.numero}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onIgnorar}
              className={`rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-950 ${FOCO}`}
            >
              É pedido novo, seguir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
