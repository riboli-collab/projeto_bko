import 'server-only'
import { cookies } from 'next/headers'
import { NOME_DO_COOKIE, usuarioDaSessao } from '@/dominio/sessao'
import { usuarioAtivo, type UsuarioDaSessao } from '@/consultas/usuarios'

/**
 * Quem está agindo — lido do cookie, no servidor, sempre.
 *
 * Esta é a peça que torna o histórico auditável. Antes, o autor vinha da tela:
 * `criarPedido` recebia `vendedor` e `mudarSituacao` recebia `quem` como
 * argumento, e argumento de Server Action vem do navegador — qualquer um com o
 * console aberto assinava a transição com o nome que quisesse. Agora a
 * assinatura vem daqui, e não há como passar por cima dela.
 *
 * `server-only` no topo é a trava: importar este arquivo de um componente de
 * cliente passa a quebrar o build, em vez de arrastar o cookie e o driver do
 * Postgres para o navegador.
 */
export async function usuarioAtual(): Promise<UsuarioDaSessao | null> {
  const segredo = process.env.SEGREDO_DA_SESSAO
  if (!segredo) return null

  const cookie = (await cookies()).get(NOME_DO_COOKIE)?.value
  const id = await usuarioDaSessao(cookie, segredo)
  if (id === null) return null

  // Confere `ativo` a cada uso: o proxy não consegue, e sem isto quem foi
  // desativado continuaria trabalhando até o cookie vencer.
  return usuarioAtivo(id)
}

/**
 * O mesmo, mas recusando o trabalho quando não há ninguém.
 *
 * As ações que **escrevem** usam esta. A recusa é uma exceção de propósito: uma
 * ação de escrita que segue com autor desconhecido é pior do que uma que falha.
 */
export async function exigirUsuario(): Promise<UsuarioDaSessao> {
  const usuario = await usuarioAtual()
  if (!usuario) throw new Error('Sessão expirada. Entre de novo para continuar.')
  return usuario
}
