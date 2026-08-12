'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { emitirSessao, DURACAO_MS, NOME_DO_COOKIE } from '@/dominio/sessao'

/** Espera um pouco antes de recusar, para a tela não virar um oráculo de senha. */
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function entrar(_anterior: unknown, formulario: FormData) {
  const senhaCerta = process.env.SENHA_DE_ACESSO
  if (!senhaCerta) redirect('/painel')

  const digitada = String(formulario.get('senha') ?? '')
  const de = String(formulario.get('de') ?? '/painel')

  if (digitada !== senhaCerta) {
    await esperar(600)
    return { erro: 'Senha incorreta.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(NOME_DO_COOKIE, await emitirSessao(senhaCerta), {
    httpOnly: true,               // JavaScript da página não lê a sessão
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_MS / 1000,
  })

  // Só caminho interno: `?de=https://outro.site` viraria redirecionamento aberto.
  redirect(de.startsWith('/') && !de.startsWith('//') ? de : '/painel')
}

export async function sair() {
  const cookieStore = await cookies()
  cookieStore.delete(NOME_DO_COOKIE)
  redirect('/entrar')
}
