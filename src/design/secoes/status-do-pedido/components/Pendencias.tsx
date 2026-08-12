import { useMemo, useState } from 'react'
import { BookCheck, Check, CircleHelp, Plus } from 'lucide-react'
import type {
  Pendencia,
  Situacao,
  SituacaoId,
} from '../types'
import { CARTAO, FOCO, MICRO_ROTULO, MONO, formatarData } from './estilos'

interface PendenciasProps {
  pendencias: Pendencia[]
  situacoes: Situacao[]
  situacaoAtual: Situacao
  pessoas: string[]
  onAbrirPendencia?: (pergunta: string, dono: string) => void
  onResponderPendencia?: (id: string, resposta: string, ehRegra: boolean) => void
}

/**
 * As pendências, agrupadas pela situação em que o pedido travou.
 *
 * O ponto do produto está aqui: a dúvida deixa de ser uma ligação para a supervisão e
 * vira registro com dono e data. Respondida e marcada como regra, ela aparece para
 * todos que chegarem na mesma situação — a resposta para de se perder.
 */
export function Pendencias({
  pendencias,
  situacoes,
  situacaoAtual,
  pessoas,
  onAbrirPendencia,
  onResponderPendencia,
}: PendenciasProps) {
  const [abrindo, setAbrindo] = useState(false)
  const [pergunta, setPergunta] = useState('')
  const [dono, setDono] = useState('')
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [viraRegra, setViraRegra] = useState(false)

  const rotuloDe = (id: SituacaoId) => situacoes.find((item) => item.id === id)?.rotuloCurto ?? id

  // Extraído antes do useMemo de propósito: com `situacaoAtual.id` na lista de
  // dependências o compilador infere o objeto inteiro e desiste de memoizar.
  const situacaoAtualId = situacaoAtual.id

  // A situação atual vem primeiro; o resto na ordem em que aparece.
  const grupos = useMemo(() => {
    const mapa = new Map<SituacaoId, Pendencia[]>()
    for (const pendencia of pendencias) {
      mapa.set(pendencia.situacaoId, [...(mapa.get(pendencia.situacaoId) ?? []), pendencia])
    }
    return [...mapa.entries()].sort(([a], [b]) => {
      if (a === situacaoAtualId) return -1
      if (b === situacaoAtualId) return 1
      return 0
    })
  }, [pendencias, situacaoAtualId])

  const abertas = pendencias.filter((item) => item.resposta === null).length

  const confirmarAbertura = () => {
    if (pergunta.trim().length === 0 || dono === '') return
    onAbrirPendencia?.(pergunta.trim(), dono)
    setPergunta('')
    setDono('')
    setAbrindo(false)
  }

  const confirmarResposta = (id: string) => {
    if (resposta.trim().length === 0) return
    onResponderPendencia?.(id, resposta.trim(), viraRegra)
    setRespondendo(null)
    setResposta('')
    setViraRegra(false)
  }

  return (
    <section className={CARTAO}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Pendências
          {abertas > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                {abertas}
              </span>{' '}
              {abertas === 1 ? 'aberta' : 'abertas'}
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={() => setAbrindo((atual) => !atual)}
          className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 ${FOCO}`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Abrir
        </button>
      </header>

      {abrindo && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <p className={MICRO_ROTULO}>Nova pendência em {situacaoAtual.rotulo}</p>

          <textarea
            rows={3}
            value={pergunta}
            onChange={(evento) => setPergunta(evento.target.value)}
            placeholder="Qual é a dúvida que travou o pedido?"
            aria-label="Pergunta da pendência"
            className={`mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${FOCO}`}
          />

          <label htmlFor="dono-da-pendencia" className={`${MICRO_ROTULO} mt-3 block`}>
            Dono — uma pessoa, nunca um setor
          </label>
          <select
            id="dono-da-pendencia"
            value={dono}
            onChange={(evento) => setDono(evento.target.value)}
            className={`mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 ${
              dono ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
            } ${FOCO}`}
          >
            <option value="">Escolha o dono</option>
            {pessoas.map((pessoa) => (
              <option key={pessoa} value={pessoa} className="text-slate-900">
                {pessoa}
              </option>
            ))}
          </select>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmarAbertura}
              disabled={pergunta.trim().length === 0 || dono === ''}
              className={`rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:hover:bg-blue-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${FOCO}`}
            >
              Abrir pendência
            </button>
            <button
              type="button"
              onClick={() => setAbrindo(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${FOCO}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pendencias.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Nenhuma pendência neste pedido.
        </p>
      ) : (
        <div className="flex flex-col">
          {grupos.map(([situacaoId, itens]) => (
            <div key={situacaoId} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
              <p
                className={`${MICRO_ROTULO} flex items-center gap-1.5 bg-slate-50/80 px-4 py-1.5 dark:bg-slate-900/50`}
              >
                {rotuloDe(situacaoId)}
                {situacaoId === situacaoAtual.id && (
                  <span className="rounded-full bg-blue-100 px-1.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    situação atual
                  </span>
                )}
              </p>

              <ul className="flex flex-col">
                {itens.map((pendencia) => {
                  const aberta = pendencia.resposta === null

                  return (
                    <li
                      key={pendencia.id}
                      className="border-t border-slate-100 px-4 py-3 first:border-0 dark:border-slate-800/70"
                    >
                      <div className="flex items-start gap-2">
                        {aberta ? (
                          <CircleHelp
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        ) : (
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        )}
                        <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-900 dark:text-slate-100">
                          {pendencia.pergunta}
                        </p>
                      </div>

                      <p className="mt-1.5 pl-5 text-[11px] text-slate-400 dark:text-slate-500">
                        {pendencia.dono} · aberta por {pendencia.abertaPor} em{' '}
                        <span className="tabular-nums" style={{ fontFamily: MONO }}>
                          {formatarData(pendencia.abertaEm)}
                        </span>
                        {aberta && pendencia.diasAberta > 0 && (
                          <>
                            {' · '}
                            <span className="font-medium text-amber-700 dark:text-amber-400">
                              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                                {pendencia.diasAberta}
                              </span>{' '}
                              dias sem resposta
                            </span>
                          </>
                        )}
                      </p>

                      {!aberta && (
                        <div className="mt-2 ml-5 rounded-md border-l-2 border-emerald-400 bg-emerald-50/60 py-2 pl-2.5 pr-3 dark:border-emerald-500 dark:bg-emerald-950/30">
                          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                            {pendencia.resposta}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>
                              {pendencia.respondidaPor} ·{' '}
                              <span className="tabular-nums" style={{ fontFamily: MONO }}>
                                {pendencia.respondidaEm ? formatarData(pendencia.respondidaEm) : ''}
                              </span>
                            </span>
                            {pendencia.ehRegra && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                <BookCheck className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                                virou regra
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {aberta &&
                        (respondendo === pendencia.id ? (
                          <div className="mt-2 pl-5">
                            <textarea
                              rows={3}
                              value={resposta}
                              onChange={(evento) => setResposta(evento.target.value)}
                              placeholder="A resposta que vale para quem chegar nesta situação"
                              aria-label="Resposta da pendência"
                              className={`w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${FOCO}`}
                            />
                            <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                              <input
                                type="checkbox"
                                checked={viraRegra}
                                onChange={(evento) => setViraRegra(evento.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 dark:border-slate-700"
                              />
                              Marcar como regra desta situação
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => confirmarResposta(pendencia.id)}
                                disabled={resposta.trim().length === 0}
                                className={`rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:hover:bg-blue-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${FOCO}`}
                              >
                                Responder
                              </button>
                              <button
                                type="button"
                                onClick={() => setRespondendo(null)}
                                className={`rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${FOCO}`}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRespondendo(pendencia.id)
                              setResposta('')
                              setViraRegra(false)
                            }}
                            className={`ml-5 mt-2 rounded text-[11px] font-medium text-blue-700 underline-offset-2 transition-colors hover:underline dark:text-blue-400 ${FOCO}`}
                          >
                            Responder
                          </button>
                        ))}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
