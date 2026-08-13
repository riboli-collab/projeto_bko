import { eq } from 'drizzle-orm'
import { db } from '@/db/cliente'
import { usuarios } from '@/db/schema'

/** O que a aplicação pode saber de quem entrou. O hash nunca sai daqui. */
export interface UsuarioDaSessao {
  id: number
  usuario: string
  nome: string
  papel: string
}

const publico = {
  id: usuarios.id, usuario: usuarios.usuario, nome: usuarios.nome, papel: usuarios.papel,
}

/** Normaliza o que se digita: "  Raquel " e "raquel" são a mesma pessoa. */
export const normalizarUsuario = (valor: string) => (valor ?? '').trim().toLowerCase()

/**
 * O usuário e o hash, para o login conferir.
 *
 * Devolve inativos também: quem decide o que fazer com eles é o login, que
 * responde a mesma coisa para senha errada e para conta desativada.
 */
export async function credenciais(nomeDeUsuario: string) {
  const [u] = await db.select().from(usuarios)
    .where(eq(usuarios.usuario, normalizarUsuario(nomeDeUsuario)))
  return u ?? null
}

/**
 * Quem é o id da sessão — só se ainda estiver ativo.
 *
 * A conferência de `ativo` acontece aqui, e não no proxy, porque o proxy roda
 * no Edge sem banco. É o que faz desativar alguém ter efeito na hora, em vez de
 * esperar as oito horas do cookie vencerem.
 */
export async function usuarioAtivo(id: number): Promise<UsuarioDaSessao | null> {
  const [u] = await db.select({ ...publico, ativo: usuarios.ativo }).from(usuarios)
    .where(eq(usuarios.id, id))
  if (!u || !u.ativo) return null

  const { ativo: _, ...dados } = u
  return dados
}

export async function marcarAcesso(id: number) {
  await db.update(usuarios).set({ ultimoAcesso: new Date() }).where(eq(usuarios.id, id))
}
