'use server'

import { eq, and, inArray, sql } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { pedidos, clientes, planos, historicoDeSituacao, sequenciaDePedido } from '@/db/schema'
import { responsavelPor } from '@/dominio/roteamento'
import { formatarNumero } from '@/dominio/numeracao'
import { avaliarPreco, type OrigemDoCusto } from '@/dominio/preco'
import { SITUACOES } from '@/dominio/situacoes'
import type { Operadora, EmpresaFaturadora, TipoDePedido, TipoDeChip, FormaDeEntrega, CanalDeVenda, SituacaoId, Endereco, EnderecoDeEntrega } from '@/dominio/tipos'

export interface EntradaDePedido {
  cnpjCpf: string
  razaoSocial: string
  enderecoFiscal: Endereco
  contato: string
  telefone: string
  emailAssinatura: string
  emailFinanceiro: string
  qtdLinhas: number
  canalDeVenda: CanalDeVenda
  operadora: Operadora
  planoId: string
  precoVenda: number
  valorDoChip: number
  empresaFaturadora: EmpresaFaturadora
  tipo: TipoDePedido
  tipoDeChip: TipoDeChip
  formaDeEntrega: FormaDeEntrega | null
  enderecoDeEntrega: EnderecoDeEntrega | null
  dataPortabilidade: string | null
  vendedor: string
  observacao: string
}

const ENCERRADOS: SituacaoId[] = SITUACOES.filter((s) => s.encerra).map((s) => s.id)

export async function criarPedido(entrada: EntradaDePedido) {
  const erros: Record<string, string> = {}

  const doc = entrada.cnpjCpf.replace(/\D/g, '')
  if (doc.length !== 11 && doc.length !== 14) {
    erros.cnpjCpf = `CNPJ tem 14 dígitos e CPF tem 11 — você digitou ${doc.length}`
  }
  if (!entrada.empresaFaturadora) {
    erros.empresaFaturadora = 'Empresa faturadora em branco não passa, e não se preenche por dedução'
  }
  if (entrada.qtdLinhas <= 0) erros.qtdLinhas = 'Quantidade de linhas precisa ser maior que zero'
  if (entrada.precoVenda <= 0) erros.precoVenda = 'Preço de venda precisa ser maior que zero'
  if (entrada.tipo === 'Portabilidade' && !entrada.dataPortabilidade) {
    erros.dataPortabilidade = 'Portabilidade exige a data agendada'
  }
  if (entrada.tipoDeChip === 'Físico' && !entrada.formaDeEntrega) {
    erros.formaDeEntrega = 'Chip físico exige forma de entrega'
  }

  const [plano] = await db.select().from(planos).where(eq(planos.id, entrada.planoId))
  if (!plano) {
    erros.plano = 'Plano não encontrado'
  } else {
    const preco = avaliarPreco({
      precoVenda: entrada.precoVenda,
      plano: {
        id: plano.id, nome: plano.nome, operadora: plano.operadora as Operadora,
        custoPorLinha: plano.custoPorLinha === null ? null : Number(plano.custoPorLinha),
        // A procedência viaja com o custo: é ela que decide se o bloqueio vale
        // como conferência ou é palpite de planilha.
        origem: plano.origemDoCusto as OrigemDoCusto,
      },
    })
    if (preco.tipo === 'bloqueado') {
      erros.precoVenda =
        `Preço abaixo do custo do plano ${preco.bloqueio.planoNome} — falta R$ ${preco.bloqueio.diferenca.toFixed(2)} por linha`
    }
  }

  if (Object.keys(erros).length) return { ok: false as const, erros }

  return await db.transaction(async (tx) => {
    // O cliente pode ser novo: cadastro só existe uma vez, chaveado pelo documento (RN5).
    await tx.insert(clientes).values({
      cnpjCpf: doc, tipo: doc.length === 11 ? 'PF' : 'PJ',
      razaoSocial: entrada.razaoSocial, contato: entrada.contato,
      emailFinanceiro: entrada.emailFinanceiro, emailAssinatura: entrada.emailAssinatura,
      telefone: entrada.telefone, enderecoFiscal: entrada.enderecoFiscal,
    }).onConflictDoNothing()

    const ano = new Date().getFullYear()
    const [seq] = await tx
      .insert(sequenciaDePedido).values({ ano, ultimo: 1 })
      .onConflictDoUpdate({
        target: sequenciaDePedido.ano,
        set: { ultimo: sql`${sequenciaDePedido.ultimo} + 1` },
      })
      .returning()

    const numero = formatarNumero(ano, seq.ultimo)
    const responsavel = responsavelPor(entrada.operadora)
    const agora = new Date()

    await tx.insert(pedidos).values({
      numero, cnpjCpf: doc,
      situacaoId: 'PEDIDO_DO_COMERCIAL',
      responsavel,
      operadora: entrada.operadora,
      empresaFaturadora: entrada.empresaFaturadora,
      canalDeVenda: entrada.canalDeVenda,
      planoId: entrada.planoId,
      qtdLinhas: entrada.qtdLinhas,
      precoVenda: entrada.precoVenda.toFixed(2),
      valorDoChip: entrada.valorDoChip.toFixed(2),
      tipo: entrada.tipo,
      tipoDeChip: entrada.tipoDeChip,
      formaDeEntrega: entrada.formaDeEntrega,
      enderecoDeEntrega: entrada.enderecoDeEntrega,
      dataPortabilidade: entrada.dataPortabilidade,
      vendedor: entrada.vendedor,
      observacao: entrada.observacao,
      dataEntrada: agora, dataSituacao: agora,
    })

    // Primeira linha do histórico: `de` nulo — o pedido não veio de situação nenhuma, nasceu.
    await tx.insert(historicoDeSituacao).values({
      numeroDoPedido: numero, de: null, para: 'PEDIDO_DO_COMERCIAL',
      quando: agora, quem: entrada.vendedor, motivo: '', diasNaSituacao: 0, estourouOPrazo: false,
    })

    return { ok: true as const, numero, responsavel }
  })
}

export async function acharDuplicidade(cnpjCpf: string, qtdLinhas: number) {
  const doc = cnpjCpf.replace(/\D/g, '')
  const abertos = await db.select().from(pedidos).where(
    and(eq(pedidos.cnpjCpf, doc), eq(pedidos.qtdLinhas, qtdLinhas)),
  )
  const emAberto = abertos.filter((p) => !ENCERRADOS.includes(p.situacaoId as SituacaoId))
  return emAberto[0] ?? null
}
