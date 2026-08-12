import type { PainelDaManhaProps } from '../types'
import { CartaoDePergunta } from './CartaoDePergunta'
import { MICRO_ROTULO, MONO } from './estilos'

/**
 * O painel da manhã.
 *
 * Quatro perguntas, uma tela, quinze minutos. O painel é só leitura de propósito:
 * toda transição acontece no Status do Pedido, com data e autor gravados. Aqui a liderança
 * descobre o que precisa de ação — e clica para ir agir no lugar certo.
 */
export function PainelDaManha({
  perguntas,
  resumo,
  isLoading = false,
  onAbrirPedido,
  onVerTodos,
}: PainelDaManhaProps) {
  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((indice) => (
            <div
              key={indice}
              className="h-72 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Bom dia
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {resumo.dataPorExtenso} ·{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {resumo.totalParaAgir}
              </span>{' '}
              {resumo.totalParaAgir === 1 ? 'pedido pede ação' : 'pedidos pedem ação'} hoje
            </span>
          </p>
        </div>

        <p className={MICRO_ROTULO}>atualizado às {resumo.atualizadoEm}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {perguntas.map((pergunta) => (
          <CartaoDePergunta
            key={pergunta.id}
            pergunta={pergunta}
            onAbrirPedido={onAbrirPedido}
            onVerTodos={() => onVerTodos?.(pergunta.id)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        O painel é só leitura. Clique num pedido para abrir o Status do Pedido — é lá que a situação muda,
        com data e autor gravados.
      </p>
    </div>
  )
}
