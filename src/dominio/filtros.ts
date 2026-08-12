import type { SituacaoId, Operadora, EmpresaFaturadora } from './tipos'

/**
 * Os filtros da fila. Moram no domínio, e não em `consultas/lista.ts`, porque a
 * tela é Client Component: importar um valor do módulo de consulta arrastaria o
 * cliente do Postgres para dentro do bundle do navegador, e o build quebra em
 * `Can't resolve 'fs'`. Tipo atravessa a fronteira; valor não.
 */
export interface FiltrosAtivos {
  situacoes: SituacaoId[]
  responsaveis: string[]
  operadoras: Operadora[]
  empresasFaturadoras: EmpresaFaturadora[]
  /** Aceita número do pedido, razão social ou CNPJ/CPF. */
  busca: string
  incluirEncerrados: boolean
}

export const FILTROS_VAZIOS: FiltrosAtivos = {
  situacoes: [], responsaveis: [], operadoras: [],
  empresasFaturadoras: [], busca: '', incluirEncerrados: false,
}
