import { useMemo, useState } from 'react'
import type {
  EstadoDoPrazo,
  ListaDePedidosProps,
  ModoDeExibicao,
  Pedido,
  Situacao,
  SituacaoId,
} from '../types'
import { BarraDeFiltros } from './BarraDeFiltros'
import { ChipsDeSituacao } from './ChipsDeSituacao'
import { ErroDaLista, EsqueletoDaLista, ListaVazia } from './EstadosDaLista'
import { GRADE_AGRUPADA, GRADE_PLANA, MICRO_ROTULO, MONO } from './estilos'
import { GrupoDeSituacao } from './GrupoDeSituacao'
import { LinhaDePedido } from './LinhaDePedido'

interface Grupo {
  situacao: Situacao
  pedidos: Pedido[]
  estadoDoGrupo: EstadoDoPrazo
  piorDias: number
  temEstouro: boolean
}

const PESO_DO_ESTADO: Record<EstadoDoPrazo, number> = {
  estourado: 0,
  atencao: 1,
  'em-dia': 2,
  pausado: 3,
  encerrado: 4,
}

function horaDe(iso: string) {
  const data = new Date(iso)
  return Number.isNaN(data.getTime())
    ? iso
    : data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * A fila de trabalho do BKO.
 *
 * Duas exigências que se contradizem convivem aqui: o PRD pede ordenação por dias
 * parados decrescente, e o agrupamento por situação esconde o pior pedido dentro de
 * um grupo fechado. A saída são três regras — grupos ordenados pelo pior pedido que
 * contêm, o pior número visível no cabeçalho mesmo fechado, e o modo plano a um clique.
 */
export function ListaDePedidos({
  pedidos,
  situacoes,
  opcoesDeFiltro,
  filtrosAtivos,
  resumo,
  modoDeExibicao,
  gruposAbertos,
  isLoading = false,
  erro = null,
  onAbrirPedido,
  onModoDeExibicaoChange,
  onAlternarGrupo,
  onFiltrosChange,
  onLimparFiltros,
  onTentarNovamente,
}: ListaDePedidosProps) {
  // Modo e grupos abertos funcionam controlados ou sozinhos: a app pode assumir,
  // e se não assumir a tela continua interativa.
  const [modoInterno, setModoInterno] = useState<ModoDeExibicao>('por-situacao')
  const [abertosInternos, setAbertosInternos] = useState<SituacaoId[] | null>(null)

  const modo = modoDeExibicao ?? modoInterno

  const grupos = useMemo<Grupo[]>(() => {
    return situacoes
      .map((situacao) => {
        const itens = pedidos
          .filter((pedido) => pedido.situacaoId === situacao.id)
          .sort((a, b) => b.diasParados - a.diasParados)

        const temEstouro = itens.some((pedido) => pedido.estadoDoPrazo === 'estourado')
        const piorDias = itens.reduce((maior, pedido) => Math.max(maior, pedido.diasParados), 0)
        const estadoDoGrupo = itens.reduce<EstadoDoPrazo>(
          (pior, pedido) =>
            PESO_DO_ESTADO[pedido.estadoDoPrazo] < PESO_DO_ESTADO[pior] ? pedido.estadoDoPrazo : pior,
          'encerrado'
        )

        return { situacao, pedidos: itens, estadoDoGrupo, piorDias, temEstouro }
      })
      .sort((a, b) => {
        // Vazios por último; depois quem tem estouro; depois pelo pior número.
        if ((a.pedidos.length === 0) !== (b.pedidos.length === 0)) {
          return a.pedidos.length === 0 ? 1 : -1
        }
        if (a.temEstouro !== b.temEstouro) return a.temEstouro ? -1 : 1
        return b.piorDias - a.piorDias
      })
  }, [pedidos, situacoes])

  const padraoAbertos = useMemo(
    () => grupos.filter((grupo) => grupo.temEstouro).map((grupo) => grupo.situacao.id),
    [grupos]
  )

  const abertos = gruposAbertos ?? abertosInternos ?? padraoAbertos

  const alternarGrupo = (id: SituacaoId) => {
    setAbertosInternos(
      abertos.includes(id) ? abertos.filter((item) => item !== id) : [...abertos, id]
    )
    onAlternarGrupo?.(id)
  }

  const trocarModo = (novo: ModoDeExibicao) => {
    setModoInterno(novo)
    onModoDeExibicaoChange?.(novo)
  }

  const listaPlana = useMemo(
    () =>
      [...pedidos].sort((a, b) => {
        if (a.encerrado !== b.encerrado) return a.encerrado ? 1 : -1
        if (b.diasParados !== a.diasParados) return b.diasParados - a.diasParados
        return a.numero.localeCompare(b.numero)
      }),
    [pedidos]
  )

  const porId = useMemo(
    () => new Map(situacoes.map((situacao) => [situacao.id, situacao])),
    [situacoes]
  )

  const temFiltros =
    filtrosAtivos.busca.trim().length > 0 ||
    filtrosAtivos.situacoes.length > 0 ||
    filtrosAtivos.responsaveis.length > 0 ||
    filtrosAtivos.operadoras.length > 0 ||
    filtrosAtivos.empresasFaturadoras.length > 0

  const gradeClasse = modo === 'por-situacao' ? GRADE_AGRUPADA : GRADE_PLANA
  const totalExibido = pedidos.length

  const alternarChip = (id: SituacaoId) =>
    onFiltrosChange?.({
      ...filtrosAtivos,
      situacoes: filtrosAtivos.situacoes.includes(id)
        ? filtrosAtivos.situacoes.filter((item) => item !== id)
        : [...filtrosAtivos.situacoes, id],
    })

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Pedidos
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span>
              <span className="tabular-nums text-slate-900 dark:text-slate-100" style={{ fontFamily: MONO }}>
                {resumo.totalEmAberto}
              </span>{' '}
              em aberto
            </span>
            {resumo.totalEstourados > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="font-medium text-red-700 dark:text-red-400">
                  <span className="tabular-nums" style={{ fontFamily: MONO }}>
                    {resumo.totalEstourados}
                  </span>{' '}
                  com prazo estourado
                </span>
              </>
            )}
          </p>
        </div>

        <p className={MICRO_ROTULO}>atualizado às {horaDe(resumo.atualizadoEm)}</p>
      </header>

      <BarraDeFiltros
        filtros={filtrosAtivos}
        opcoes={opcoesDeFiltro}
        situacoes={situacoes}
        modo={modo}
        onFiltrosChange={onFiltrosChange}
        onModoChange={trocarModo}
        onLimparFiltros={onLimparFiltros}
      />

      <ChipsDeSituacao
        situacoes={situacoes}
        selecionadas={filtrosAtivos.situacoes}
        onAlternar={alternarChip}
      />

      {/* A fila */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {/* Cabeçalho de colunas — some no cartão do mobile */}
        {!isLoading && !erro && totalExibido > 0 && (
          <div
            className={`hidden items-center gap-x-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/50 md:grid ${gradeClasse}`}
          >
            <span className={MICRO_ROTULO}>Pedido</span>
            <span className={MICRO_ROTULO}>Cliente</span>
            {modo === 'por-dias-parados' && <span className={MICRO_ROTULO}>Situação</span>}
            <span className={MICRO_ROTULO}>Responsável</span>
            <span className={`${MICRO_ROTULO} hidden lg:block`}>Operadora</span>
            <span className={`${MICRO_ROTULO} hidden lg:block`}>Empresa</span>
            <span className={`${MICRO_ROTULO} hidden text-right lg:block`}>Linhas</span>
            <span className={`${MICRO_ROTULO} text-right`}>Dias</span>
          </div>
        )}

        {isLoading ? (
          <EsqueletoDaLista />
        ) : erro ? (
          <ErroDaLista
            mensagem={erro}
            atualizadoEm={horaDe(resumo.atualizadoEm)}
            onTentarNovamente={onTentarNovamente}
          />
        ) : totalExibido === 0 ? (
          <ListaVazia temFiltros={temFiltros} onLimparFiltros={onLimparFiltros} />
        ) : modo === 'por-situacao' ? (
          grupos.map((grupo) => (
            <GrupoDeSituacao
              key={grupo.situacao.id}
              situacao={grupo.situacao}
              pedidos={grupo.pedidos}
              estadoDoGrupo={grupo.estadoDoGrupo}
              piorDias={grupo.piorDias}
              aberto={abertos.includes(grupo.situacao.id)}
              gradeClasse={gradeClasse}
              onAlternar={() => alternarGrupo(grupo.situacao.id)}
              onAbrirPedido={onAbrirPedido}
            />
          ))
        ) : (
          listaPlana.map((pedido) => (
            <LinhaDePedido
              key={pedido.numero}
              pedido={pedido}
              gradeClasse={gradeClasse}
              situacao={porId.get(pedido.situacaoId)}
              onAbrir={() => onAbrirPedido?.(pedido.numero)}
            />
          ))
        )}
      </div>

      {!isLoading && !erro && totalExibido > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Mostrando{' '}
          <span className="tabular-nums" style={{ fontFamily: MONO }}>
            {totalExibido}
          </span>{' '}
          {totalExibido === 1 ? 'pedido' : 'pedidos'}
          {temFiltros ? ' com os filtros aplicados' : ''}. Clique numa linha para abrir o Status do Pedido.
        </p>
      )}
    </div>
  )
}
