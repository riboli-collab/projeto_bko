import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/app/acoes/sessao'
import { FormularioDeTroca } from './FormularioDeTroca'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Trocar a senha — Esteira' }

export default async function TrocarSenha() {
  // Exige sessão: esta rota não está em ABERTOS. O proxy já barra, e a
  // verificação aqui cobre quem chegar por outro caminho.
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/entrar')

  return <FormularioDeTroca nome={usuario.nome} obrigatoria={usuario.precisaTrocarSenha} />
}
