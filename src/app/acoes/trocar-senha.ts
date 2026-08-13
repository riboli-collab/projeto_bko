'use server'

import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db/cliente'
import { usuarios } from '@/db/schema'
import { conferirSenha, gerarHash } from '@/dominio/senha'
import { validarNovaSenha } from '@/dominio/regra-da-senha'
import { emitirSessao, DURACAO_MS, NOME_DO_COOKIE } from '@/dominio/sessao'
import { usuarioAtual } from './sessao'

/**
 * A pessoa define a própria senha.
 *
 * Serve para os dois casos: a troca obrigatória da senha de estreia e a troca
 * voluntária, pelo menu. O que muda entre eles é só para onde se volta no fim.
 *
 * A senha atual é exigida nos dois — inclusive na obrigatória. Sem ela, um
 * computador deixado aberto vira uma conta sequestrada: bastaria abrir a tela
 * de troca e escolher outra senha.
 */
export async function trocarSenha(_anterior: unknown, formulario: FormData) {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/entrar')

  const atual = String(formulario.get('atual') ?? '')
  const nova = String(formulario.get('nova') ?? '')
  const confirmacao = String(formulario.get('confirmacao') ?? '')

  const [conta] = await db.select().from(usuarios).where(eq(usuarios.id, usuario.id))
  if (!conta) redirect('/entrar')

  if (!(await conferirSenha(atual, conta.senhaHash))) {
    return { erro: 'A senha atual não confere.' }
  }

  const problema = validarNovaSenha(nova, confirmacao)
  if (problema) return { erro: problema }

  if (await conferirSenha(nova, conta.senhaHash)) {
    return { erro: 'A senha nova é igual à atual. Escolha uma diferente.' }
  }

  await db.update(usuarios)
    .set({ senhaHash: await gerarHash(nova), precisaTrocarSenha: false })
    .where(eq(usuarios.id, usuario.id))

  // O cookie precisa ser reemitido: o aviso de troca viaja dentro dele, e sem
  // reemitir a pessoa continuaria sendo mandada para esta tela até a sessão
  // vencer — depois de já ter feito o que se pediu.
  const segredo = process.env.SEGREDO_DA_SESSAO
  if (segredo) {
    const cookieStore = await cookies()
    cookieStore.set(
      NOME_DO_COOKIE,
      await emitirSessao({ usuarioId: usuario.id, precisaTrocarSenha: false }, segredo),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: DURACAO_MS / 1000,
      },
    )
  }

  redirect('/painel')
}
