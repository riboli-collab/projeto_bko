import { useState } from 'react'
import { Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import type {
  BloqueioDePreco,
  ExcecaoDePreco,
} from '../types'
import { classeDoControle, FOCO, MONO } from './estilos'
import { formatarMoeda } from './formato'

interface TravaDePrecoProps {
  bloqueio: BloqueioDePreco
  excecao?: ExcecaoDePreco
  onSolicitarExcecao?: (justificativa: string) => void
}

/**
 * Venda abaixo do custo não grava.
 *
 * A saída existe, mas é escrita: justificativa obrigatória, decisão do Supervisor,
 * autor e data registrados junto do pedido. Combinado por telefone não vale.
 */
export function TravaDePreco({ bloqueio, excecao, onSolicitarExcecao }: TravaDePrecoProps) {
  const [pedindo, setPedindo] = useState(false)
  const [justificativa, setJustificativa] = useState('')

  const status = excecao?.status ?? 'nao-solicitada'

  if (status === 'aprovada') {
    return (
      <div className="mt-2 rounded-md border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/70 dark:bg-blue-950/40">
        <p className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Exceção de preço aprovada
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-blue-900/90 dark:text-blue-200/90">
          “{excecao?.justificativa}”
        </p>
        <p className="mt-1.5 text-[11px] text-blue-700 dark:text-blue-300/80">
          {excecao?.decididaPor} · {excecao?.decididaEm} · fica registrada junto do pedido
        </p>
      </div>
    )
  }

  if (status === 'aguardando') {
    return (
      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/70 dark:bg-amber-950/40">
        <p className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Exceção aguardando o Supervisor
        </p>
        <p className="mt-1.5 text-xs text-amber-800 dark:text-amber-300">
          O pedido não segue enquanto a liberação não chegar por escrito.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="painel-de-preco"
      className="mt-2 rounded-md border border-red-200 bg-red-50/70 p-3 dark:border-red-900/70 dark:bg-red-950/40"
    >
      <p className="flex items-center gap-2 text-xs font-semibold text-red-900 dark:text-red-200">
        <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        Preço abaixo do custo — o pedido não grava assim
      </p>

      <dl
        className="mt-2.5 grid grid-cols-3 gap-2 text-center"
        style={{ fontFamily: MONO }}
      >
        <div className="rounded border border-red-200/70 bg-white px-2 py-1.5 dark:border-red-900/50 dark:bg-slate-950">
          <dt className="text-[10px] uppercase tracking-wide text-slate-400">Custo</dt>
          <dd className="mt-0.5 text-sm tabular-nums text-slate-900 dark:text-slate-100">
            {formatarMoeda(bloqueio.custoPorLinha)}
          </dd>
        </div>
        <div className="rounded border border-red-200/70 bg-white px-2 py-1.5 dark:border-red-900/50 dark:bg-slate-950">
          <dt className="text-[10px] uppercase tracking-wide text-slate-400">Venda</dt>
          <dd className="mt-0.5 text-sm tabular-nums text-red-700 dark:text-red-400">
            {formatarMoeda(bloqueio.precoInformado)}
          </dd>
        </div>
        <div className="rounded border border-red-200/70 bg-white px-2 py-1.5 dark:border-red-900/50 dark:bg-slate-950">
          <dt className="text-[10px] uppercase tracking-wide text-slate-400">Falta</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-red-700 dark:text-red-400">
            {formatarMoeda(bloqueio.diferenca)}
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-[11px] text-red-800 dark:text-red-300">
        {bloqueio.planoNome} custa {formatarMoeda(bloqueio.custoPorLinha)} por linha, por mês.
        Corrija o preço ou peça exceção ao Supervisor.
      </p>

      {pedindo ? (
        <div className="mt-2.5">
          <label
            htmlFor="justificativa-excecao"
            className="text-[11px] font-medium text-red-900 dark:text-red-200"
          >
            Justificativa (obrigatória)
          </label>
          <textarea
            id="justificativa-excecao"
            rows={3}
            value={justificativa}
            onChange={(evento) => setJustificativa(evento.target.value)}
            placeholder="Por que esta venda abaixo do custo se justifica?"
            className={`${classeDoControle('normal')} mt-1 resize-y`}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={justificativa.trim().length === 0}
              onClick={() => onSolicitarExcecao?.(justificativa.trim())}
              className={`rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-500 ${FOCO}`}
            >
              Pedir exceção ao Supervisor
            </button>
            <button
              type="button"
              onClick={() => setPedindo(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-red-900 transition-colors hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-950 ${FOCO}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPedindo(true)}
          className={`mt-2.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-950 ${FOCO}`}
        >
          Pedir exceção ao Supervisor
        </button>
      )}
    </div>
  )
}
