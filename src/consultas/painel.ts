import { listarPedidos, FILTROS_VAZIOS, type PedidoDaLista } from './lista'
import { db } from '@/db/cliente'
import { pedidos } from '@/db/schema'
import { situacao } from '@/dominio/situacoes'
import { dataDoDesign } from '@/dominio/datas'
import { diasUteisEntre, estadoDoPrazo } from '@/dominio/relogio'
import type { SituacaoId } from '@/dominio/tipos'

export type PerguntaId =
  | 'prazo-estourado' | 'portabilidade-amanha' | 'entregue-nao-finalizado' | 'chegou-hoje'

const MAX_POR_CARTAO = 5

const reais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ddmm = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
/**
 * Comparação por texto, não por `Date`.
 *
 * `dataEntrada` chega como `2026-08-12`, e `new Date('2026-08-12')` é meia-noite
 * **UTC** — que no fuso de Chapecó é 21h do dia anterior. Comparar assim faz o
 * pedido de hoje sumir do cartão "chegou hoje" às 21h de ontem, em silêncio.
 */
const mesmoDia = (dataDoPedido: string, hoje: Date) => dataDoPedido === dataDoDesign(hoje)

/**
 * Monta um cartão. `destaque` sai daqui **em texto pronto**: o componente exibe,
 * não formata. É isso que permite o mesmo pedido aparecer em dois cartões com
 * informações diferentes — "6 dias parados" num, "portabilidade 13/08" no outro.
 */
function montar(
  id: PerguntaId, titulo: string, acao: string,
  tom: 'vermelho' | 'ambar' | 'azul' | 'neutro', mensagemVazia: string,
  lista: PedidoDaLista[],
  destaque: (p: PedidoDaLista) => string,
  emAlerta = false,
) {
  return {
    id, titulo, acao, tom, mensagemVazia,
    // `total` é o número real; `pedidos` traz no máximo 5. O rodapé "e mais N"
    // do componente sai exatamente dessa diferença.
    total: lista.length,
    pedidos: lista.slice(0, MAX_POR_CARTAO).map((p) => ({
      numero: p.numero,
      razaoSocial: p.cliente.razaoSocial,
      responsavel: p.responsavel,
      situacaoRotulo: situacao(p.situacaoId).rotuloCurto,
      destaque: destaque(p),
      destaqueEmAlerta: emAlerta,
    })),
  }
}

export async function montarPainel(hoje = new Date()) {
  const { pedidos } = await listarPedidos(FILTROS_VAZIOS)   // encerrados já ficam fora
  const amanha = new Date(hoje.getTime() + 86_400_000)

  const estourados = pedidos
    .filter((p) => p.estadoDoPrazo === 'estourado')
    .sort((a, b) => b.diasParados - a.diasParados)

  const portabilidade = pedidos
    // `dataPortabilidade` já é `YYYY-MM-DD` no banco: compara texto com texto.
    .filter((p) => p.dataPortabilidade !== null && mesmoDia(p.dataPortabilidade, amanha))
    .sort((a, b) => (situacao(a.situacaoId).ordem ?? 99) - (situacao(b.situacaoId).ordem ?? 99))

  const entregues = pedidos
    .filter((p) => p.situacaoId === 'ENTREGUE')
    .sort((a, b) => b.valorVenda - a.valorVenda)

  const chegaramHoje = pedidos
    .filter((p) => p.situacaoId === 'PEDIDO_DO_COMERCIAL' &&
      mesmoDia(p.dataEntrada, hoje))
    .sort((a, b) => a.dataEntrada.localeCompare(b.dataEntrada))

  // TÍTULO, AÇÃO E MENSAGEM VAZIA SÃO CÓPIA LITERAL do sample-data do pacote de
  // design. A copy é do design, não desta função — as capturas de tela e o
  // tests.md da seção usam exatamente estas frases. O Step 6 compara as duas.
  const perguntas = [
    montar('prazo-estourado',
      'O que estourou o prazo?',
      'Cobrar quem cuida, hoje.',
      'vermelho', 'Nenhum prazo estourado hoje. A esteira está em dia.',
      estourados, (p) => `${p.diasParados} dias parados`, true),
    montar('portabilidade-amanha',
      'Quais portabilidades são amanhã?',
      'Confirmar o SMS e a janela agendada com o cliente.',
      'ambar', 'Nenhuma portabilidade marcada para amanhã.',
      portabilidade, (p) => `portabilidade ${ddmm(p.dataPortabilidade!)}`),
    montar('entregue-nao-finalizado',
      'O que foi entregue e não finalizado?',
      'Lançar no Custos e finalizar o pedido.',
      'azul', 'Nada entregue esperando finalização.',
      entregues, (p) => reais(p.valorVenda)),
    montar('chegou-hoje',
      'O que chegou hoje para conferir?',
      'Conferir os 17 campos em até 4 horas.',
      'neutro', 'Nenhum pedido novo até agora.',
      chegaramHoje, (p) => `chegou às ${hora(p.entradaEm)}`),
  ]

  return {
    perguntas,
    resumo: {
      totalParaAgir: perguntas.reduce((s, q) => s + q.total, 0),
      dataPorExtenso: hoje.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
      }),
      atualizadoEm: hoje.toISOString(),
    },
  }
}

export type DadosDoPainel = Awaited<ReturnType<typeof montarPainel>>

export async function contarParaOShell(): Promise<{ estourados: number; emAberto: number }> {
  const todos = await db.select().from(pedidos)
  const agora = new Date()

  let estourados = 0
  let emAberto = 0
  for (const p of todos) {
    if (situacao(p.situacaoId as SituacaoId).encerra) continue
    emAberto++
    const dias = diasUteisEntre(p.dataSituacao, agora)
    if (estadoDoPrazo({
      situacaoId: p.situacaoId as SituacaoId,
      diasParados: dias,
      dataPortabilidade: p.dataPortabilidade,
      hoje: agora,
    }) === 'estourado') estourados++
  }
  return { estourados, emAberto }
}

