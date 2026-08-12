import fs from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { anexos } from '@/db/schema'

/**
 * Lê o arquivo do disco e devolve. O caminho nunca vem da URL — vem do banco,
 * a partir do id. Sem isso, `../../.env.local` seria um caminho válido.
 */
export async function GET(
  _req: Request, { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) return new Response('Anexo não encontrado', { status: 404 })

  const [a] = await db.select().from(anexos).where(eq(anexos.id, numero))
  if (!a) return new Response('Anexo não encontrado', { status: 404 })

  const conteudo = await fs.readFile(a.caminho)
  return new Response(new Uint8Array(conteudo), {
    headers: {
      'Content-Type': a.tipoMime,
      'Content-Disposition': `inline; filename="${encodeURIComponent(a.nome)}"`,
      // Dado pessoal não fica em cache de proxy.
      'Cache-Control': 'private, no-store',
    },
  })
}
