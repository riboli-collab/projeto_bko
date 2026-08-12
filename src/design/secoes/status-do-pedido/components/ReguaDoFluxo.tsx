import { ArrowRight } from 'lucide-react'
import type {
  Pedido,
  Situacao,
  TransicaoDoHistorico,
} from '../types'
import { CARTAO, MICRO_ROTULO, MONO, PRAZO, formatarData } from './estilos'

interface ReguaDoFluxoProps {
  situacoes: Situacao[]
  situacaoAtual: Situacao
  historico: TransicaoDoHistorico[]
  pedido: Pedido
}

type Estado = 'concluida' | 'atual' | 'adiante'

/**
 * Onde o pedido está na esteira, e quanto falta.
 *
 * O histórico ao lado conta o passado em texto corrido; esta régua mostra o que vem
 * pela frente, que nenhuma outra tela diz. Os números são os do catálogo, não a
 * posição na régua — num pedido sem portabilidade o 10 e o 11 somem e a sequência
 * pula de 9 para 12. O buraco é a informação.
 */
export function ReguaDoFluxo({ situacoes, situacaoAtual, historico, pedido }: ReguaDoFluxoProps) {
  const ehPortabilidade = pedido.tipo === 'Portabilidade'

  const etapas = situacoes
    .filter((item) => !item.ehExcecao)
    .filter((item) => !item.soPortabilidade || ehPortabilidade)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))

  const puladas = situacoes.filter((item) => item.soPortabilidade && !ehPortabilidade)

  // A data em que o pedido entrou em cada situação sai do próprio histórico.
  const entradaEm = new Map(historico.map((item) => [item.para, item.quando]))

  const indiceAtual = etapas.findIndex((item) => item.id === situacaoAtual.id)
  const foraDoCaminho = indiceAtual === -1

  const estadoDe = (situacao: Situacao, indice: number): Estado => {
    if (situacao.id === situacaoAtual.id) return 'atual'
    if (foraDoCaminho) return entradaEm.has(situacao.id) ? 'concluida' : 'adiante'
    return indice < indiceAtual ? 'concluida' : 'adiante'
  }

  const adiante = foraDoCaminho ? [] : etapas.slice(indiceAtual + 1)
  const proxima = adiante[0] ?? null

  const diasConhecidos = adiante.reduce((soma, item) => soma + (item.prazoDiasUteis ?? 0), 0)
  // `—` é o fim da esteira, não prazo desconhecido. Só conta como incógnita o que
  // tem prazo mas não em dias, como a janela de portabilidade.
  const semPrazoEmDias = adiante.filter(
    (item) => item.prazoDiasUteis === null && item.prazoRotulo !== '—'
  )

  const numero = (valor: number) =>
    Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ',')

  const semaforo = PRAZO[pedido.estadoDoPrazo]

  return (
    <section className={`${CARTAO} p-4`} aria-labelledby="regua-do-fluxo">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* Mesmo tratamento de "Dados do pedido" e "Histórico": são todos títulos
            de cartão, no mesmo nível. Caixa alta aqui fazia este parecer legenda. */}
        <h2
          id="regua-do-fluxo"
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          Onde o pedido está
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {foraDoCaminho ? (
            <>Fora do caminho — em {situacaoAtual.rotulo}</>
          ) : (
            <>
              Etapa{' '}
              <span className="tabular-nums text-slate-900 dark:text-slate-100" style={{ fontFamily: MONO }}>
                {indiceAtual + 1}
              </span>{' '}
              de{' '}
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {etapas.length}
              </span>
            </>
          )}
        </p>
      </div>

      <ol className="mt-2.5 flex flex-wrap items-center gap-1">
        {etapas.map((situacao, indice) => {
          const estado = estadoDe(situacao, indice)
          const quando = entradaEm.get(situacao.id)
          const legenda =
            estado === 'concluida'
              ? `${situacao.rotulo} — concluída${quando ? ` em ${formatarData(quando.split(' ')[0])}` : ''}`
              : estado === 'atual'
                ? `${situacao.rotulo} — situação atual, ${pedido.diasParados} dias parados`
                : situacao.prazoRotulo === '—'
                ? `${situacao.rotulo} — ainda não`
                : `${situacao.rotulo} — ainda não, prazo de ${situacao.prazoRotulo}`

          return (
            <li key={situacao.id}>
              <span
                title={legenda}
                aria-current={estado === 'atual' ? 'step' : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] tabular-nums transition-colors ${
                  estado === 'concluida'
                    ? 'bg-blue-600 font-medium text-white dark:bg-blue-500'
                    : estado === 'atual'
                      ? 'bg-blue-50 font-semibold text-blue-800 ring-2 ring-blue-600 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-500'
                      : 'border border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600'
                }`}
                style={{ fontFamily: MONO }}
              >
                {situacao.ordem}
                <span className="sr-only"> — {legenda}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-slate-500 dark:text-slate-400">
          <span className={MICRO_ROTULO}>Agora</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {situacaoAtual.rotulo}
          </span>
          <span className={semaforo.texto}>
            · {pedido.diasParados} {pedido.diasParados === 1 ? 'dia parado' : 'dias parados'}
          </span>
          {situacaoAtual.prazoRotulo !== '—' && <span>· prazo de {situacaoAtual.prazoRotulo}</span>}
        </p>

        {proxima && (
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-slate-500 dark:text-slate-400">
            <span className={MICRO_ROTULO}>Próxima</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-700" strokeWidth={2} aria-hidden="true" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{proxima.rotulo}</span>
            <span>· {proxima.prazoRotulo}</span>
          </p>
        )}

        {!foraDoCaminho && adiante.length > 0 && (
          <p className="text-slate-500 dark:text-slate-400">
            Faltam{' '}
            <span className="tabular-nums text-slate-900 dark:text-slate-100" style={{ fontFamily: MONO }}>
              {adiante.length}
            </span>{' '}
            {adiante.length === 1 ? 'etapa' : 'etapas'}
            {diasConhecidos > 0 && <> — cerca de {numero(diasConhecidos)} dias úteis</>}
            {semPrazoEmDias.length > 0 && (
              <>
                , sem contar {semPrazoEmDias.map((item) => item.rotuloCurto).join(' e ')}
                {semPrazoEmDias.length === 1 ? ', que não tem' : ', que não têm'} prazo em dias
              </>
            )}
            . <span className="text-slate-400 dark:text-slate-600">Soma dos prazos de cada etapa — estimativa, não previsão.</span>
          </p>
        )}

        {puladas.length > 0 && (
          <p className="text-slate-400 dark:text-slate-600">
            {puladas.map((item) => item.ordem).join(' e ')} não aparecem: só existem em pedido de
            portabilidade, e este é {pedido.tipo.toLowerCase()}.
          </p>
        )}
      </div>
    </section>
  )
}
