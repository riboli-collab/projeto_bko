import { db } from '@/db/cliente'
import { pedidos } from '@/db/schema'
import { situacao } from '@/dominio/situacoes'
import { estadoDoPrazo, diasUteisEntre } from '@/dominio/relogio'
import type { SituacaoId } from '@/dominio/tipos'

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
