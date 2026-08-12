import { eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { clientes } from '@/db/schema'

export async function buscarCliente(cnpjCpf: string) {
  const doc = cnpjCpf.replace(/\D/g, '')
  if (doc.length !== 11 && doc.length !== 14) return null
  const [c] = await db.select().from(clientes).where(eq(clientes.cnpjCpf, doc))
  return c ?? null
}
