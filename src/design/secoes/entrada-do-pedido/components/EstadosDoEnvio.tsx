import { ArrowRight, CheckCircle2, CircleAlert, Clock3, UserCheck } from 'lucide-react'
import type { CampoId, ResultadoDoEnvio } from '../types'
import { CARTAO, FOCO, MICRO_ROTULO, MONO } from './estilos'

interface ItemFaltante {
  campoId: CampoId
  rotulo: string
  numero: number
  mensagem: string
}

interface ResumoDeErrosProps {
  itens: ItemFaltante[]
  onIrParaCampo?: (campoId: CampoId) => void
}

/** O que impediu o envio, listado um a um, cada item levando ao campo. */
export function ResumoDeErros({ itens, onIrParaCampo }: ResumoDeErrosProps) {
  if (itens.length === 0) return null

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50/70 p-4 dark:border-red-900/70 dark:bg-red-950/40"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-200">
        <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        {itens.length === 1
          ? 'Um campo impede o envio'
          : `${itens.length} campos impedem o envio`}
      </p>

      <ul className="mt-2.5 flex flex-col gap-1">
        {itens.map((item) => (
          <li key={item.campoId}>
            <button
              type="button"
              onClick={() => onIrParaCampo?.(item.campoId)}
              className={`group flex w-full items-start gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-red-100/70 dark:hover:bg-red-900/40 ${FOCO}`}
            >
              <span
                className="mt-px shrink-0 text-[10px] tabular-nums text-red-500 dark:text-red-500"
                style={{ fontFamily: MONO }}
              >
                {String(item.numero).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 text-xs text-red-900 dark:text-red-200">
                <span className="font-medium underline-offset-2 group-hover:underline">
                  {item.rotulo}
                </span>{' '}
                — {item.mensagem}
              </span>
              <ArrowRight
                className="mt-px h-3.5 w-3.5 shrink-0 text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ConfirmacaoDoEnvioProps {
  resultado: ResultadoDoEnvio
}

/** O que o pedido ganhou sozinho: número, responsável pela operadora, situação e relógio. */
export function ConfirmacaoDoEnvio({ resultado }: ConfirmacaoDoEnvioProps) {
  return (
    <div className={`${CARTAO} mx-auto max-w-xl overflow-hidden`}>
      <div className="flex flex-col items-center gap-1 border-b border-slate-200 bg-emerald-50/60 px-6 py-7 text-center dark:border-slate-800 dark:bg-emerald-950/30">
        <CheckCircle2
          className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pedido criado</p>
        <p
          className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
          style={{ fontFamily: MONO }}
        >
          {resultado.numero}
        </p>
      </div>

      <dl className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-slate-800">
        <div className="bg-white px-4 py-3 dark:bg-slate-950">
          <dt className={MICRO_ROTULO}>Responsável</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-900 dark:text-slate-100">
            <UserCheck
              className="h-3.5 w-3.5 shrink-0 text-slate-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {resultado.responsavel}
          </dd>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-slate-950">
          <dt className={MICRO_ROTULO}>Situação</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {resultado.situacaoRotulo}
          </dd>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-slate-950">
          <dt className={MICRO_ROTULO}>Prazo</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-900 dark:text-slate-100">
            <Clock3
              className="h-3.5 w-3.5 shrink-0 text-slate-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {resultado.prazoRotulo}
          </dd>
        </div>
      </dl>

      <p className="px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Enviado em {resultado.enviadoEm}. O relógio da situação {resultado.situacaoRotulo} começou a
        contar agora.
      </p>
    </div>
  )
}
