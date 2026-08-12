import { ChevronRight } from 'lucide-react'
import type {
  EstadoDoPrazo,
  Pedido,
  Situacao,
} from '../types'
import { FOCO, MICRO_ROTULO, MONO, PRAZO } from './estilos'
import { LinhaDePedido } from './LinhaDePedido'
import { SemaforoDePrazo } from './SemaforoDePrazo'

interface GrupoDeSituacaoProps {
  situacao: Situacao
  pedidos: Pedido[]
  estadoDoGrupo: EstadoDoPrazo
  /** O maior número de dias parados do grupo. Fica visível mesmo com o grupo fechado. */
  piorDias: number
  aberto: boolean
  gradeClasse: string
  onAlternar?: () => void
  onAbrirPedido?: (numero: string) => void
}

/**
 * Um grupo de situação. O cabeçalho carrega contagem, prazo e o pior número de dias
 * parados — é o que impede o pedido mais atrasado de sumir dentro de um grupo fechado.
 */
export function GrupoDeSituacao({
  situacao,
  pedidos,
  estadoDoGrupo,
  piorDias,
  aberto,
  gradeClasse,
  onAlternar,
  onAbrirPedido,
}: GrupoDeSituacaoProps) {
  const estilo = PRAZO[estadoDoGrupo]
  const vazio = pedidos.length === 0
  const idDoCorpo = `grupo-${situacao.id}`

  // Grupo vazio é informação, não erro: aparece como uma faixa apagada, sem chevron.
  if (vazio) {
    return (
      <div className="relative flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2 dark:border-slate-800/70 dark:bg-slate-900/40">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-slate-200 dark:bg-slate-800" />
        <span className={`${MICRO_ROTULO} text-slate-400 dark:text-slate-600`}>
          {situacao.rotulo}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-600">nenhum pedido</span>
      </div>
    )
  }

  return (
    <section className="relative">
      <h2>
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={aberto}
          aria-controls={idDoCorpo}
          className={`relative flex w-full items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-900 ${FOCO}`}
        >
          <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[3px] ${estilo.trilho}`} />

          <ChevronRight
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
              aberto ? 'rotate-90' : ''
            }`}
            strokeWidth={2.5}
          />

          <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-700 dark:text-slate-200">
            {situacao.rotulo}
          </span>

          <span
            className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            style={{ fontFamily: MONO }}
          >
            {pedidos.length}
          </span>

          <span className="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:inline">
            prazo {situacao.prazoRotulo}
          </span>

          <span className="ml-auto flex items-center gap-2">
            <span className={`${MICRO_ROTULO} hidden sm:inline`}>pior</span>
            <SemaforoDePrazo estado={estadoDoGrupo} dias={piorDias} tamanho="destaque" />
          </span>
        </button>
      </h2>

      {/* Colapso sem medir altura: a grade vai de 0fr a 1fr */}
      <div
        id={idDoCorpo}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {pedidos.map((pedido) => (
            <LinhaDePedido
              key={pedido.numero}
              pedido={pedido}
              gradeClasse={gradeClasse}
              onAbrir={() => onAbrirPedido?.(pedido.numero)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
