'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { emitirSessao, DURACAO_MS, NOME_DO_COOKIE, TROCA_DE_SENHA } from '@/dominio/sessao'
import { conferirSenha } from '@/dominio/senha'
import { credenciais, marcarAcesso } from '@/consultas/usuarios'

/**
 * A mesma resposta para usuário que não existe, senha errada e conta
 * desativada.
 *
 * Distinguir os três transformaria a tela num verificador de quem trabalha
 * aqui: bastaria digitar nomes até parar de aparecer "usuário não encontrado".
 */
const RECUSA = { erro: 'Usuário ou senha incorretos.' }

export async function entrar(_anterior: unknown, formulario: FormData) {
  const segredo = process.env.SEGREDO_DA_SESSAO
  if (!segredo) {
    // Falha de configuração é dita como falha de configuração. Sem isto, o
    // sintoma seria "minha senha parou de funcionar" para a equipe inteira.
    return { erro: 'A Esteira está sem SEGREDO_DA_SESSAO configurado. Avise quem cuida do sistema.' }
  }

  const nomeDeUsuario = String(formulario.get('usuario') ?? '')
  const digitada = String(formulario.get('senha') ?? '')
  const de = String(formulario.get('de') ?? '/painel')

  const conta = await credenciais(nomeDeUsuario)

  // Confere a senha mesmo sem conta, contra um hash que nunca vai bater: sem
  // isso, usuário inexistente responde na hora e usuário real demora o scrypt,
  // e essa diferença de tempo entrega quem existe.
  const hash = conta?.senhaHash ?? 'scrypt$16384$8$1$00$00'
  const senhaConfere = await conferirSenha(digitada, hash)

  if (!conta || !conta.ativo || !senhaConfere) return RECUSA

  const cookieStore = await cookies()
  // O aviso de troca entra no cookie assinado: é assim que o proxy sabe, no
  // Edge, que só a tela de troca pode abrir para esta pessoa.
  const sessao = { usuarioId: conta.id, precisaTrocarSenha: conta.precisaTrocarSenha }
  cookieStore.set(NOME_DO_COOKIE, await emitirSessao(sessao, segredo), {
    httpOnly: true,               // JavaScript da página não lê a sessão
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_MS / 1000,
  })
  await marcarAcesso(conta.id)

  // Quem ainda usa a senha de estreia vai para a troca, não para onde ia. O
  // proxy redirecionaria de qualquer forma; mandar direto evita um salto a mais.
  if (conta.precisaTrocarSenha) redirect(TROCA_DE_SENHA)

  // Só caminho interno: `?de=https://outro.site` viraria redirecionamento aberto.
  redirect(de.startsWith('/') && !de.startsWith('//') ? de : '/painel')
}

export async function sair() {
  const cookieStore = await cookies()
  cookieStore.delete(NOME_DO_COOKIE)
  redirect('/entrar')
}
