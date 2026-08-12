import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { CARTAO, MICRO_ROTULO, MONO } from './estilos'

interface BlocoDoFormularioProps {
  titulo: string
  descricao: string
  /** Campos obrigatórios já preenchidos neste bloco. */
  preenchidos: number
  total: number
  children: ReactNode
}

/**
 * Um dos quatro blocos do formulário. O contador próprio de cada bloco existe para o
 * Comercial saber onde falta coisa sem percorrer a página inteira.
 */
export function BlocoDoFormulario({
  titulo,
  descricao,
  preenchidos,
  total,
  children,
}: BlocoDoFormularioProps) {
  // Zero de zero não é bloco concluído: é bloco que ainda não sabe o que pedir.
  const completo = total > 0 && preenchidos === total

  return (
    <section className={CARTAO}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descricao}</p>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            completo
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/80'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {completo && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
          <span className="tabular-nums" style={{ fontFamily: MONO }}>
            {preenchidos} de {total}
          </span>
        </span>
      </header>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5">{children}</div>
    </section>
  )
}

interface ContadorDosCamposProps {
  preenchidos: number
  total: number
}

/**
 * O contador que fica no topo da tela, sempre visível.
 * O total varia: 17 campos com chip físico, 16 com eSIM.
 */
export function ContadorDosCampos({ preenchidos, total }: ContadorDosCamposProps) {
  const completo = preenchidos === total

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={preenchidos}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Campos obrigatórios preenchidos"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            completo ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-blue-600 dark:bg-blue-500'
          }`}
          style={{ width: `${(preenchidos / total) * 100}%` }}
        />
      </div>

      <p className={MICRO_ROTULO}>
        <span
          className={`tabular-nums ${
            completo
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-900 dark:text-slate-100'
          }`}
          style={{ fontFamily: MONO }}
        >
          {preenchidos}
        </span>
        <span className="tabular-nums" style={{ fontFamily: MONO }}>
          /{total}
        </span>{' '}
        campos obrigatórios
      </p>
    </div>
  )
}
