'use server'

import { eq, and, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/cliente'
import { pedidos, clientes, planos, historicoDeSituacao, sequenciaDePedido } from '@/db/schema'
import { responsavelPor } from '@/dominio/roteamento'
import { formatarNumero } from '@/dominio/numeracao'
import { avaliarPreco, type OrigemDoCusto } from '@/dominio/preco'
import { validarPedido } from '@/dominio/validacao-do-pedido'
import { faltamDocumentos, motivoDoBloqueio } from '@/dominio/documentos'
import { listarAnexos, amarrarAnexosAoPedido } from '@/app/acoes/documentos'
import { SITUACOES } from '@/dominio/situacoes'
import { exigirUsuario } from '@/app/acoes/sessao'
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
  observacao: string
  /** Onde os anexos estão pendurados até o pedido ter número. */
  rascunhoId: string
}

const ENCERRADOS: SituacaoId[] = SITUACOES.filter((s) => s.encerra).map((s) => s.id)

export async function criarPedido(entrada: EntradaDePedido) {
  // O vendedor é quem está logado. Era um campo da entrada, vindo do navegador:
  // dava para criar pedido no nome de outra pessoa sem sair do console.
  const { nome: vendedor } = await exigirUsuario()

  // Todos os erros de campo de uma vez, com os identificadores que o componente
  // sabe destacar. O preço fica de fora porque é a única regra que precisa do banco.
  const erros: Record<string, string> = { ...validarPedido(entrada) }

  const doc = entrada.cnpjCpf.replace(/\D/g, '')

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

  // RN4: sem os documentos obrigatórios do tipo de pessoa, o pedido não é criado.
  // Depois dos campos, de propósito — o tipo de pessoa sai do documento, e
  // documento inválido não decide se pede contrato social ou RG.
  const anexados = (await listarAnexos(entrada.rascunhoId)).map((a) => a.documentoId)
  const faltando = faltamDocumentos(doc.length === 11 ? 'PF' : 'PJ', anexados)
  if (faltando.length) {
    // Documento não tem CampoId: a mensagem vai numa chave própria, que a tela
    // mostra no lugar onde o componente explica o botão desabilitado.
    return { ok: false as const, erros: { documentos: motivoDoBloqueio(faltando)! } }
  }

  const criado = await db.transaction(async (tx) => {
    // O cliente pode ser novo: cadastro só existe uma vez, chaveado pelo documento (RN5).
    await tx.insert(clientes).values({
      cnpjCpf: doc, tipo: doc.length === 11 ? 'PF' : 'PJ',
      razaoSocial: entrada.razaoSocial, contato: entrada.contato,
      contatoIncompleto: false,
      emailFinanceiro: entrada.emailFinanceiro, emailAssinatura: entrada.emailAssinatura,
      telefone: entrada.telefone, enderecoFiscal: entrada.enderecoFiscal,
    }).onConflictDoUpdate({
      target: clientes.cnpjCpf,
      // O contato corrigido **volta para a base** — é o que fecha o ciclo do
      // critério 4b em vez de só reclamar na tela. A validação já garantiu que
      // ele tem nome e sobrenome, então a marca de incompleto cai junto.
      //
      // Razão social NÃO entra: divergência de cadastro é registro, não correção
      // silenciosa (Tarefa 16). E-mail financeiro também não — é o único campo
      // de contato que a base já trazia preenchido, e sobrescrever apagaria o
      // que o Financeiro conferiu para colocar o que o Comercial digitou de novo.
      set: {
        contato: entrada.contato,
        contatoIncompleto: false,
        telefone: entrada.telefone,
        emailAssinatura: entrada.emailAssinatura,
        enderecoFiscal: entrada.enderecoFiscal,
      },
    })

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
      vendedor,
      observacao: entrada.observacao,
      dataEntrada: agora, dataSituacao: agora,
    })

    // Primeira linha do histórico: `de` nulo — o pedido não veio de situação nenhuma, nasceu.
    await tx.insert(historicoDeSituacao).values({
      numeroDoPedido: numero, de: null, para: 'PEDIDO_DO_COMERCIAL',
      quando: agora, quem: vendedor, motivo: '', diasNaSituacao: 0, estourouOPrazo: false,
    })

    return { ok: true as const, numero, responsavel }
  })

  // Fora da transação: mover arquivo não desfaz junto com um rollback, e o
  // pedido já existe. Falhar aqui deixa o anexo no rascunho — recuperável —
  // em vez de deixar o pedido sem número.
  await amarrarAnexosAoPedido(entrada.rascunhoId, criado.numero)

  // Sem isto o pedido nasce no banco e a fila continua mostrando a página
  // anterior: quem acabou de criar não encontra o próprio pedido.
  revalidatePath('/pedidos')
  revalidatePath('/painel')
  return criado
}

export async function acharDuplicidade(cnpjCpf: string, qtdLinhas: number) {
  const doc = cnpjCpf.replace(/\D/g, '')
  const abertos = await db.select().from(pedidos).where(
    and(eq(pedidos.cnpjCpf, doc), eq(pedidos.qtdLinhas, qtdLinhas)),
  )
  const emAberto = abertos.filter((p) => !ENCERRADOS.includes(p.situacaoId as SituacaoId))
  return emAberto[0] ?? null
}
