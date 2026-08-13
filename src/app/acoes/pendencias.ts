'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/cliente'
import { pedidos, pendencias } from '@/db/schema'
import type { SituacaoId } from '@/dominio/tipos'
import { exigirUsuario } from './sessao'
import { podeMexerEmPendencia, papelDe } from '@/dominio/permissoes'

/** Quem abre sai da sessão, não da tela. Ver `mudarSituacao`. */
export async function abrirPendencia(
  numero: string, pergunta: string, dono: string,
) {
  const { nome: quem, papel } = await exigirUsuario()
  const permissao = podeMexerEmPendencia(papelDe(papel))
  if (!permissao.pode) return { ok: false as const, motivo: permissao.motivo! }

  // Dono é obrigatório e é uma pessoa. A tela também bloqueia, mas a regra
  // vive aqui: uma pendência sem dono é uma pergunta que ninguém respondeu.
  if (!pergunta.trim()) return { ok: false as const, motivo: 'A pergunta não pode ficar vazia.' }
  if (!dono.trim()) return { ok: false as const, motivo: 'Toda pendência precisa de um nome, não de um setor.' }

  const [p] = await db.select().from(pedidos).where(eq(pedidos.numero, numero))
  if (!p) return { ok: false as const, motivo: 'Pedido não encontrado.' }

  // A pendência mora no status em que o pedido travou — não num índice separado.
  await db.insert(pendencias).values({
    numeroDoPedido: numero,
    situacaoId: p.situacaoId as SituacaoId,
    pergunta: pergunta.trim(),
    dono: dono.trim(),
    abertaPor: quem,
  })

  revalidatePath(`/pedidos/${numero}`)
  return { ok: true as const }
}

export async function responderPendencia(
  id: number, resposta: string, ehRegra: boolean,
) {
  const { nome: quem, papel } = await exigirUsuario()
  const permissao = podeMexerEmPendencia(papelDe(papel))
  if (!permissao.pode) return { ok: false as const, motivo: permissao.motivo! }

  if (!resposta.trim()) return { ok: false as const, motivo: 'A resposta não pode ficar vazia.' }

  const [x] = await db.select().from(pendencias).where(eq(pendencias.id, id))
  if (!x) return { ok: false as const, motivo: 'Pendência não encontrada.' }

  await db.update(pendencias)
    .set({ resposta: resposta.trim(), respondidaPor: quem, respondidaEm: new Date(), ehRegra })
    .where(eq(pendencias.id, id))

  revalidatePath(`/pedidos/${x.numeroDoPedido}`)
  return { ok: true as const }
}
