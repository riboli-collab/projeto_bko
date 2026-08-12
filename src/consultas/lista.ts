import { eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { pedidos, clientes } from '@/db/schema'
import { SITUACOES, situacao } from '@/dominio/situacoes'
import { diasUteisEntre, estadoDoPrazo } from '@/dominio/relogio'
import { dataDoDesign, dataHoraDoDesign } from '@/dominio/datas'
import type {
  SituacaoId, Operadora, EmpresaFaturadora, TipoDePedido, EstadoDoPrazo,
} from '@/dominio/tipos'
import { FILTROS_VAZIOS, type FiltrosAtivos } from '@/dominio/filtros'

export { FILTROS_VAZIOS, type FiltrosAtivos }

export interface PedidoDaLista {
  numero: string
  cliente: { razaoSocial: string; cnpjCpf: string }
  situacaoId: SituacaoId
  responsavel: string
  operadora: Operadora
  empresaFaturadora: EmpresaFaturadora
  qtdLinhas: number
  tipo: TipoDePedido
  diasParados: number
  estadoDoPrazo: EstadoDoPrazo
  dataEntrada: string
  /**
   * O instante exato da entrada, em ISO. `dataEntrada` é só a data, no formato
   * que o componente exibe — o painel precisa da hora para dizer "chegou às 07:42".
   */
  entradaEm: string
  dataSituacao: string
  dataPortabilidade: string | null
  valorVenda: number
  vendedor: string
  observacao: string
  encerrado: boolean
}

/** O que a tela precisa. `quantidade` das situações é calculada, não guardada. */
export interface DadosDaLista {
  pedidos: PedidoDaLista[]
  situacoes: (ReturnType<typeof situacao> & { quantidade: number })[]
  opcoesDeFiltro: {
    responsaveis: string[]
    operadoras: Operadora[]
    empresasFaturadoras: EmpresaFaturadora[]
  }
  resumo: { totalEmAberto: number; totalEstourados: number; atualizadoEm: string }
}

const soDigitos = (s: string) => s.replace(/\D/g, '')

/** Casa número do pedido, razão social e documento — com e sem pontuação. */
function casaBusca(p: PedidoDaLista, termo: string): boolean {
  const t = termo.trim().toLowerCase()
  if (t === '') return true
  if (p.numero.toLowerCase().includes(t)) return true
  if (p.cliente.razaoSocial.toLowerCase().includes(t)) return true
  const digitos = soDigitos(t)
  return digitos !== '' && p.cliente.cnpjCpf.includes(digitos)
}

/**
 * Aplica os filtros com E lógico.
 *
 * `ignorarSituacao` existe para a contagem dos chips: o chip de um status conta
 * quantos pedidos cairiam nele **com os demais filtros aplicados**. Sem isso, o
 * usuário clica num chip que diz "3" e recebe zero linhas — o defeito que o
 * tests.md da seção chama pelo nome.
 */
function filtrar(
  lista: PedidoDaLista[], f: FiltrosAtivos, ignorarSituacao = false,
): PedidoDaLista[] {
  return lista.filter((p) => {
    if (!f.incluirEncerrados && p.encerrado) return false
    if (!ignorarSituacao && f.situacoes.length && !f.situacoes.includes(p.situacaoId)) return false
    if (f.responsaveis.length && !f.responsaveis.includes(p.responsavel)) return false
    if (f.operadoras.length && !f.operadoras.includes(p.operadora)) return false
    if (f.empresasFaturadoras.length && !f.empresasFaturadoras.includes(p.empresaFaturadora)) return false
    return casaBusca(p, f.busca)
  })
}

export async function listarPedidos(f: FiltrosAtivos): Promise<DadosDaLista> {
  const linhas = await db
    .select({ pedido: pedidos, cliente: clientes })
    .from(pedidos)
    .innerJoin(clientes, eq(pedidos.cnpjCpf, clientes.cnpjCpf))

  const agora = new Date()

  const todos: PedidoDaLista[] = linhas.map(({ pedido: p, cliente: c }) => {
    const situacaoId = p.situacaoId as SituacaoId
    const diasParados = diasUteisEntre(p.dataSituacao, agora)
    return {
      numero: p.numero,
      cliente: { razaoSocial: c.razaoSocial, cnpjCpf: c.cnpjCpf },
      situacaoId,
      responsavel: p.responsavel,
      operadora: p.operadora as Operadora,
      empresaFaturadora: p.empresaFaturadora as EmpresaFaturadora,
      qtdLinhas: p.qtdLinhas,
      tipo: p.tipo as TipoDePedido,
      diasParados,
      estadoDoPrazo: estadoDoPrazo({
        situacaoId, diasParados, dataPortabilidade: p.dataPortabilidade, hoje: agora,
      }),
      dataEntrada: dataDoDesign(p.dataEntrada),
      entradaEm: p.dataEntrada.toISOString(),
      dataSituacao: dataDoDesign(p.dataSituacao),
      dataPortabilidade: p.dataPortabilidade,
      valorVenda: Number(p.precoVenda) * p.qtdLinhas,
      vendedor: p.vendedor,
      observacao: p.observacao,
      encerrado: situacao(situacaoId).encerra,
    }
  })

  const visiveis = filtrar(todos, f)
  const paraContagem = filtrar(todos, f, true)
  const emAberto = todos.filter((p) => !p.encerrado)

  return {
    pedidos: visiveis,
    // Status sem pedido continua aparecendo como chip e cabeçalho — é informação,
    // não erro. Por isso a lista vem inteira, com quantidade zero quando for o caso.
    situacoes: SITUACOES.map((s) => ({
      ...s,
      quantidade: paraContagem.filter((p) => p.situacaoId === s.id).length,
    })),
    opcoesDeFiltro: {
      responsaveis: [...new Set(todos.map((p) => p.responsavel))].sort(),
      operadoras: [...new Set(todos.map((p) => p.operadora))].sort(),
      empresasFaturadoras: [...new Set(todos.map((p) => p.empresaFaturadora))].sort(),
    },
    resumo: {
      totalEmAberto: emAberto.length,
      totalEstourados: emAberto.filter((p) => p.estadoDoPrazo === 'estourado').length,
      atualizadoEm: dataHoraDoDesign(agora),
    },
  }
}
