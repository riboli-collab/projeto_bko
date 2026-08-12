import { ArrowRight, Check, ChevronRight } from 'lucide-react'
import type { Pergunta } from '../types'
import { FOCO, MICRO_ROTULO, MONO, TOM } from './estilos'

interface CartaoDePerguntaProps {
  pergunta: Pergunta
  onAbrirPedido?: (numero: string) => void
  onVerTodos?: () => void
}

/** Quantos pedidos cabem no cartão antes do rodapé "e mais N". */
const VISIVEIS = 5

/**
 * Uma das quatro perguntas do ritual.
 *
 * O cartão responde três coisas na mesma leitura: quantos são, quais são e o que fazer
 * com eles. A frase de ação existe para o painel não virar um placar — quem lê já sabe
 * o próximo passo sem perguntar.
 */
export function CartaoDePergunta({ pergunta, onAbrirPedido, onVerTodos }: CartaoDePerguntaProps) {
  const tom = TOM[pergunta.tom]
  const vazio = pergunta.total === 0
  const visiveis = pergunta.pedidos.slice(0, VISIVEIS)
  const restantes = pergunta.total - visiveis.length

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg border ${
        vazio ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950' : tom.cartao
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1 w-full shrink-0 ${vazio ? 'bg-slate-200 dark:bg-slate-800' : tom.faixa}`}
      />

      <header className="flex items-start justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pergunta.titulo}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{pergunta.acao}</p>
        </div>

        <p
          className={`shrink-0 text-3xl font-semibold tabular-nums leading-none ${
            vazio ? 'text-slate-300 dark:text-slate-700' : tom.numero
          }`}
          style={{ fontFamily: MONO }}
        >
          {pergunta.total}
        </p>
      </header>

      {vazio ? (
        <p className="flex flex-1 items-center gap-2 border-t border-slate-100 px-4 py-6 text-xs text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
          <Check
            className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          {pergunta.mensagemVazia}
        </p>
      ) : (
        <>
          <ul className="flex flex-1 flex-col border-t border-slate-100 dark:border-slate-800/70">
            {visiveis.map((pedido) => (
              <li key={`${pergunta.id}-${pedido.numero}`}>
                <button
                  type="button"
                  onClick={() => onAbrirPedido?.(pedido.numero)}
                  className={`group flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900/60 ${FOCO}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400"
                        style={{ fontFamily: MONO }}
                      >
                        {pedido.numero}
                      </span>
                      <span className="truncate text-xs text-slate-900 dark:text-slate-100">
                        {pedido.razaoSocial}
                      </span>
                    </span>
                    <span className={`${MICRO_ROTULO} mt-0.5 block truncate`}>
                      {pedido.situacaoRotulo} · {pedido.responsavel}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      pedido.destaqueEmAlerta ? tom.destaque : 'text-slate-500 dark:text-slate-400'
                    }`}
                    style={{ fontFamily: MONO }}
                  >
                    {pedido.destaque}
                  </span>

                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-700 dark:group-hover:text-slate-400"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>

          {restantes > 0 && (
            <button
              type="button"
              onClick={onVerTodos}
              className={`flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-slate-800/70 dark:text-blue-400 dark:hover:bg-blue-950/40 ${FOCO}`}
            >
              e mais{' '}
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {restantes}
              </span>{' '}
              na fila
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </section>
  )
}
