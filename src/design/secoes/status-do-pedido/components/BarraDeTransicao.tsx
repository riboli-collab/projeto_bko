import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Lock, TriangleAlert } from 'lucide-react'
import type {
  Situacao,
  SituacaoId,
  TransicaoDisponivel,
} from '../types'
import { CARTAO, FOCO, MICRO_ROTULO, MONO } from './estilos'

interface BarraDeTransicaoProps {
  transicoes: TransicaoDisponivel[]
  situacoes: Situacao[]
  /** Situação atual. Quando ela encerra o pedido, a tela fica só de leitura. */
  situacaoAtual: Situacao
  onMudarSituacao?: (situacaoId: SituacaoId, motivo: string) => void
}

/**
 * A mudança de situação.
 *
 * O caminho normal fica a um clique; o menu mostra a escada inteira — as 14 do
 * caminho na ordem, depois as 3 exceções. Nenhuma some: as bloqueadas aparecem
 * travadas, com o motivo escrito embaixo. Esconder degrau faz quem opera achar
 * que a lista acabou; mostrar travado ensina a regra antes do clique.
 */
export function BarraDeTransicao({
  transicoes,
  situacoes,
  situacaoAtual,
  onMudarSituacao,
}: BarraDeTransicaoProps) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [escolhida, setEscolhida] = useState<TransicaoDisponivel | null>(null)
  const [motivo, setMotivo] = useState('')
  const menu = useRef<HTMLDivElement>(null)

  // Um menu de 17 linhas cobre boa parte da tela. Sem Escape e sem clique fora ele
  // vira uma cortina que só o próprio botão levanta.
  useEffect(() => {
    if (!menuAberto) return

    const naTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAberto(false)
    }
    const noPonteiro = (evento: PointerEvent) => {
      if (!menu.current?.contains(evento.target as Node)) setMenuAberto(false)
    }

    document.addEventListener('keydown', naTecla)
    document.addEventListener('pointerdown', noPonteiro)
    return () => {
      document.removeEventListener('keydown', naTecla)
      document.removeEventListener('pointerdown', noPonteiro)
    }
  }, [menuAberto])

  const rotuloDe = (id: SituacaoId) => situacoes.find((item) => item.id === id)?.rotulo ?? id

  const proxima = transicoes.find((item) => item.ehProximaDoFluxo && item.permitida) ?? null

  const porId = new Map(transicoes.map((item) => [item.situacaoId, item]))
  const caminho = situacoes
    .filter((item) => !item.ehExcecao)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  const excecoes = situacoes.filter((item) => item.ehExcecao)

  /**
   * Usado só quando a situação não veio em `transicoes`. O texto sai da posição na
   * escada, que é dado — não de regra inventada aqui. Um motivo específico vindo do
   * backend sempre ganha deste.
   */
  const motivoPadrao = (situacao: Situacao) => {
    if (situacao.ordem !== null && situacaoAtual.ordem !== null) {
      if (situacao.ordem < situacaoAtual.ordem) {
        return 'Situação já percorrida. Nada volta atrás — se algo precisa ser refeito, abra uma pendência.'
      }
      return 'Fora de ordem. O pedido passa pelas situações anteriores antes de chegar aqui.'
    }
    return `Não disponível a partir de ${situacaoAtual.rotulo}.`
  }

  const escolher = (transicao: TransicaoDisponivel) => {
    if (!transicao.permitida) return
    setEscolhida(transicao)
    setMotivo('')
    setMenuAberto(false)
  }

  const confirmar = () => {
    if (!escolhida) return
    if (escolhida.exigeMotivo && motivo.trim().length === 0) return
    onMudarSituacao?.(escolhida.situacaoId, motivo.trim())
    setEscolhida(null)
    setMotivo('')
  }

  const linha = (situacao: Situacao) => {
    const ehAtual = situacao.id === situacaoAtual.id
    const transicao = porId.get(situacao.id) ?? null
    const permitida = !ehAtual && (transicao?.permitida ?? false)
    const ehProxima = transicao?.ehProximaDoFluxo === true && permitida
    const exigeMotivo = transicao?.exigeMotivo === true
    const explicacao = ehAtual
      ? 'O pedido está aqui agora.'
      : permitida
        ? null
        : (transicao?.motivoDoBloqueio ?? motivoPadrao(situacao))

    return (
      <li key={situacao.id}>
        <button
          type="button"
          disabled={!permitida}
          aria-current={ehAtual ? 'step' : undefined}
          onClick={() => transicao && escolher(transicao)}
          className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${FOCO} ${
            permitida ? 'hover:bg-slate-50 dark:hover:bg-slate-800' : 'cursor-not-allowed'
          } ${ehAtual ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''}`}
        >
          <span
            className={`mt-px w-4 shrink-0 text-center text-[11px] tabular-nums ${
              ehAtual ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'
            }`}
            style={{ fontFamily: MONO }}
          >
            {situacao.ordem ?? '—'}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              {ehAtual ? (
                <Check
                  className="h-3 w-3 shrink-0 text-blue-700 dark:text-blue-400"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              ) : (
                !permitida && (
                  <Lock
                    className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-600"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )
              )}
              <span
                className={`text-sm font-medium ${
                  ehAtual
                    ? 'text-blue-800 dark:text-blue-300'
                    : permitida
                      ? exigeMotivo
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {situacao.rotulo}
              </span>
              {ehProxima && (
                <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-white">
                  próxima
                </span>
              )}
            </span>

            {explicacao && (
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                {explicacao}
              </span>
            )}
          </span>
        </button>
      </li>
    )
  }

  if (situacaoAtual.encerra) {
    return (
      <div className={`${CARTAO} flex items-center gap-2.5 px-4 py-3`}>
        <Lock className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Este pedido está em{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {situacaoAtual.rotulo}
          </span>
          . A tela fica só de leitura — o histórico continua inteiro abaixo.
        </p>
      </div>
    )
  }

  return (
    <div className={`${CARTAO} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        {proxima ? (
          <button
            type="button"
            onClick={() => escolher(proxima)}
            className={`flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-500 ${FOCO}`}
          >
            Avançar para {rotuloDe(proxima.situacaoId)}
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma transição do caminho normal está liberada agora.
          </p>
        )}

        <div className="relative" ref={menu}>
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            className={`flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-100 ${FOCO}`}
          >
            Todas as situações
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${menuAberto ? 'rotate-180' : ''}`}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {menuAberto && (
            <div
              data-testid="menu-de-situacoes"
              className="absolute left-0 top-full z-20 mt-1 max-h-[28rem] w-96 max-w-[calc(100vw-3rem)] overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <p
                className={`${MICRO_ROTULO} sticky top-0 z-10 border-b border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900`}
              >
                Caminho do pedido
              </p>
              <ul>{caminho.map(linha)}</ul>

              <p
                className={`${MICRO_ROTULO} sticky top-0 z-10 border-y border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900`}
              >
                Exceções — saem do caminho, exigem motivo
              </p>
              <ul>{excecoes.map(linha)}</ul>
            </div>
          )}
        </div>
      </div>

      {/* Confirmação: o motivo é obrigatório nas transições de problema */}
      {escolhida && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-900 dark:text-slate-100">
            {situacaoAtual.rotulo}
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} aria-hidden="true" />
            <span className={escolhida.exigeMotivo ? 'font-semibold text-red-700 dark:text-red-400' : 'font-semibold'}>
              {rotuloDe(escolhida.situacaoId)}
            </span>
          </p>

          {escolhida.exigeMotivo && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              Transição de problema: o motivo fica gravado no histórico e é obrigatório.
            </p>
          )}

          <label htmlFor="motivo-da-transicao" className={`${MICRO_ROTULO} mt-3 block`}>
            Motivo {escolhida.exigeMotivo ? '(obrigatório)' : '(opcional)'}
          </label>
          <textarea
            id="motivo-da-transicao"
            rows={2}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="O que aconteceu para o pedido mudar de situação?"
            className={`mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${FOCO}`}
          />

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmar}
              disabled={escolhida.exigeMotivo && motivo.trim().length === 0}
              className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${FOCO} ${
                escolhida.exigeMotivo
                  ? 'bg-red-600 hover:bg-red-700 dark:hover:bg-red-500'
                  : 'bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500'
              }`}
            >
              Confirmar mudança
            </button>
            <button
              type="button"
              onClick={() => setEscolhida(null)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${FOCO}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
