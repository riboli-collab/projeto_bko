'use server'

import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/cliente'
import { pedidos, historicoDeSituacao } from '@/db/schema'
import { validarTransicao } from '@/dominio/maquina-de-estados'
import { diasUteisEntre, estadoDoPrazo } from '@/dominio/relogio'
import type { SituacaoId, TipoDePedido } from '@/dominio/tipos'
import { exigirUsuario } from './sessao'
import { podeMudarSituacao, papelDe } from '@/dominio/permissoes'

/**
 * `quem` não é parâmetro: sai da sessão.
 *
 * Argumento de Server Action vem do navegador. Recebendo o autor de fora, uma
 * chamada forjada assinaria a transição com o nome de qualquer colega — e o
 * histórico, que existe para ser prova, viraria opinião.
 */
export async function mudarSituacao(
  numero: string, destino: SituacaoId, motivo: string,
) {
  const { nome: quem, papel } = await exigirUsuario()

  return await db.transaction(async (tx) => {
    const [p] = await tx.select().from(pedidos).where(eq(pedidos.numero, numero))
    if (!p) return { ok: false as const, motivo: 'Pedido não encontrado.' }

    const atual = p.situacaoId as SituacaoId

    // O papel decide antes da máquina de estados: não adianta conferir se o
    // processo permite a transição se esta pessoa não pode fazê-la de todo
    // modo. E aqui é a autoridade — a tela desabilita o botão, mas botão
    // desabilitado é decoração para quem chama a ação direto.
    const permissao = podeMudarSituacao({
      papel: papelDe(papel), de: atual, para: destino,
    })
    if (!permissao.pode) return { ok: false as const, motivo: permissao.motivo! }

    // De onde o pedido veio — é o que permite PARADO retomar de onde travou.
    const [ultima] = await tx
      .select().from(historicoDeSituacao)
      .where(eq(historicoDeSituacao.numeroDoPedido, numero))
      .orderBy(desc(historicoDeSituacao.id)).limit(1)

    const veredito = validarTransicao({
      atual, destino, tipo: p.tipo as TipoDePedido,
      motivo, temComprovante: p.temComprovante,
      situacaoAnterior: (ultima?.de ?? null) as SituacaoId | null,
    })
    if (!veredito.ok) return veredito

    const agora = new Date()
    const diasNaSituacao = diasUteisEntre(p.dataSituacao, agora)
    const estourou = estadoDoPrazo({
      situacaoId: atual, diasParados: diasNaSituacao,
      dataPortabilidade: p.dataPortabilidade, hoje: agora,
    }) === 'estourado'

    // Toda transição grava data, autor, motivo e o tempo na situação de origem.
    await tx.insert(historicoDeSituacao).values({
      numeroDoPedido: numero, de: atual, para: destino,
      quando: agora, quem, motivo, diasNaSituacao, estourouOPrazo: estourou,
    })

    // Ao mudar de situação, o relógio zera.
    await tx.update(pedidos)
      .set({ situacaoId: destino, dataSituacao: agora })
      .where(eq(pedidos.numero, numero))

    revalidatePath(`/pedidos/${numero}`)
    revalidatePath('/pedidos')
    revalidatePath('/painel')
    return { ok: true as const }
  })
}
