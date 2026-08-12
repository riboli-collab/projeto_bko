import { eq, asc, desc } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { pedidos, clientes, historicoDeSituacao, pendencias } from '@/db/schema'
import { situacao, SITUACOES, formaDeEntregaExibida } from '@/dominio/situacoes'
import { formatarEndereco } from '@/dominio/endereco'
import { dataDoDesign, dataHoraDoDesign } from '@/dominio/datas'
import { diasUteisEntre, estadoDoPrazo } from '@/dominio/relogio'
import { calcularCobranca } from '@/dominio/cobranca'
import { transicoesDisponiveis } from '@/dominio/maquina-de-estados'
import type {
  SituacaoId, TipoDePedido, TipoDeChip, FormaDeEntrega, Operadora, EmpresaFaturadora,
} from '@/dominio/tipos'
import type { FormaDeEntrega as FormaDeEntregaExibida } from '@/design/secoes/status-do-pedido/types'

/** Quem pode ser dono de pendência. Uma pessoa, nunca um setor. */
export const PESSOAS = [
  'Raquel', 'Tamara', 'Gabrielle Souza', 'Hiago Ferreira', 'Supervisor',
] as const

export async function carregarPedido(numero: string) {
  const [linha] = await db
    .select({ pedido: pedidos, cliente: clientes })
    .from(pedidos)
    .innerJoin(clientes, eq(pedidos.cnpjCpf, clientes.cnpjCpf))
    .where(eq(pedidos.numero, numero))

  if (!linha) return null
  const { pedido: p, cliente: c } = linha

  const agora = new Date()
  const situacaoId = p.situacaoId as SituacaoId
  const tipo = p.tipo as TipoDePedido
  const diasParados = diasUteisEntre(p.dataSituacao, agora)

  const historicoBruto = await db
    .select().from(historicoDeSituacao)
    .where(eq(historicoDeSituacao.numeroDoPedido, numero))
    .orderBy(asc(historicoDeSituacao.id))

  // A régua e a tela leem o histórico do mais recente para o mais antigo; a
  // situação anterior sai da ÚLTIMA linha, e é ela que deixa PARADO retomar.
  const ultima = historicoBruto[historicoBruto.length - 1]
  const situacaoAnterior = (ultima?.de ?? null) as SituacaoId | null

  const pendenciasDoPedido = await db
    .select().from(pendencias)
    .where(eq(pendencias.numeroDoPedido, numero))
    .orderBy(desc(pendencias.id))

  const diasCorridos = (d: Date) =>
    Math.max(0, Math.floor((agora.getTime() - d.getTime()) / 86_400_000))

  return {
    pedido: {
      numero: p.numero,
      cliente: {
        razaoSocial: c.razaoSocial, cnpjCpf: c.cnpjCpf,
        // A ficha mostra o endereço em uma linha; o formulário coleta sete campos.
        enderecoFiscal: formatarEndereco(c.enderecoFiscal), contato: c.contato,
        telefone: c.telefone, emailAssinatura: c.emailAssinatura,
        emailFinanceiro: c.emailFinanceiro,
      },
      situacaoId,
      responsavel: p.responsavel,
      operadora: p.operadora as Operadora,
      empresaFaturadora: p.empresaFaturadora as EmpresaFaturadora,
      plano: p.planoId,
      qtdLinhas: p.qtdLinhas,
      tipo,
      // D2: eSIM é tipo de chip, mas a tela o exibe na linha de entrega.
      // D2: o Status tipa a entrega com 'eSIM' incluído — é a versão da linha 58
      // do overview. `formaDeEntregaExibida` devolve exatamente um desses valores.
      formaDeEntrega: formaDeEntregaExibida({
        tipoDeChip: p.tipoDeChip as TipoDeChip,
        formaDeEntrega: p.formaDeEntrega as FormaDeEntrega | null,
      }) as FormaDeEntregaExibida,
      // Mesma conversão do endereço fiscal: a ficha mostra uma linha, e o
      // recebedor vai junto porque é ele quem assina no motoboy.
      enderecoDeEntrega: p.enderecoDeEntrega
        ? [formatarEndereco(p.enderecoDeEntrega), p.enderecoDeEntrega.recebedor]
            .filter(Boolean).join(' · aos cuidados de ')
        : '',
      // POR LINHA, não o total. `DadosDoPedido` escreve "por linha" ao lado do
      // número, e o sample-data da seção confirma: 62,90 com 8 linhas. A Lista
      // usa o MESMO nome de campo para o total do pedido (1.259,86 com 14
      // linhas) — dois significados, um nome só, em seções diferentes do mesmo
      // pacote. Multiplicar aqui fazia a ficha dizer que a linha custa oito
      // vezes o que custa. O total do pedido está no resumo da cobrança.
      valorVenda: Number(p.precoVenda),
      vendedor: p.vendedor,
      dataEntrada: dataDoDesign(p.dataEntrada),
      dataSituacao: dataDoDesign(p.dataSituacao),
      diasParados,
      estadoDoPrazo: estadoDoPrazo({
        situacaoId, diasParados, dataPortabilidade: p.dataPortabilidade, hoje: agora,
      }),
      dataPortabilidade: p.dataPortabilidade,
      observacao: p.observacao,
    },
    // Fora de `pedido` de propósito: o tipo `Pedido` é contrato do pacote de
    // design, e o que ele não pede não entra nele.
    cobranca: calcularCobranca({
      precoVenda: Number(p.precoVenda),
      valorDoChip: Number(p.valorDoChip),
      qtdLinhas: p.qtdLinhas,
    }),
    situacoes: SITUACOES.map((s) => ({ ...s })),
    historico: [...historicoBruto].reverse().map((h) => ({
      id: String(h.id),
      de: h.de as SituacaoId | null,
      para: h.para as SituacaoId,
      quando: dataHoraDoDesign(h.quando),
      quem: h.quem,
      motivo: h.motivo,
      diasNaSituacao: h.diasNaSituacao,
      estourouOPrazo: h.estourouOPrazo,
    })),
    pendencias: pendenciasDoPedido.map((x) => ({
      id: String(x.id),
      pergunta: x.pergunta,
      situacaoId: x.situacaoId as SituacaoId,
      dono: x.dono,
      abertaPor: x.abertaPor,
      abertaEm: dataDoDesign(x.abertaEm),
      // Zero quando já foi respondida — o contador é de espera, não de idade.
      diasAberta: x.resposta === null ? diasCorridos(x.abertaEm) : 0,
      resposta: x.resposta,
      respondidaPor: x.respondidaPor,
      respondidaEm: x.respondidaEm ? dataDoDesign(x.respondidaEm) : null,
      ehRegra: x.ehRegra,
    })),
    // A MESMA fonte que a ação de mudar situação usa. Se as duas divergirem, o
    // usuário clica num botão habilitado e leva recusa — por isso é uma só.
    transicoes: transicoesDisponiveis({
      atual: situacaoId, tipo, temComprovante: p.temComprovante, situacaoAnterior,
    }),
    pessoas: [...PESSOAS],
  }
}

export type DadosDoStatus = NonNullable<Awaited<ReturnType<typeof carregarPedido>>>
