'use client'

import { CalendarClock, Receipt } from 'lucide-react'
import { CARTAO, MONO, formatarMoeda } from '@/design/secoes/entrada-do-pedido/components'
import type { Cobranca } from '@/dominio/cobranca'

/**
 * O micro-rótulo com os tons que passam no contraste.
 *
 * Não é o `MICRO_ROTULO` importado de propósito: a cópia do design em
 * `src/design/` ainda traz `text-slate-400 dark:text-slate-500`, que dá 2,6:1
 * no claro — reprovado para texto pequeno. O projeto de design já foi corrigido
 * para `text-slate-500 dark:text-slate-400` (4,8:1 e 7,9:1); esta constante é
 * exatamente essa correção, e some quando o export propagar.
 */
const MICRO_ROTULO =
  'text-[10px] font-medium uppercase tracking-[0.09em] text-slate-500 dark:text-slate-400'

/**
 * As duas cobranças, lado a lado.
 *
 * Mora em `telas/` e não em `design/` porque a cópia do pacote de design é
 * intocada: a fonte é o projeto de design, e ela é regerada no export. Os
 * tokens (`CARTAO`, `MONO`, `formatarMoeda`) são importados de lá — usar o
 * design system não é editá-lo, e é o que mantém este bloco parecido com o
 * resto da tela quando o pacote mudar.
 */

function Valor({ rotulo, valor, destaque = false, children }: {
  rotulo: string
  valor: number
  destaque?: boolean
  children?: React.ReactNode
}) {
  return (
    <div>
      <dt className={MICRO_ROTULO}>{rotulo}</dt>
      <dd
        className={`mt-1 tabular-nums ${
          destaque
            ? 'text-lg font-semibold text-slate-900 dark:text-slate-100'
            : 'text-lg font-semibold text-slate-700 dark:text-slate-300'
        }`}
        style={{ fontFamily: MONO }}
      >
        R$ {formatarMoeda(valor)}
      </dd>
      {children}
    </div>
  )
}

export function ResumoDaCobranca({
  cobranca, className = '', id = 'resumo-da-cobranca',
}: {
  cobranca: Cobranca
  className?: string
  id?: string
}) {
  const { mensal, chipUmaVez, primeiraFatura, qtdLinhas, chipPorChip, semCobrancaDeChip } = cobranca

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-testid="resumo-da-cobranca"
      className={`${CARTAO} ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <Receipt className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
        <h2 id={`${id}-titulo`} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Cobrança
        </h2>
      </header>

      <dl className="grid gap-4 px-4 py-3.5 sm:grid-cols-2">
        <Valor rotulo="Primeira fatura" valor={primeiraFatura} destaque>
          {!semCobrancaDeChip && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              plano R$ {formatarMoeda(mensal)} + chip R$ {formatarMoeda(chipUmaVez)}
              {' '}({qtdLinhas} × R$ {formatarMoeda(chipPorChip)})
            </p>
          )}
        </Valor>

        <Valor rotulo="Todo mês, a partir da segunda" valor={mensal}>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {semCobrancaDeChip
              ? 'Sem cobrança de chip — toda fatura é igual a esta.'
              : 'O chip é cobrado uma vez só. Ele não volta nas próximas faturas.'}
          </p>
        </Valor>
      </dl>
    </section>
  )
}
