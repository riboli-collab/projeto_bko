import { LayoutList, Rows3, Search, X } from 'lucide-react'
import type {
  EmpresaFaturadora,
  FiltrosAtivos,
  ModoDeExibicao,
  OpcoesDeFiltro,
  Operadora,
  Situacao,
  SituacaoId,
} from '../types'
import { FOCO } from './estilos'
import { SeletorMultiplo } from './SeletorMultiplo'

interface BarraDeFiltrosProps {
  filtros: FiltrosAtivos
  opcoes: OpcoesDeFiltro
  situacoes: Situacao[]
  modo: ModoDeExibicao
  onFiltrosChange?: (filtros: FiltrosAtivos) => void
  onModoChange?: (modo: ModoDeExibicao) => void
  onLimparFiltros?: () => void
}

interface Marcador {
  chave: string
  rotulo: string
  remover: () => void
}

export function BarraDeFiltros({
  filtros,
  opcoes,
  situacoes,
  modo,
  onFiltrosChange,
  onModoChange,
  onLimparFiltros,
}: BarraDeFiltrosProps) {
  const alterar = (parcial: Partial<FiltrosAtivos>) => onFiltrosChange?.({ ...filtros, ...parcial })

  const rotuloDaSituacao = (id: SituacaoId) =>
    situacoes.find((situacao) => situacao.id === id)?.rotuloCurto ?? id

  const marcadores: Marcador[] = [
    ...(filtros.busca
      ? [{ chave: 'busca', rotulo: `"${filtros.busca}"`, remover: () => alterar({ busca: '' }) }]
      : []),
    ...filtros.situacoes.map((id) => ({
      chave: `situacao-${id}`,
      rotulo: rotuloDaSituacao(id),
      remover: () => alterar({ situacoes: filtros.situacoes.filter((item) => item !== id) }),
    })),
    ...filtros.responsaveis.map((nome) => ({
      chave: `responsavel-${nome}`,
      rotulo: nome,
      remover: () => alterar({ responsaveis: filtros.responsaveis.filter((item) => item !== nome) }),
    })),
    ...filtros.operadoras.map((operadora) => ({
      chave: `operadora-${operadora}`,
      rotulo: operadora,
      remover: () => alterar({ operadoras: filtros.operadoras.filter((item) => item !== operadora) }),
    })),
    ...filtros.empresasFaturadoras.map((empresa) => ({
      chave: `empresa-${empresa}`,
      rotulo: empresa,
      remover: () =>
        alterar({
          empresasFaturadoras: filtros.empresasFaturadoras.filter((item) => item !== empresa),
        }),
    })),
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Busca e modo de exibição */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={filtros.busca}
            onChange={(evento) => alterar({ busca: evento.target.value })}
            placeholder="Buscar por número do pedido, cliente ou CNPJ/CPF"
            aria-label="Buscar por número do pedido, cliente ou CNPJ/CPF"
            className={`w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${FOCO}`}
          />
          {filtros.busca && (
            <button
              type="button"
              onClick={() => alterar({ busca: '' })}
              aria-label="Limpar busca"
              className={`absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${FOCO}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Modo de exibição"
          className="flex shrink-0 rounded-md border border-slate-200 p-0.5 dark:border-slate-800"
        >
          <button
            type="button"
            onClick={() => onModoChange?.('por-situacao')}
            aria-pressed={modo === 'por-situacao'}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${FOCO} ${
              modo === 'por-situacao'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" strokeWidth={1.75} />
            Por situação
          </button>
          <button
            type="button"
            onClick={() => onModoChange?.('por-dias-parados')}
            aria-pressed={modo === 'por-dias-parados'}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${FOCO} ${
              modo === 'por-dias-parados'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Por dias parados
          </button>
        </div>
      </div>

      {/* Os quatro filtros do PRD e o alternador de encerrados */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
        <div className="lg:w-44">
          <SeletorMultiplo
            rotulo="Situação"
            opcoes={situacoes.map((situacao) => ({
              valor: situacao.id,
              rotulo: situacao.rotuloCurto,
              quantidade: situacao.quantidade,
            }))}
            selecionadas={filtros.situacoes}
            onChange={(valores) => alterar({ situacoes: valores as SituacaoId[] })}
          />
        </div>
        <div className="lg:w-44">
          <SeletorMultiplo
            rotulo="Responsável"
            opcoes={opcoes.responsaveis.map((nome) => ({ valor: nome, rotulo: nome }))}
            selecionadas={filtros.responsaveis}
            onChange={(valores) => alterar({ responsaveis: valores })}
          />
        </div>
        <div className="lg:w-36">
          <SeletorMultiplo
            rotulo="Operadora"
            opcoes={opcoes.operadoras.map((item) => ({ valor: item, rotulo: item }))}
            selecionadas={filtros.operadoras}
            onChange={(valores) => alterar({ operadoras: valores as Operadora[] })}
          />
        </div>
        <div className="lg:w-36">
          <SeletorMultiplo
            rotulo="Empresa"
            opcoes={opcoes.empresasFaturadoras.map((item) => ({ valor: item, rotulo: item }))}
            selecionadas={filtros.empresasFaturadoras}
            onChange={(valores) => alterar({ empresasFaturadoras: valores as EmpresaFaturadora[] })}
          />
        </div>

        <button
          type="button"
          onClick={() => alterar({ incluirEncerrados: !filtros.incluirEncerrados })}
          aria-pressed={filtros.incluirEncerrados}
          className={`col-span-2 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors sm:col-span-4 lg:col-span-1 lg:ml-auto ${FOCO} ${
            filtros.incluirEncerrados
              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
              filtros.incluirEncerrados
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full bg-white transition-transform ${
                filtros.incluirEncerrados ? 'translate-x-3' : ''
              }`}
            />
          </span>
          Incluir encerrados
        </button>
      </div>

      {/* Filtros aplicados, removíveis um a um */}
      {marcadores.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {marcadores.map((marcador) => (
            <span
              key={marcador.chave}
              className="flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              <span className="max-w-48 truncate">{marcador.rotulo}</span>
              <button
                type="button"
                onClick={marcador.remover}
                aria-label={`Remover filtro ${marcador.rotulo}`}
                className={`flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100 ${FOCO}`}
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onLimparFiltros}
            className={`rounded px-1.5 py-0.5 text-xs font-medium text-blue-700 underline-offset-2 transition-colors hover:underline dark:text-blue-400 ${FOCO}`}
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}
